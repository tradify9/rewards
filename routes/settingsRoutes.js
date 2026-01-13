const express = require('express');
const router = express.Router();
const {
  getSettings,
  getSettingByKey,
  updateSetting,
  deleteSetting,
  getSettingsByCategory
} = require('../controllers/settingsController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

router.get('/', protect, admin, getSettings);
router.get('/category/:category', protect, admin, getSettingsByCategory);
router.get('/:key', protect, admin, getSettingByKey);
router.put('/:key', protect, admin, updateSetting);
router.delete('/:key', protect, admin, deleteSetting);

module.exports = router;
