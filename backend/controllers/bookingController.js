const Booking = require('../models/Booking');
const User = require('../models/User');
const DiscountRequest = require('../models/DiscountRequest');
const ActivityLog = require('../models/ActivityLog');
const nodemailer = require('nodemailer');

// Create Booking (BM-01: check available advisors, auto-assign)
const createBooking = async (req, res) => {
  const { date, time, serviceType } = req.body;
  const customerId = req.user.id;

  // Find available advisors (not booked at that date/time; simple check - no overlap logic for simplicity, extend later)
  const advisors = await User.find({ role: 'advisor', availability: { $elemMatch: { date, startTime: { $lte: time }, endTime: { $gte: time } } } });
  const availableAdvisors = advisors.filter(async adv => {
    const conflicting = await Booking.findOne({ advisorId: adv._id, date, time, status: { $ne: 'cancelled' } });
    return !conflicting;
  });
  if (availableAdvisors.length === 0) return res.status(400).json({ msg: 'No advisors available' });

  // Auto-assign random available
  const advisorId = availableAdvisors[Math.floor(Math.random() * availableAdvisors.length)]._id;

  const booking = new Booking({ customerId, date, time, serviceType, advisorId, status: 'confirmed' });
  await booking.save();

  // Increment visit count (assume on confirm; adjust if needed)
  const customer = await User.findById(customerId);
  customer.visitCount += 1;
  await customer.save();

  // BM-05: If >5 visits, send discount request (create in DB for finance)
  if (customer.visitCount > 5) {
    new DiscountRequest({ customerId, visitCount: customer.visitCount }).save();
  }

  new ActivityLog({ userId: customerId, action: 'booking_created' }).save();
  res.status(201).json(booking);
};

// Modify/Cancel Booking (BM-02: e.g., cancel only if >24h before)
const updateBooking = async (req, res) => {
  const { id } = req.params;
  const { date, time, serviceType, status } = req.body;
  const booking = await Booking.findById(id);
  if (!booking || booking.customerId.toString() !== req.user.id) return res.status(404).json({ msg: 'Booking not found' });

  if (status === 'cancelled') {
    const hoursBefore = (new Date(booking.date) - new Date()) / (1000 * 60 * 60);
    if (hoursBefore < 24) return res.status(400).json({ msg: 'Cannot cancel within 24h' });
  }

  Object.assign(booking, { date, time, serviceType, status });
  await booking.save();
  new ActivityLog({ userId: req.user.id, action: 'booking_updated' }).save();
  res.json(booking);
};

// Get Booking Status (BM-06)
const getBookings = async (req, res) => {
  const bookings = await Booking.find({ customerId: req.user.id }).populate('advisorId', 'name');
  res.json(bookings);
};

// Send Reminder (function for cron)
const sendReminder = async (booking) => {
  const user = await User.findById(booking.customerId);
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: 'Appointment Reminder',
    text: `Your booking for ${booking.serviceType} on ${booking.date} at ${booking.time} is tomorrow.`
  });
};

module.exports = { createBooking, updateBooking, getBookings, sendReminder };