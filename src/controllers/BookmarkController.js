const BookmarkService = require('../services/BookmarkService');

// ==============================================================================
// HELPER ERROR
// ==============================================================================
const handleError = (res, error, context) => {
    console.error(`[BookmarkController] ${context}:`, error.message);
    const { message } = error;

    if (message === 'Công việc không tồn tại.') {
        return res.status(404).json({ message });
    }
    return res.status(500).json({ message: `Lỗi server khi ${context}`, error: message });
};

// POST /api/bookmarks/:jobId
exports.toggleBookmark = async (req, res) => {
    try {
        const result = await BookmarkService.toggleBookmark(req.user.id, req.params.jobId);
        return res.status(200).json(result);
    } catch (error) {
        return handleError(res, error, 'lưu/bỏ lưu tin tuyển dụng');
    }
};

// GET /api/bookmarks
exports.getBookmarks = async (req, res) => {
    try {
        const data = await BookmarkService.getBookmarks(req.user.id, req.query);
        return res.status(200).json({ status: 'success', count: data.length, data });
    } catch (error) {
        return handleError(res, error, 'lấy danh sách tin đã lưu');
    }
};
