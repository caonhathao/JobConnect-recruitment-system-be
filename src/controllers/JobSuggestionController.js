const JobSuggestionService = require('../services/JobSuggestionService');

// ==============================================================================
// HELPER ERROR
// ==============================================================================
const handleError = (res, error, context) => {
    console.error(`[JobSuggestionController] ${context}:`, error.message);
    return res.status(500).json({ message: `Lỗi server khi ${context}`, error: error.message });
};

// GET /api/suggestions?limit=10
exports.getJobSuggestions = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const data  = await JobSuggestionService.getJobSuggestions(req.user.id, limit);
        return res.status(200).json({ status: 'success', count: data.length, data });
    } catch (error) {
        return handleError(res, error, 'lấy gợi ý công việc');
    }
};
