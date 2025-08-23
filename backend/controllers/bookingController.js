const Booking = require('../models/Booking');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const ActivityLog = require('../models/ActivityLog');

// Create Booking (BM-01)
exports.createBooking = async (req, res) => {
  const { date, time, serviceType } = req.body;
  try {
    const booking = new Booking({ userId: req.user.id, date, time, serviceType });
    await booking.save();
    // BM-03: Placeholder for advisor assign (auto or manual later)
    // For now, set advisorId to null; group can update
    // BM-05: Increment visit count
    const user = await User.findById(req.user.id);
    user.visitCount += 1;
    await user.save();
    if (user.visitCount > 5) {
      // Placeholder: Send request to finance (e.g., log or API call later)
      console.log('Request to finance for discount'); // Group connects here
    }
    new ActivityLog({ userId: req.user.id, action: 'booking_create' }).save();
    // BM-04: Schedule reminder (simple setTimeout for 24h before; in prod use cron)
    const reminderTime = new Date(booking.date).getTime() - 24 * 60 * 60 * 1000;
    setTimeout(async () => {
      if (!booking.reminderSent) {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        });
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: user.email,
          subject: 'Booking Reminder',
          text: `Your booking for ${serviceType} on ${date} at ${time} is tomorrow.`,
        });
        booking.reminderSent = true;
        await booking.save();
      }
    }, reminderTime - Date.now());
    res.json(booking);
  } catch (err) {
    res.status(500).send('Server error');
  }
};

// Update/Cancel Booking (BM-02)
exports.updateBooking = async (req, res) => {
  const { date, time, serviceType, action } = req.body; // action: 'update' or 'cancel'
  try {
    const booking = await Booking.findById(req.params.id);
    if (booking.userId.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });
    if (action === 'cancel') {
      // BM-02 rules: e.g., can't cancel within 24h
      if (new Date(booking.date) - Date.now() < 24 * 60 * 60 * 1000) {
        return res.status(400).json({ msg: 'Cannot cancel within 24h' });
      }
      booking.status = 'cancelled';
    } else {
      if (date) booking.date = date;
      if (time) booking.time = time;
      if (serviceType) booking.serviceType = serviceType;
    }
    await booking.save();
    new ActivityLog({ userId: req.user.id, action: `booking_${action}` }).save();
    res.json(booking);
  } catch (err) {
    res.status(500).send('Server error');
  }
};

// Get Bookings (BM-06)
exports.getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.id });
    res.json(bookings);
  } catch (err) {
    res.status(500).send('Server error');
  }
};

// Assign Advisor Placeholder (BM-03) - Manager can call this
exports.assignAdvisor = async (req, res) => {
  const { bookingId, advisorId } = req.body;
  try {
    const booking = await Booking.findById(bookingId);
    booking.advisorId = advisorId; // Group can add availability check
    booking.status = 'confirmed';
    await booking.save();
    res.json(booking);
  } catch (err) {
    res.status(500).send('Server error');
  }
};