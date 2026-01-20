const express = require('express');
const router = express.Router();
const {
  getHomeContent,
  updateHomeContent,
  updateSection
} = require('../controllers/homeContentController');

const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

router.route('/')
  .get(getHomeContent)
  .put(protect, admin, updateHomeContent);

router.route('/section/:id')
  .put(protect, admin, updateSection);

module.exports = router;
