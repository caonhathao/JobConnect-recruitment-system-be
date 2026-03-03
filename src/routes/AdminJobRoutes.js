const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { ROLES } = require('../constants/roles');
const AdminJobController = require('../controllers/AdminJobController');

router.use(protect);
router.use(authorize(ROLES.ADMIN));

/**
 * @route   GET /api/admin/jobs?status=pending|approved|rejected|paused
 * @desc    Lấy toàn bộ danh sách tin tuyển dụng (có thể lọc theo status)
 * @access  Admin only
 */
router.get('/', AdminJobController.getAllJobs);

/**
 * @route   GET /api/admin/jobs/pending
 * @desc    Danh sách tin tuyển dụng đang chờ duyệt (sắp xếp cũ nhất lên đầu)
 * @access  Admin only
 */
router.get('/pending', AdminJobController.getPendingJobs);

/**
 * @route   GET /api/admin/jobs/:id
 * @desc    Xem chi tiết một tin tuyển dụng (nội dung đầy đủ để xét duyệt)
 * @access  Admin only
 */
router.get('/:id', AdminJobController.getJobDetail);

/**
 * @route   PATCH /api/admin/jobs/:id/review
 * @desc    Duyệt hoặc từ chối tin tuyển dụng
 * @body    { action: 'approved'|'rejected', reason?: string }
 * @note    reason bắt buộc khi action = 'rejected'
 * @access  Admin only
 */
router.patch('/:id/review', AdminJobController.reviewJob);

/**
 * @route   DELETE /api/admin/jobs/:id
 * @desc    Xóa tin tuyển dụng vi phạm (kể cả đã approved)
 * @access  Admin only
 */
router.delete('/:id', AdminJobController.deleteJob);

module.exports = router;
