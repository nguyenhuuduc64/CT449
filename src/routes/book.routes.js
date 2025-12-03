const express = require('express');
const {
  createBook,
  getBooks,
  getBookById,
  updateBook,
  deleteBook
} = require('../controllers/book.controller');
const { auth, requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Public: browse & search
router.get('/', getBooks);
router.get('/:id', getBookById);

// Admin: manage books (with optional cover image upload)
router.post('/', auth, requireAdmin, upload.single('cover'), createBook);
router.put('/:id', auth, requireAdmin, upload.single('cover'), updateBook);
router.delete('/:id', auth, requireAdmin, deleteBook);

module.exports = router;

