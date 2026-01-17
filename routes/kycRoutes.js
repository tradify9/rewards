const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
  submitKYC,
  getKYCStatus,
  getKYCDetails,
  getAllKYC,
  reviewKYC,
  getKYCStats
} = require('../controllers/kycController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/kyc');
    // Ensure directory exists
    require('fs').mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Check file types
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (jpeg, jpg, png) and PDF files are allowed!'));
    }
  }
});

// User routes
router.post('/submit', protect, upload.fields([
  { name: 'aadhaarDocument', maxCount: 1 },
  { name: 'panDocument', maxCount: 1 },
  { name: 'selfie', maxCount: 1 }
]), submitKYC);

router.get('/status', protect, getKYCStatus);
router.get('/details', protect, getKYCDetails);

// Admin routes
router.get('/admin/all', protect, admin, getAllKYC);
router.put('/admin/review/:id', protect, admin, reviewKYC);
router.get('/admin/stats', protect, admin, getKYCStats);

module.exports = router;
