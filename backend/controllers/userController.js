const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const nodemailer = require('nodemailer');

// Register (UM-01)
exports.register = async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'User exists' });
    user = new User({ name, email, password, role });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();
    const payload = { id: user.id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }); // UM-04 session
    new ActivityLog({ userId: user.id, action: 'register' }).save();
    res.json({ token });
  } catch (err) {
    res.status(500).send('Server error');
  }
};

// Login (UM-01)
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });
    const payload = { id: user.id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    new ActivityLog({ userId: user.id, action: 'login' }).save();
    res.json({ token });
  } catch (err) {
    res.status(500).send('Server error');
  }
};

// Update Profile (UM-02)
exports.updateProfile = async (req, res) => {
  const { name, email } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (name) user.name = name;
    if (email) user.email = email;
    await user.save();
    new ActivityLog({ userId: user.id, action: 'profile_update' }).save();
    res.json(user);
  } catch (err) {
    res.status(500).send('Server error');
  }
};

// Password Reset (UM-06) - Send OTP via email
exports.resetPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'User not found' });
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Simple OTP
    // Save OTP temporarily (in prod, use Redis or temp field)
    user.tempOTP = otp; // Add tempOTP to User model if needed
    await user.save();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset OTP',
      text: `Your OTP is ${otp}. Valid for 10 mins.`,
    });
    res.json({ msg: 'OTP sent' });
  } catch (err) {
    res.status(500).send('Server error');
  }
};

// Verify OTP and change password
exports.changePassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user.tempOTP !== otp) return res.status(400).json({ msg: 'Invalid OTP' });
    if (newPassword.length < 8) return res.status(400).json({ msg: 'Password too weak' }); // UM-06 rules
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.tempOTP = null;
    await user.save();
    new ActivityLog({ userId: user.id, action: 'password_change' }).save();
    res.json({ msg: 'Password changed' });
  } catch (err) {
    res.status(500).send('Server error');
  }
};

// Get Logs (UM-05, admin only)
exports.getLogs = async (req, res) => {
  try {
    const logs = await ActivityLog.find({ userId: req.params.userId });
    res.json(logs);
  } catch (err) {
    res.status(500).send('Server error');
  }
};