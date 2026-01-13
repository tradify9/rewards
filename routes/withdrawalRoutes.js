const express = require('express');
const router = express.Router();
const { createWithdrawal, getWithdrawals, approveWithdrawal } = require('../controllers/withdrawalController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

router.post('/', protect, createWithdrawal);
router.get('/', protect, getWithdrawals);
router.put('/:id/approve', protect, admin, approveWithdrawal);

module.exports = router;
