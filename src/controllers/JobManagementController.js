const JobManagementService = require('../services/JobManagementService');

const handleError = (res, error, context) => {
    console.error(`[JobManagementController] ${context}:`, error.message);
    const { message } = error;
    const NOT_FOUND   = ['Không tìm thấy tin đăng hoặc bạn không có quyền thao tác.', 'Bạn chưa có hồ sơ công ty.'];
    const BAD_REQUEST = ['Tiêu đề công việc không được để trống.', 'Hồ sơ công ty chưa được Admin duyệt. Bạn chưa thể đăng tin.', 'Tin đăng đã bị từ chối. Vui lòng tạo tin đăng mới.', 'Tin đang chờ duyệt. Không thể tạm dừng lúc này.', 'Tin đã bị từ chối. Không thể tạm dừng.'];
    if (NOT_FOUND.includes(message))   return res.status(404).json({ message });
    if (BAD_REQUEST.includes(message)) return res.status(400).json({ message });
    return res.status(500).json({ message: `Lỗi server khi ${context}`, error: message });
};

// POST /api/employer/jobs
exports.createJob = async (req, res) => {
    try {
        const data = await JobManagementService.createJob(req.user.id, req.body);
        return res.status(201).json({ message: 'Đăng tin tuyển dụng thành công! Đang chờ Admin duyệt.', data });
    } catch (error) {
        return handleError(res, error, 'đăng tin tuyển dụng');
    }
};

// GET /api/employer/jobs?status=pending
exports.getMyJobs = async (req, res) => {
    try {
        const data = await JobManagementService.getMyJobs(req.user.id, req.query);
        return res.status(200).json({ status: 'success', data });
    } catch (error) {
        return handleError(res, error, 'lấy danh sách tin đăng');
    }
};

// GET /api/employer/jobs/:id
exports.getJobDetail = async (req, res) => {
    try {
        const data = await JobManagementService.getJobDetail(req.user.id, req.params.id);
        return res.status(200).json({ status: 'success', data });
    } catch (error) {
        return handleError(res, error, 'lấy chi tiết tin đăng');
    }
};

// PUT /api/employer/jobs/:id
exports.updateJob = async (req, res) => {
    try {
        const data = await JobManagementService.updateJob(req.user.id, req.params.id, req.body);
        return res.status(200).json({ message: 'Cập nhật tin tuyển dụng thành công! Đang chờ duyệt lại.', data });
    } catch (error) {
        return handleError(res, error, 'cập nhật tin tuyển dụng');
    }
};

// PATCH /api/employer/jobs/:id/toggle-pause
exports.togglePauseJob = async (req, res) => {
    try {
        const result = await JobManagementService.togglePauseJob(req.user.id, req.params.id);
        return res.status(200).json(result);
    } catch (error) {
        return handleError(res, error, 'tạm dừng/mở lại tin tuyển dụng');
    }
};

// DELETE /api/employer/jobs/:id
exports.deleteJob = async (req, res) => {
    try {
        await JobManagementService.deleteJob(req.user.id, req.params.id);
        return res.status(200).json({ message: 'Xóa tin tuyển dụng thành công.' });
    } catch (error) {
        return handleError(res, error, 'xóa tin tuyển dụng');
    }
};
