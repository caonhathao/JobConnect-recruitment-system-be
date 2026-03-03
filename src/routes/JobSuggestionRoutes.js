const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');
const JobSuggestionController = require('../controllers/JobSuggestionController');

router.use(protect);

/**
 * @route   GET /api/suggestions?limit=10
 * @desc    Đề xuất công việc phù hợp với kỹ năng của ứng viên
 * @query   limit (optional, default: 10)
 * @access  Private
 */
router.get('/', JobSuggestionController.getJobSuggestions);

module.exports = router;
