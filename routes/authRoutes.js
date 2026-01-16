const express = require('express');
const router = express.Router();
const multer = require('multer');
const { register, login, getProfile, forgotPassword, resetPassword, createPaymentOrder, verifyPayment } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
// Multer setup for file uploads
const upload = multer({ storage: multer.memoryStorage() });

router.post('/register', upload.fields([
  { name: 'aadhaar', maxCount: 1 },
  { name: 'pancard', maxCount: 1 },
  { name: 'photo', maxCount: 1 }
]), register);
router.post('/login', login);
router.get('/profile', protect, getProfile);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/create-payment-order', protect, createPaymentOrder);
router.post('/verify-payment', protect, verifyPayment);

module.exports = router;
