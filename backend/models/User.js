const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['customer', 'advisor', 'manager', 'admin'], default: 'customer' },
  visitCount: { type: Number, default: 0 }, // For loyalty tracking
  availability: [{ date: Date, startTime: String, endTime: String }] // For advisors (array of slots)
});
module.exports = mongoose.model('User', userSchema);