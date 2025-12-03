const express = require('express');
const {
  borrowBook,
  returnBook,
  renewBorrow,
  getMyBorrows
} = require('../controllers/borrow.controller');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.post('/borrow', auth, borrowBook);
router.post('/return', auth, returnBook);
router.post('/renew', auth, renewBorrow);
router.get('/me', auth, getMyBorrows);

// Admin endpoints
const { requireAdmin } = require('../middleware/auth');
const { getAllBorrows, updateBorrowStatus } = require('../controllers/borrow.controller');

router.get('/', auth, requireAdmin, getAllBorrows);
router.put('/:id/status', auth, requireAdmin, updateBorrowStatus);

module.exports = router;


