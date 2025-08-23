const mongoose = require('mongoose');
const bookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  serviceType: { type: String, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' },
  advisorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Placeholder for BM-03
  reminderSent: { type: Boolean, default: false },
});
module.exports = mongoose.model('Booking', bookingSchema);