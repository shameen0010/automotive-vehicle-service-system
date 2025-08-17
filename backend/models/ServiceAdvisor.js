const mongoose = require('mongoose');

const serviceAdvisorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  // Add more fields if needed
});

module.exports = mongoose.model('ServiceAdvisor', serviceAdvisorSchema);