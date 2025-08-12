const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

// Get pending approvals
const getPending = async (req, res) => {
  const pending = await User.find({ isApproved: false, role: { $ne: 'external' } });
  res.json(pending);
};

// Approve user
const approveUser = async (req, res) => {
  const { userId } = req.params;
  const user = await User.findByIdAndUpdate(userId, { isApproved: true }, { new: true });

  await new AuditLog({ userId, action: 'approved_by_admin' }).save();

  // Simulate approval email
  console.log(`Approval notification to ${user.email}`);

  res.json({ msg: 'User approved' });
};

module.exports = { getPending, approveUser };