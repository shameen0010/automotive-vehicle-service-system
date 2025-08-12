const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

// Get Profile
const getProfile = async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  res.json(user);
};

// Update Profile
const updateProfile = async (req, res) => {
  const updates = req.body;
  const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-password');

  await new AuditLog({ userId: req.user.id, action: 'profile_update' }).save();

  res.json(user);
};

// Delete Profile
const deleteProfile = async (req, res) => {
  await User.findByIdAndDelete(req.user.id);
  await new AuditLog({ userId: req.user.id, action: 'profile_delete' }).save();
  res.json({ msg: 'Profile deleted' });
};

module.exports = { getProfile, updateProfile, deleteProfile };