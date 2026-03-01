const express = require('express');
const router = express.Router();
const PortfolioController = require('../controllers/PortfolioController');
const { protect } = require('../middleware/authMiddleware'); // Kiểm tra lại đường dẫn folder middleware của bạn

// ==============================================================================
// GLOBAL MIDDLEWARE
// Áp dụng xác thực cho TẤT CẢ các route bên dưới (đỡ phải viết lặp lại)
// ==============================================================================
router.use(protect);

// ==============================================================================
// 1. TỔNG QUAN (GENERAL)
// ==============================================================================
// GET /api/portfolio
router.get('/', PortfolioController.getFullProfile);


// ==============================================================================
// 2. KINH NGHIỆM (EXPERIENCES)
// ==============================================================================

// Nhóm các route có chung đường dẫn: /experiences
router.route('/experiences')
    .get(PortfolioController.getExperiences)         // Lấy danh sách
    .post(PortfolioController.createExperience)      // Thêm mới
    .delete(PortfolioController.deleteAllExperiences); // Xóa hết

// Nhóm các route có ID: /experiences/:id
router.route('/experiences/:id')
    .put(PortfolioController.updateExperience)       // Sửa
    .delete(PortfolioController.deleteExperience);   // Xóa 1 cái


// ==============================================================================
// 3. HỌC VẤN (EDUCATIONS)
// ==============================================================================

// Nhóm các route có chung đường dẫn: /educations
router.route('/educations')
    .get(PortfolioController.getEducations)          // Lấy danh sách
    .post(PortfolioController.createEducation)       // Thêm mới
    .delete(PortfolioController.deleteAllEducations); // Xóa hết

// Nhóm các route có ID: /educations/:id
router.route('/educations/:id')
    .put(PortfolioController.updateEducation)        // Sửa
    .delete(PortfolioController.deleteEducation);    // Xóa 1 cái


// ==============================================================================
// 4. KỸ NĂNG (SKILLS)
// ==============================================================================

// Nhóm các route có chung đường dẫn: /skills
router.route('/skills')
    .get(PortfolioController.getSkills)              // Lấy danh sách
    .put(PortfolioController.updateSkills)           // Cập nhật (thay thế list cũ)
    .delete(PortfolioController.deleteAllSkills);    // Xóa hết

module.exports = router;