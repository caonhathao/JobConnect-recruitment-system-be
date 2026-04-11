const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { ROLES } = require('../constants/roles');
const JobManagementController = require('../controllers/JobManagementController');
const ApplicantController     = require('../controllers/ApplicantController');

router.use(protect);
router.use(authorize(ROLES.RECRUITER));

// ==============================================================================
// QUẢN LÝ TIN ĐĂNG
// ==============================================================================

/**
 * @route   POST /api/employer/jobs
 * @desc    Đăng tin tuyển dụng mới (trạng thái: pending)
 * @body    { title, description?, requirements?, benefits?, salary_min?, salary_max?,
 *            location?, job_type?, job_level?, deadline?, skills?: string[] }
 */
router.post('/',                         JobManagementController.createJob);

/**
 * @route   GET /api/employer/jobs?status=pending|approved|rejected|paused
 * @desc    Danh sách tất cả tin đăng của công ty (có thể lọc theo status)
 */
router.get('/',                          JobManagementController.getMyJobs);

/**
 * @route   GET /api/employer/jobs/:id
 * @desc    Xem chi tiết một tin đăng
 */
router.get('/:id',                       JobManagementController.getJobDetail);

/**
 * @route   PUT /api/employer/jobs/:id
 * @desc    Cập nhật tin đăng (sau khi sửa → về pending duyệt lại)
 */
router.put('/:id',                       JobManagementController.updateJob);

/**
 * @route   PATCH /api/employer/jobs/:id/toggle-pause
 * @desc    Tạm dừng (approved → paused) hoặc Mở lại (paused → approved)
 */
router.patch('/:id/toggle-pause',        JobManagementController.togglePauseJob);

/**
 * @route   GET /api/employer/jobs/:jobId/applicants
 * @desc    Danh sách ứng viên đã nộp vào job cụ thể này
 */
router.get('/:jobId/applicants',         ApplicantController.getApplicantsByJob);

/**
 * @route   DELETE /api/employer/jobs/:id
 * @desc    Xóa tin đăng
 */
router.delete('/:id',                    JobManagementController.deleteJob);

module.exports = router;
