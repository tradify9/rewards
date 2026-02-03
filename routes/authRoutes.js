const express = require('express');
const router = express.Router();
const multer = require('multer');
const { register, login, getProfile, forgotPassword, resetPassword, createPaymentOrder, verifyPayment } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
// Multer setup for file uploads
const upload = multer({ storage: multer.memoryStorage() });

router.post('/register', upload.none(), register);
router.post('/login', login);
router.get('/login', (req, res) => {
  res.status(405).json({ message: 'Method not allowed. Use POST for login.' });
});
router.get('/profile', protect, getProfile);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.put('/change-password', protect, changePassword);
router.post('/create-payment-order', protect, createPaymentOrder);
router.post('/verify-payment', protect, verifyPayment);

module.exports = router;
