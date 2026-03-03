const AdminJobService = require('../services/AdminJobService');

const handleError = (res, error, context) => {
    console.error(`[AdminJobController] ${context}:`, error.message);
    const { message } = error;

    const NOT_FOUND   = ['Tin tuyển dụng không tồn tại.'];
    const BAD_REQUEST = [
        'Hành động không hợp lệ. Chỉ chấp nhận: approved hoặc rejected.',
        'Vui lòng cung cấp lý do từ chối tin đăng.',
    ];
    const CONFLICT = message.startsWith('Tin tuyển dụng này đã được xử lý');

    if (NOT_FOUND.includes(message))   return res.status(404).json({ message });
    if (BAD_REQUEST.includes(message)) return res.status(400).json({ message });
    if (CONFLICT)                      return res.status(409).json({ message });
    return res.status(500).json({ message: `Lỗi server khi ${context}`, error: message });
};

// ==============================================================================
// GET /api/admin/jobs?status=pending|approved|rejected|paused
// Danh sách tất cả tin tuyển dụng (có lọc)
// ==============================================================================
exports.getAllJobs = async (req, res) => {
    try {
        const data = await AdminJobService.getAllJobs(req.query);
        return res.status(200).json({ status: 'success', count: data.length, data });
    } catch (error) {
        return handleError(res, error, 'lấy danh sách tin tuyển dụng');
    }
};

// ==============================================================================
// GET /api/admin/jobs/pending
// Danh sách tin tuyển dụng đang chờ duyệt
// ==============================================================================
exports.getPendingJobs = async (req, res) => {
    try {
        const data = await AdminJobService.getPendingJobs();
        return res.status(200).json({ status: 'success', count: data.length, data });
    } catch (error) {
        return handleError(res, error, 'lấy danh sách tin chờ duyệt');
    }
};

// ==============================================================================
// GET /api/admin/jobs/:id
// Xem chi tiết một tin tuyển dụng
// ==============================================================================
exports.getJobDetail = async (req, res) => {
    try {
        const data = await AdminJobService.getJobDetail(req.params.id);
        return res.status(200).json({ status: 'success', data });
    } catch (error) {
        return handleError(res, error, 'lấy chi tiết tin tuyển dụng');
    }
};

// ==============================================================================
// PATCH /api/admin/jobs/:id/review
// Duyệt hoặc Từ chối tin tuyển dụng
// Body: { action: 'approved'|'rejected', reason?: string }
// ==============================================================================
exports.reviewJob = async (req, res) => {
    try {
        const { action, reason } = req.body;

        if (!action) {
            return res.status(400).json({ message: 'Vui lòng cung cấp action (approved hoặc rejected).' });
        }

        const data = await AdminJobService.reviewJob(req.params.id, action, reason);

        const msg = action === 'approved'
            ? 'Đã duyệt tin tuyển dụng thành công.'
            : 'Đã từ chối tin tuyển dụng.';

        return res.status(200).json({ message: msg, data });
    } catch (error) {
        return handleError(res, error, 'duyệt tin tuyển dụng');
    }
};

// DELETE /api/admin/jobs/:id
exports.deleteJob = async (req, res) => {
    try {
        await AdminJobService.deleteJob(req.params.id);
        return res.status(200).json({ message: 'Xóa tin tuyển dụng vi phạm thành công.' });
    } catch (error) {
        return handleError(res, error, 'xóa tin tuyển dụng vi phạm');
    }
};
