const express = require('express');
const router = express.Router();
const {
  getHomeContent,
  updateHomeContent,
  updateSection,
  resetHomeContent
} = require('../controllers/homeContentController');

const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

// Public route
router.route('/')
  .get(getHomeContent);

// Protected admin routes
router.route('/')
  .put(protect, admin, updateHomeContent);

router.route('/section/:id')
  .put(protect, admin, updateSection);

router.route('/reset')
  .post(protect, admin, resetHomeContent);

module.exports = router;