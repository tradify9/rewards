const express = require('express');
const router = express.Router();
const { getUsers, getWithdrawals, getAnalytics, updateUser } = require('../controllers/adminController');
const { getUserDetails, createOrUpdateUserDetails, deleteUserDetails } = require('../controllers/userDetailsController');
const { getTransactions } = require('../controllers/transactionController');
const { getSettings, updateSetting } = require('../controllers/settingsController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

router.get('/users', protect, admin, getUsers);
router.get('/withdrawals', protect, admin, getWithdrawals);
router.get('/analytics', protect, admin, getAnalytics);
router.put('/users/:id', protect, admin, updateUser);

// User Details routes
router.get('/user-details', protect, admin, getUserDetails);
router.post('/user-details', protect, admin, createOrUpdateUserDetails);
router.delete('/user-details/:userId', protect, admin, deleteUserDetails);

// Transactions routes
router.get('/transactions', protect, admin, getTransactions);

// Settings routes
router.get('/settings', protect, admin, getSettings);
router.put('/settings/:key', protect, admin, updateSetting);

module.exports = router;
