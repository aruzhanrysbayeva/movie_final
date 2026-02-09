const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const { 
  getProfile, 
  updateProfile, 
  getAllUsers,
  updateUserRole
} = require('../controllers/userController');
const { roleValidation } = require('../middleware/validation');

router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);

router.get('/all', auth, authorize('admin'), getAllUsers);
router.put('/:id/role', auth, authorize('admin'), roleValidation, updateUserRole);

module.exports = router;
