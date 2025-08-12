const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const roleCheck = require('../middleware/roleMiddleware');
const { getPending, approveUser } = require('../controllers/adminController');
const router = express.Router();

router.use(protect);
router.use(roleCheck(['admin'])); // Only admin access

router.get('/pending', getPending);
router.put('/approve/:userId', approveUser);

module.exports = router;