const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');
const BookmarkController = require('../controllers/BookmarkController');

router.use(protect);

/**
 * @route   GET /api/bookmarks
 * @desc    Danh sách tin tuyển dụng đã lưu
 * @access  Private
 */
router.get('/', BookmarkController.getBookmarks);

/**
 * @route   POST /api/bookmarks/:jobId
 * @desc    Toggle lưu / bỏ lưu một tin tuyển dụng
 * @access  Private
 */
router.post('/:jobId', BookmarkController.toggleBookmark);

module.exports = router;
