const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { ROLES } = require('../constants/roles');
const AdminCompanyController = require('../controllers/AdminCompanyController');

router.use(protect);
router.use(authorize(ROLES.ADMIN));


/**
 * @route   GET /api/admin/companies/pending
 * @desc    Danh sách công ty đang chờ duyệt (sắp xếp cũ nhất lên đầu)
 * @access  Admin only
 */
router.get('/pending', AdminCompanyController.getPendingCompanies); 


/**
 * @route   GET /api/admin/companies?status=pending|approved|rejected
 * @desc    Lấy toàn bộ danh sách công ty (có thể lọc theo status)
 * @access  Admin only
 */
router.get('/', AdminCompanyController.getAllCompanies);



/**
 * @route   PATCH /api/admin/companies/:id/review
 * @desc    Duyệt hoặc từ chối hồ sơ công ty
 * @body    { action: 'approved'|'rejected', reason?: string }
 * @note    reason bắt buộc khi action = 'rejected'
 * @access  Admin only
 */
router.patch('/:id/review', AdminCompanyController.reviewCompany);

module.exports = router;
