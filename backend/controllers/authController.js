const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const jwt = require('jsonwebtoken');

// Register
const register = async (req, res) => {
  const { email, password, role, name, phone, address } = req.body;
  try {
    let isApproved = role === 'external'; // Auto-approve external
    const user = new User({ email, password, role, name, phone, address, isApproved });
    await user.save();

    // Log action
    await new AuditLog({ userId: user._id, action: 'register' }).save();

    // Simulate email verification
    console.log(`Verification email sent to ${email}`);

    res.status(201).json({ msg: 'User registered' });
  } catch (err) {
    res.status(400).json({ msg: err.message });
  }
};

// Login
const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ msg: 'Invalid credentials' });
  }
  if (!user.isApproved) return res.status(403).json({ msg: 'Account not approved' });

  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

  // Log action
  await new AuditLog({ userId: user._id, action: 'login' }).save();

  res.json({ token });
};

// Password Reset
const resetPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ msg: 'User not found' });

  // Simulate reset link
  console.log(`Reset link sent to ${email}`);
  res.json({ msg: 'Reset link sent' });
};

module.exports = { register, login, resetPassword };