const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true }, // From form/user
  mobileNumber: { type: String, required: true },
  email: { type: String, required: true },
  vehicleType: { type: String, required: true }, // e.g., Car, Bike
  vehicleNumber: { type: String, required: true },
  serviceType: { type: String, required: true },
  date: { type: Date, required: true },
  timeSlot: { type: String, required: true },
  status: { type: String, default: 'pending' },
  advisorId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceAdvisor' },
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);