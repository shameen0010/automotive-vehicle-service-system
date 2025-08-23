const mongoose = require('mongoose');
const bookingSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true }, // e.g., '10:00 AM'
  serviceType: { type: String, required: true },
  advisorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Assigned advisor
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' }
});
module.exports = mongoose.model('Booking', bookingSchema);