const Borrow = require('../models/Borrow');
const Book = require('../models/Book');

const BORROW_DAYS = 7;
const MAX_ACTIVE_BORROWS = 3;
const LATE_FEE_PER_DAY = 1; // simple example, 1 currency unit per day

const calculateDueDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + BORROW_DAYS);
  return date;
};

const calculateLateFee = (dueDate, returnedAt) => {
  const endDate = returnedAt || new Date();
  const diffMs = endDate.getTime() - dueDate.getTime();
  const daysLate = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (daysLate <= 0) return 0;
  return daysLate * LATE_FEE_PER_DAY;
};

// controllers/borrow.controller.js - cập nhật hàm borrowBook
exports.borrowBook = async (req, res) => {
  try {
    const userId = req.user._id;
    const { bookId, expectedReturnDate, notes } = req.body;

    // Tìm sách
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: 'Không tìm thấy sách' });
    }

    // Kiểm tra xem user đã có yêu cầu chờ duyệt cho sách này chưa
    const existingPending = await Borrow.findOne({
      user: userId,
      book: bookId,
      status: 'approval'
    });
    
    if (existingPending) {
      return res.status(400).json({ 
        message: 'Bạn đã có yêu cầu mượn sách này đang chờ duyệt' 
      });
    }

    // Kiểm tra xem user đã mượn sách này chưa
    const existingBorrowed = await Borrow.findOne({
      user: userId,
      book: bookId,
      status: 'borrowed'
    });
    
    if (existingBorrowed) {
      return res.status(400).json({ 
        message: 'Bạn đang mượn sách này' 
      });
    }

    // Tạo yêu cầu mượn với trạng thái approval
    const borrow = await Borrow.create({
      user: userId,
      book: bookId,
      dueDate: expectedReturnDate || calculateDueDate(),
      status: 'approval',  // Mặc định là chờ duyệt
      notes: notes || ''
    });

    // Populate thông tin để trả về
    const populatedBorrow = await Borrow.findById(borrow._id)
      .populate('user', 'name email')
      .populate('book', 'title author quantity');

    return res.status(201).json({
      message: 'Yêu cầu mượn sách đã được gửi thành công và đang chờ duyệt',
      data: populatedBorrow
    });
  } catch (err) {
    return res.status(500).json({ 
      message: 'Không thể gửi yêu cầu mượn sách', 
      error: err.message 
    });
  }
};

exports.returnBook = async (req, res) => {
  try {
    const userId = req.user._id;
    const { borrowId } = req.body;

    const borrow = await Borrow.findOne({
      _id: borrowId,
      user: userId,
      status: 'borrowed'
    });
    if (!borrow) {
      return res.status(404).json({ message: 'Borrow record not found' });
    }

    const returnedAt = new Date();
    const lateFee = calculateLateFee(borrow.dueDate, returnedAt);

    borrow.returnedAt = returnedAt;
    borrow.status = lateFee > 0 ? 'overdue' : 'returned';
    borrow.lateFee = lateFee;
    await borrow.save();

    const book = await Book.findById(borrow.book);
    if (book) {
      book.quantity += 1;
      await book.save();
    }

    return res.json(borrow);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to return book', error: err.message });
  }
};

exports.renewBorrow = async (req, res) => {
  try {
    const userId = req.user._id;
    const { borrowId } = req.body;

    const borrow = await Borrow.findOne({
      _id: borrowId,
      user: userId,
      status: 'borrowed'
    });
    if (!borrow) {
      return res.status(404).json({ message: 'Borrow record not found' });
    }

    // simple rule: extend due date by BORROW_DAYS and increment renewedCount
    borrow.dueDate = calculateDueDate();
    borrow.renewedCount += 1;
    await borrow.save();

    return res.json(borrow);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to renew borrow', error: err.message });
  }
};

exports.getMyBorrows = async (req, res) => {
  try {
    const userId = req.user._id;
    const borrows = await Borrow.find({ user: userId })
      .populate('book')
      .sort({ createdAt: -1 });
    return res.json(borrows);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch borrows', error: err.message });
  }
};

// Admin: get all borrows
exports.getAllBorrows = async (req, res) => {
  try {
    const borrows = await Borrow.find()
      .populate('book')
      .populate('user', '-password')
      .sort({ createdAt: -1 });
    return res.json(borrows);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch borrows', error: err.message });
  }
};

// Admin: update borrow status
exports.updateBorrowStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // expected values: 'borrowed', 'returned', 'overdue'

    const borrow = await Borrow.findById(id);
    if (!borrow) return res.status(404).json({ message: 'Borrow not found' });

    const prevStatus = borrow.status;

    // If marking returned, set returnedAt and calculate late fee
    if (status === 'returned') {
      const returnedAt = new Date();
      const lateFee = calculateLateFee(borrow.dueDate, returnedAt);
      borrow.returnedAt = returnedAt;
      borrow.status = lateFee > 0 ? 'overdue' : 'returned';
      borrow.lateFee = lateFee;

      // restore book quantity
      const book = await Book.findById(borrow.book);
      if (book) {
        book.quantity += 1;
        await book.save();
      }
    } else if (status === 'borrowed') {
      // re-activate borrow (admin override)
      borrow.status = 'borrowed';
      borrow.returnedAt = null;
      borrow.lateFee = 0;
      // reduce book quantity if possible
      const book = await Book.findById(borrow.book);
      if (book && book.quantity > 0) {
        book.quantity -= 1;
        await book.save();
      }
    } else if (status === 'overdue') {
      borrow.status = 'overdue';
    } else {
      return res.status(400).json({ message: 'Invalid status' });
    }

    await borrow.save();
    const out = await Borrow.findById(id).populate('book').populate('user', '-password');
    return res.json(out);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update borrow status', error: err.message });
  }
};


