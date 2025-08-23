const express = require('express');
const router = express.Router();
const { createBooking, updateBooking, getBookings } = require('../controllers/bookingController');
const protect = require('../middleware/auth');
const roleCheck = require('../middleware/role');

router.post('/', protect, roleCheck('customer'), createBooking);
router.put('/:id', protect, roleCheck('customer'), updateBooking);
router.get('/', protect, roleCheck('customer'), getBookings);

module.exports = router;