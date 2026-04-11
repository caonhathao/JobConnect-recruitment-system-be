const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { ROLES } = require('../constants/roles');
const DashboardController = require('../controllers/DashboardController');

router.use(protect);
router.use(authorize(ROLES.RECRUITER));

/**
 * @route   GET /api/employer/dashboard
 * @desc    Thống kê tổng quan: tổng job, tổng CV, tỷ lệ tuyển, 5 đơn mới nhất
 * @access  Private (recruiter only)
 */
router.get('/', DashboardController.getDashboard);

module.exports = router;
