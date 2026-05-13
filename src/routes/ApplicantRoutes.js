const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { ROLES } = require('../constants/roles');
const ApplicantController = require('../controllers/ApplicantController');

router.use(protect);
router.use(authorize(ROLES.RECRUITER));

/**
 * @route   GET /api/employer/applicants?status=submitted|under_review|interview|accepted|rejected
 * @desc    Toàn bộ ứng viên từ tất cả job của công ty (có thể lọc theo status)
 */
router.get('/',                                      ApplicantController.getAllApplicants);

/**
 * @route   GET /api/employer/applicants/:applicationId
 * @desc    Chi tiết đơn ứng tuyển + Cover Letter đầy đủ
 */
router.get('/:applicationId',                        ApplicantController.getApplicationDetail);

/**
 * @route   GET /api/employer/applicants/:applicationId/cv?mode=view
 * @route   GET /api/employer/applicants/:applicationId/cv?mode=download
 * @desc    Xem trước CV (PDF Viewer) hoặc Tải về
 * @query   mode = 'view' (default) | 'download'
 */
router.get('/:applicationId/cv',                     ApplicantController.getCvFile);

/**
 * @route   PATCH /api/employer/applicants/:applicationId/status
 * @desc    Cập nhật trạng thái: submitted → under_review → interview → accepted/rejected
 * @body    { status: string, note?: string }
 */
router.patch('/:applicationId/status',               ApplicantController.updateApplicationStatus);

/**
 * @route   DELETE /api/employer/applicants/:applicationId
 * @desc    Xóa đơn ứng tuyển
 */
router.delete('/:applicationId',                      ApplicantController.deleteApplication);

module.exports = router;
