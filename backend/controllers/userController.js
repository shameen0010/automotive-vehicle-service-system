const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// Register
const register = async (req, res) => {
  const { name, email, password, role } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  const user = new User({ name, email, password: hashed, role });
  await user.save();
  new ActivityLog({ userId: user._id, action: 'register' }).save();
  res.status(201).json({ msg: 'User registered' });
};

// Login
const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !await bcrypt.compare(password, user.password)) return res.status(400).json({ msg: 'Invalid credentials' });
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
  new ActivityLog({ userId: user._id, action: 'login' }).save();
  res.json({ token });
};

// Update Profile
const updateProfile = async (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) return res.status(400).json({ msg: 'Invalid input' });
  const user = await User.findByIdAndUpdate(req.user.id, { name, email }, { new: true });
  new ActivityLog({ userId: user._id, action: 'profile_update' }).save();
  res.json(user);
};

// Password Reset (send OTP via email)
const resetPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ msg: 'User not found' });
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Simple OTP
  // Save OTP temporarily (in production, use Redis or temp field)
  user.tempOTP = otp;
  await user.save();

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Password Reset OTP',
    text: `Your OTP is ${otp}. Valid for 10 minutes.`
  });
  res.json({ msg: 'OTP sent' });
};

// Verify OTP and change password
const changePassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (newPassword.length < 8) return res.status(400).json({ msg: 'Password too weak' });
  const user = await User.findOne({ email });
  if (!user || user.tempOTP !== otp) return res.status(400).json({ msg: 'Invalid OTP' });
  user.password = await bcrypt.hash(newPassword, 10);
  user.tempOTP = undefined;
  await user.save();
  new ActivityLog({ userId: user._id, action: 'password_change' }).save();
  res.json({ msg: 'Password changed' });
};

// Get Audit Logs (Admin only)
const getLogs = async (req, res) => {
  const logs = await ActivityLog.find().populate('userId', 'name email');
  res.json(logs);
};

// Assign Role (Manager only)
const assignRole = async (req, res) => {
  const { userId, role } = req.body;
  await User.findByIdAndUpdate(userId, { role });
  res.json({ msg: 'Role assigned' });
};

// Logout (client clears token; server doesn't need action, but log it)
const logout = async (req, res) => {
  new ActivityLog({ userId: req.user.id, action: 'logout' }).save();
  res.json({ msg: 'Logged out' });
};

module.exports = { register, login, updateProfile, resetPassword, changePassword, getLogs, assignRole, logout };