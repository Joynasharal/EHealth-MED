const express = require('express');
const router = express.Router();
const {
  signup, login, googleAuth, getMe,
  updateProfile, changePassword, setActiveProfile,
  forgotPassword, verifyOTP, resetPassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public
router.post('/signup', signup);
router.post('/login', login);
router.post('/google', googleAuth);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);

// Protected
router.get('/me', protect, getMe);
router.put('/update', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.put('/active-profile', protect, setActiveProfile);

module.exports = router;
