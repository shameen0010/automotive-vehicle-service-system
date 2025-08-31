import mongoose from 'mongoose';
const auditLogSchema = new mongoose.Schema({
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: String,
  meta: Object
}, { timestamps: true });
export default mongoose.model('AuditLog', auditLogSchema);
