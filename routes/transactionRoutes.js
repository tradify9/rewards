const express = require('express');
const router = express.Router();
const {
  getTransactions,
  getTransactionById,
  getTransactionsByStatus
} = require('../controllers/transactionController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

router.get('/', protect, admin, getTransactions);
router.get('/status/:status', protect, admin, getTransactionsByStatus);
router.get('/:id', protect, admin, getTransactionById);

module.exports = router;
