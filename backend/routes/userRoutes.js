const express = require('express');
const router = express.Router();
const { register, login, updateProfile, resetPassword, changePassword, getLogs, assignRole, logout } = require('../controllers/userController');
const protect = require('../middleware/auth');
const roleCheck = require('../middleware/role');

router.post('/register', register);
router.post('/login', login);
router.put('/profile', protect, updateProfile);
router.post('/reset-password', resetPassword);
router.post('/change-password', changePassword);
router.get('/logs', protect, roleCheck('admin'), getLogs);
router.put('/assign-role', protect, roleCheck('manager'), assignRole);
router.post('/logout', protect, logout);

module.exports = router;