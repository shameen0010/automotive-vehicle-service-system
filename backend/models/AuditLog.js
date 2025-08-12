const mongoose = require('mongoose');

const auditSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true }, // e.g., 'login', 'profile_update'
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('AuditLog', auditSchema);