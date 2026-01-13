const express = require('express');
const router = express.Router();
const {
  getUserDetails,
  getUserDetailsById,
  createOrUpdateUserDetails,
  deleteUserDetails
} = require('../controllers/userDetailsController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

router.get('/', protect, admin, getUserDetails);
router.get('/:userId', protect, admin, getUserDetailsById);
router.post('/', protect, admin, createOrUpdateUserDetails);
router.delete('/:userId', protect, admin, deleteUserDetails);

module.exports = router;
