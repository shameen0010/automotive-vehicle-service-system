const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['customer', 'manager', 'admin', 'advisor'], default: 'customer' },
  visitCount: { type: Number, default: 0 }, // For BM-05 loyalty
});
module.exports = mongoose.model('User', userSchema);