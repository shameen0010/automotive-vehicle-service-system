const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Appointment = require('../models/Appointment');

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Update profile
router.put('/profile', auth, async (req, res) => {
  const { name, mobileNumber, image } = req.body;
  try {
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { name, mobileNumber, image },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get service history
router.get('/history', auth, async (req, res) => {
  try {
    const appointments = await Appointment.find({ userId: req.user.userId, status: 'completed' })
      .sort({ date: -1 });
    const visitCount = appointments.length;
    let nextServiceDate = null;
    if (visitCount > 0) {
      const lastDate = new Date(appointments[0].date);
      lastDate.setMonth(lastDate.getMonth() + 6);
      nextServiceDate = lastDate.toISOString().split('T')[0];
    }
    res.json({ visitCount, appointments, nextServiceDate });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;