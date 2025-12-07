const express = require('express');
const {
  borrowBook,
  returnBook,
  renewBorrow,
  getMyBorrows
} = require('../controllers/borrow.controller');
const { auth } = require('../middleware/auth');
const Borrow = require('../models/Borrow');
const Book = require('../models/Book');

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

/*********************** */

// routes/borrow.js
router.get('/requests', auth, async (req, res) => {
  try {
    console.log('📋 Getting all borrow requests');
    console.log('👤 Current user:', req.user._id, req.user.name);
    
    // Kiểm tra nếu user có phải admin không
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Chỉ admin mới có quyền xem danh sách yêu cầu'
      });
    }
    
    // Lấy tất cả yêu cầu đang mượn (chưa trả)
    const requests = await Borrow.find({ status: 'borrowed' })
      .populate('user', 'name email')
      .populate('book', 'title author coverImage quantity')
      .sort({ createdAt: -1 });

    console.log(`📋 Found ${requests.length} borrow requests`);

    res.json({
      success: true,
      count: requests.length,
      data: requests.map(req => ({
        id: req._id,
        user: req.user,
        book: req.book,
        dueDate: req.dueDate,
        status: req.status,
        borrowedAt: req.borrowedAt,
        createdAt: req.createdAt,
        updatedAt: req.updatedAt
      }))
    });

  } catch (error) {
    console.error('❌ Get borrow requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách yêu cầu'
    });
  }
});

router.put('/requests/:id/approve', async (req, res) => {
  try {
    const request = await BorrowRequest.findById(req.params.id)
      .populate('user', 'name email')
      .populate('book');
    
    if (!request) {
      return res.status(404).json({ message: 'Không tìm thấy yêu cầu' });
    }
    
    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Yêu cầu đã được xử lý' });
    }
    
    // Kiểm tra sách có còn không
    if (request.book.quantity <= 0) {
      return res.status(400).json({ message: 'Sách đã hết, không thể phê duyệt' });
    }
    
    // Cập nhật trạng thái yêu cầu
    request.status = 'approved';
    request.approvedBy = req.user.userId;
    request.approvedAt = new Date();
    await request.save();
    
    // Tạo bản ghi mượn sách
    const borrow = new Borrow({
      user: request.user._id,
      book: request.book._id,
      borrowedAt: new Date(),
      dueDate: request.expectedReturnDate,
      status: 'borrowed'
    });
    await borrow.save();
    
    // Giảm số lượng sách
    request.book.quantity -= 1;
    await request.book.save();
    
    // TODO: Gửi thông báo cho người dùng
    
    res.json({
      message: 'Yêu cầu đã được phê duyệt',
      request
    });
  } catch (error) {
    console.error('Error approving request:', error);
    res.status(500).json({ message: 'Lỗi khi phê duyệt yêu cầu' });
  }
});

router.put('/requests/:id/reject', async (req, res) => {
  try {
    const { reason } = req.body;
    const request = await BorrowRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ message: 'Không tìm thấy yêu cầu' });
    }
    
    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Yêu cầu đã được xử lý' });
    }
    
    request.status = 'rejected';
    request.rejectionReason = reason;
    request.rejectedBy = req.user.userId;
    request.rejectedAt = new Date();
    await request.save();
    
    // TODO: Gửi thông báo cho người dùng
    
    res.json({
      message: 'Yêu cầu đã bị từ chối',
      request
    });
  } catch (error) {
    console.error('Error rejecting request:', error);
    res.status(500).json({ message: 'Lỗi khi từ chối yêu cầu' });
  }
});

/*********************************** */

router.post('/requests', auth, async (req, res) => {
  try {
    console.log('📥 Borrow request received:', req.body);
    console.log('👤 req.user type:', typeof req.user);
    console.log('👤 req.user:', req.user);

    const { bookId, expectedReturnDate, notes } = req.body;
    
    // req.user là User document object từ database
    if (!req.user || !req.user._id) {
      console.error('❌ No user found in request');
      return res.status(401).json({ 
        success: false,
        message: 'Không xác thực được người dùng' 
      });
    }
    
    // Sử dụng _id thay vì userId
    const userId = req.user._id;
    console.log('👤 User ID:', userId);
    console.log('👤 User name:', req.user.name);
    console.log('👤 User email:', req.user.email);

    // Validate required fields
    if (!bookId) {
      return res.status(400).json({ 
        success: false,
        message: 'Vui lòng chọn sách' 
      });
    }

    if (!expectedReturnDate) {
      return res.status(400).json({ 
        success: false,
        message: 'Vui lòng chọn ngày dự kiến trả' 
      });
    }

    // Validate return date (must be at least tomorrow)
    const dueDate = new Date(expectedReturnDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    
    if (dueDate <= today) {
      return res.status(400).json({ 
        success: false,
        message: 'Ngày trả phải ít nhất là ngày mai' 
      });
    }

    // Kiểm tra xem user đã có request pending cho sách này chưa
    const existingRequest = await Borrow.findOne({
      user: userId,
      book: bookId,
      status: 'borrowed' // Đang mượn
    });

    if (existingRequest) {
      return res.status(400).json({ 
        success: false,
        message: 'Bạn đã có yêu cầu mượn sách này đang chờ xử lý' 
      });
    }

    // Create borrow request
    const borrowRequest = new Borrow({
      user: userId,  // Sử dụng _id của user
      book: bookId,
      dueDate: dueDate,
      status: 'borrowed',
      borrowedAt: new Date()
    });

    await borrowRequest.save();
    console.log('✅ Borrow request saved:', {
      id: borrowRequest._id,
      user: borrowRequest.user,
      book: borrowRequest.book
    });

    // Populate để trả về thông tin đầy đủ
    const populatedRequest = await Borrow.findById(borrowRequest._id)
      .populate('user', 'name email')
      .populate('book', 'title author');

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Yêu cầu mượn sách đã được gửi thành công!',
      data: {
        id: populatedRequest._id,
        user: {
          id: populatedRequest.user._id,
          name: populatedRequest.user.name,
          email: populatedRequest.user.email
        },
        book: {
          id: populatedRequest.book._id,
          title: populatedRequest.book.title,
          author: populatedRequest.book.author
        },
        dueDate: populatedRequest.dueDate,
        status: populatedRequest.status,
        borrowedAt: populatedRequest.borrowedAt,
        createdAt: populatedRequest.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Borrow request error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      console.error('Validation errors:', error.errors);
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: errors
      });
    }

    // Handle CastError (invalid ObjectId)
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID không hợp lệ'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo yêu cầu mượn sách',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.put('/:id/approve', auth, requireAdmin, async (req, res) => {
  try {
    const borrow = await Borrow.findById(req.params.id)
      .populate('user', 'name email')
      .populate('book');
    
    if (!borrow) {
      return res.status(404).json({ 
        success: false,
        message: 'Không tìm thấy yêu cầu mượn sách' 
      });
    }
    
    if (borrow.status !== 'approval') {
      return res.status(400).json({ 
        success: false,
        message: 'Yêu cầu này không ở trạng thái chờ duyệt' 
      });
    }
    
    // Kiểm tra số lượng sách
    const book = await Book.findById(borrow.book._id);
    if (book.quantity <= 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Sách đã hết trong kho. Không thể duyệt yêu cầu.' 
      });
    }
    
    // Giảm số lượng sách
    book.quantity -= 1;
    await book.save();
    
    // Cập nhật trạng thái và thông tin duyệt
    borrow.status = 'borrowed';
    borrow.borrowedAt = new Date();
    borrow.approvedBy = req.user._id;
    borrow.approvedAt = new Date();
    
    // Nếu chưa có dueDate, set mặc định 14 ngày
    if (!borrow.dueDate) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);
      borrow.dueDate = dueDate;
    }
    
    await borrow.save();
    
    // Populate lại để trả về đầy đủ thông tin
    const updatedBorrow = await Borrow.findById(borrow._id)
      .populate('user', 'name email')
      .populate('book', 'title author quantity');
    
    res.json({
      success: true,
      message: 'Yêu cầu đã được duyệt thành công',
      data: updatedBorrow
    });
    
  } catch (error) {
    console.error('Approve borrow error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi duyệt yêu cầu mượn sách' 
    });
  }
});

router.put('/:id/reject', auth, requireAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    const borrow = await Borrow.findById(req.params.id);
    
    if (!borrow) {
      return res.status(404).json({ 
        success: false,
        message: 'Không tìm thấy yêu cầu mượn sách' 
      });
    }
    
    if (borrow.status !== 'approval') {
      return res.status(400).json({ 
        success: false,
        message: 'Yêu cầu này không ở trạng thái chờ duyệt' 
      });
    }
    
    // Cập nhật trạng thái thành "rejected" (bạn có thể thêm vào enum nếu cần)
    // Hoặc xóa bản ghi
    await Borrow.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Yêu cầu đã bị từ chối'
    });
    
  } catch (error) {
    console.error('Reject borrow error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi từ chối yêu cầu mượn sách' 
    });
  }
});

router.put('/:id/status', async (req, res) => {
  try {
    const { status, action } = req.body;
    const borrow = await Borrow.findById(req.params.id)
      .populate('user', 'name email')
      .populate('book', 'title quantity');
    
    if (!borrow) {
      return res.status(404).json({ message: 'Borrow record not found' });
    }
    
    // Xử lý duyệt yêu cầu
    if (borrow.status === 'approval' && status === 'borrowed' && action === 'approve') {
      const book = await Book.findById(borrow.book._id);
      if (book.quantity <= 0) {
        return res.status(400).json({ message: 'Sách đã hết trong kho' });
      }
      
      book.quantity -= 1;
      await book.save();
      
      // Set due date if not already set
      if (!borrow.dueDate) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 14);
        borrow.dueDate = dueDate;
      }
    }
    
    // Xử lý trả sách
    if (borrow.status === 'borrowed' && status === 'returned') {
      const book = await Book.findById(borrow.book._id);
      book.quantity += 1;
      await book.save();
      borrow.returnedAt = new Date();
    }
    
    borrow.status = status;
    await borrow.save();
    
    res.json(borrow);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;


