const express  = require('express');
const router   = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { ROLES } = require('../constants/roles');
const EmployerController = require('../controllers/EmployerController');

// ==============================================================================
// MIDDLEWARE: Bắt buộc đăng nhập VÀ phải là recruiter
// ==============================================================================
router.use(protect);
router.use(authorize(ROLES.RECRUITER));

// ==============================================================================
// ROUTES — QUẢN LÝ PROFILE CÔNG TY
// ==============================================================================

/**
 * @route   GET /api/employer/profile
 * @desc    Lấy thông tin hồ sơ công ty của recruiter
 * @access  Private (recruiter only)
 */
router.get('/profile', EmployerController.getMyCompany);

/**
 * @route   POST /api/employer/profile
 * @desc    Tạo hồ sơ công ty (trạng thái ban đầu: pending)
 * @body    { name, description?, website?, logo_url?, address, city?, size? }
 * @access  Private (recruiter only)
 */
router.post('/profile', EmployerController.createCompany);

/**
 * @route   PUT /api/employer/profile
 * @desc    Cập nhật hồ sơ công ty (sau khi sửa → về lại pending)
 * @body    { name?, description?, website?, logo_url?, address?, city?, size? }
 * @access  Private (recruiter only)
 */
router.put('/profile', EmployerController.updateCompany);

module.exports = router;
