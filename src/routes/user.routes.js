const express = require('express');
const {
  getProfile,
  updateProfile,
  getUsers,
  updateUser,
  deleteUser,
  getUserBorrows
} = require('../controllers/user.controller');
const { auth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Member: profile
router.get('/me', auth, getProfile);
router.put('/me', auth, updateProfile);

// Admin: manage users
router.get('/', auth, requireAdmin, getUsers);
router.put('/:id', auth, requireAdmin, updateUser);
router.delete('/:id', auth, requireAdmin, deleteUser);
router.get('/:id/borrows', auth, requireAdmin, getUserBorrows);

module.exports = router;


