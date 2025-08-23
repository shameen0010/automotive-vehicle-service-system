const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const cors = require('cors');
const cron = require('node-cron');
const Booking = require('./models/Booking');
const { sendReminder } = require('./controllers/bookingController');

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/bookings', bookingRoutes);

// Cron job: Every hour, check for bookings tomorrow and send reminders
cron.schedule('0 * * * *', async () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const bookings = await Booking.find({ date: tomorrow, status: 'confirmed' });
  bookings.forEach(sendReminder);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));