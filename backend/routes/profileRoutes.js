const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const roleCheck = require('../middleware/roleMiddleware');
const { getProfile, updateProfile, deleteProfile } = require('../controllers/profileController');
const router = express.Router();

// All roles can access profile, but RBAC can be added per role if needed
router.get('/', protect, getProfile);
router.put('/', protect, updateProfile);
router.delete('/', protect, deleteProfile);

module.exports = router;