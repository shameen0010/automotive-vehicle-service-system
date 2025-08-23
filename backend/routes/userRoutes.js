const express = require('express');
const { register, login, updateProfile, resetPassword, changePassword, getLogs } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.put('/profile', protect, updateProfile);
router.post('/reset-password', resetPassword);
router.post('/change-password', changePassword);
router.get('/logs/:userId', protect, authorize('admin'), getLogs); // UM-05

module.exports = router;