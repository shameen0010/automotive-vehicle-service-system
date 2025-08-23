const express = require('express');
const { createBooking, updateBooking, getBookings, assignAdvisor } = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

router.post('/', protect, createBooking);
router.put('/:id', protect, updateBooking);
router.get('/', protect, getBookings);
router.post('/assign', protect, authorize('manager'), assignAdvisor); // BM-03 placeholder

module.exports = router;