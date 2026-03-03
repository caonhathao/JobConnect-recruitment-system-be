const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { ROLES } = require('../constants/roles');
const AdminReportController = require('../controllers/AdminReportController');

router.use(protect);
router.use(authorize(ROLES.ADMIN));

/**
 * @route   GET /api/admin/reports/overview
 * @desc    Thống kê tổng quan: tổng user, công ty, job, đơn ứng tuyển, tỷ lệ thành công
 */
router.get('/overview', AdminReportController.getSystemStats);

/**
 * @route   GET /api/admin/reports/users/growth
 * @desc    Biểu đồ tăng trưởng user (candidate + recruiter) theo tháng, 12 tháng gần nhất
 */
router.get('/users/growth', AdminReportController.getUserGrowth);

/**
 * @route   GET /api/admin/reports/applications/monthly
 * @desc    Số đơn ứng tuyển (CV nộp) theo tháng, 12 tháng gần nhất
 */
router.get('/applications/monthly', AdminReportController.getApplicationsByMonth);

/**
 * @route   GET /api/admin/reports/jobs/by-type
 * @desc    Thống kê số lượng job theo hình thức làm việc (toàn thời gian, bán thời gian...)
 */
router.get('/jobs/by-type', AdminReportController.getJobsByType);

/**
 * @route   GET /api/admin/reports/jobs/by-level
 * @desc    Thống kê số lượng job theo cấp độ (intern, junior, senior, manager...)
 */
router.get('/jobs/by-level', AdminReportController.getJobsByLevel);

module.exports = router;
