const User = require('../models/User');
const Borrow = require('../models/Borrow');

exports.getProfile = async (req, res) => {
  return res.json(req.user);
};

exports.updateProfile = async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.role;
    delete updates.isBlocked;
    delete updates.email; // keep email immutable in this simple example

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true
    }).select('-password');

    return res.json(user);
  } catch (err) {
    return res.status(400).json({ message: 'Failed to update profile', error: err.message });
  }
};

// Admin: list users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    return res.json(users);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch users', error: err.message });
  }
};

// Admin: update user (block, role, etc.)
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json(user);
  } catch (err) {
    return res.status(400).json({ message: 'Failed to update user', error: err.message });
  }
};

// Admin: delete user
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ message: 'User deleted' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to delete user', error: err.message });
  }
};

// Admin: get borrowing history of a user
exports.getUserBorrows = async (req, res) => {
  try {
    const borrows = await Borrow.find({ user: req.params.id })
      .populate('book')
      .sort({ createdAt: -1 });
    return res.json(borrows);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch borrow history', error: err.message });
  }
};


