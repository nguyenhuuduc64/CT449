const Book = require('../models/Book');

exports.createBook = async (req, res) => {
  try {
    const data = { ...req.body };

    // Nếu có file upload, lưu đường dẫn tương đối tới thư mục uploads
    if (req.file) {
      data.coverImage = `/uploads/${req.file.filename}`;
    }

    const book = await Book.create(data);
    return res.status(201).json(book);
  } catch (err) {
    return res.status(400).json({ message: 'Failed to create book', error: err.message });
  }
};

exports.getBooks = async (req, res) => {
  try {
    const { q, author, genre, year } = req.query;
    const filter = {};

    if (q) {
      filter.title = { $regex: q, $options: 'i' };
    }
    if (author) {
      filter.author = { $regex: author, $options: 'i' };
    }
    if (genre) {
      filter.genre = { $regex: genre, $options: 'i' };
    }
    if (year) {
      filter.year = Number(year);
    }

    const books = await Book.find(filter).sort({ createdAt: -1 });
    return res.json(books);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch books', error: err.message });
  }
};

exports.getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    return res.json(book);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch book', error: err.message });
  }
};

exports.updateBook = async (req, res) => {
  try {
    const updates = { ...req.body };

    if (req.file) {
      updates.coverImage = `/uploads/${req.file.filename}`;
    }

    const book = await Book.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    });
    if (!book) return res.status(404).json({ message: 'Book not found' });
    return res.json(book);
  } catch (err) {
    return res.status(400).json({ message: 'Failed to update book', error: err.message });
  }
};

exports.deleteBook = async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    return res.json({ message: 'Book deleted' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to delete book', error: err.message });
  }
};


