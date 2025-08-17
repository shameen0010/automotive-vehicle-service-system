const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Appointment = require('../models/Appointment');
const ServiceAdvisor = require('../models/ServiceAdvisor');

const TIME_SLOTS = [
  '09:00 AM - 09:30 AM', '09:30 AM - 10:00 AM', '10:00 AM - 10:30 AM', '10:30 AM - 11:00 AM',
  '11:00 AM - 11:30 AM', '11:30 AM - 12:00 PM', '12:00 PM - 12:30 PM', '12:30 PM - 01:00 PM',
  '01:00 PM - 01:30 PM', '01:30 PM - 02:00 PM', '02:00 PM - 02:30 PM', '02:30 PM - 03:00 PM',
  '03:00 PM - 03:30 PM', '03:30 PM - 04:00 PM', '04:00 PM - 04:30 PM', '04:30 PM - 05:00 PM',
  '05:00 PM - 05:30 PM', '05:30 PM - 06:00 PM', '06:00 PM - 06:30 PM', '06:30 PM - 07:00 PM'
]; // 20 slots

// Get available slots for a date
router.get('/slots/:date', auth, async (req, res) => {
  try {
    const date = new Date(req.params.date);
    const bookedSlots = await Appointment.find({ date }).select('timeSlot');
    const booked = bookedSlots.map(s => s.timeSlot);
    const available = TIME_SLOTS.filter(slot => !booked.includes(slot));
    res.json(available);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Book appointment
router.post('/', auth, async (req, res) => {
  const { name, mobileNumber, email, vehicleType, vehicleNumber, serviceType, date, timeSlot } = req.body;
  try {
    const existing = await Appointment.findOne({ date: new Date(date), timeSlot });
    if (existing) return res.status(400).json({ msg: 'Slot taken' });

    // Auto assign advisor (random)
    const advisors = await ServiceAdvisor.find();
    if (advisors.length === 0) return res.status(500).json({ msg: 'No advisors available' });
    const advisor = advisors[Math.floor(Math.random() * advisors.length)];

    const appointment = new Appointment({
      userId: req.user.userId,
      name, mobileNumber, email, vehicleType, vehicleNumber, serviceType,
      date: new Date(date), timeSlot, advisorId: advisor._id
    });
    await appointment.save();
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get user's appointments
router.get('/', auth, async (req, res) => {
  try {
    const appointments = await Appointment.find({ userId: req.user.userId }).populate('advisorId', 'name');
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;