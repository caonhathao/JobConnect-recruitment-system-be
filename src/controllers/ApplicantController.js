const ApplicantService = require('../services/ApplicantService');

const handleError = (res, error, context) => {
    console.error(`[ApplicantController] ${context}:`, error.message);
    const { message } = error;
    const NOT_FOUND   = ['Không tìm thấy đơn ứng tuyển hoặc bạn không có quyền xem.', 'Không tìm thấy đơn ứng tuyển hoặc bạn không có quyền thao tác.', 'Tin tuyển dụng không tồn tại hoặc không thuộc công ty bạn.', 'Ứng viên này chưa đính kèm CV.', 'File CV không tồn tại trên server.', 'Bạn chưa có hồ sơ công ty.'];
    const BAD_REQUEST = ['Không thể quay lại trạng thái trước đó.'];
    if (NOT_FOUND.includes(message))   return res.status(404).json({ message });
    if (BAD_REQUEST.includes(message)) return res.status(400).json({ message });
    if (message.startsWith('Trạng thái không hợp lệ')) return res.status(400).json({ message });
    return res.status(500).json({ message: `Lỗi server khi ${context}`, error: message });
};

// GET /api/employer/applicants?status=
exports.getAllApplicants = async (req, res) => {
    try {
        const data = await ApplicantService.getAllApplicants(req.user.id, req.query);
        return res.status(200).json({ status: 'success', count: data.length, data });
    } catch (error) {
        return handleError(res, error, 'lấy danh sách ứng viên');
    }
};

// GET /api/employer/jobs/:jobId/applicants
exports.getApplicantsByJob = async (req, res) => {
    try {
        const data = await ApplicantService.getApplicantsByJob(req.user.id, req.params.jobId);
        const apps = data.applications ?? [];
        return res.status(200).json({ status: 'success', count: apps.length, data: apps });
    } catch (error) {
        return handleError(res, error, 'lấy ứng viên theo job');
    }
};

// GET /api/employer/applicants/:applicationId
exports.getApplicationDetail = async (req, res) => {
    try {
        const data = await ApplicantService.getApplicationDetail(req.user.id, req.params.applicationId);
        return res.status(200).json({ status: 'success', data });
    } catch (error) {
        return handleError(res, error, 'lấy chi tiết đơn ứng tuyển');
    }
};

// GET /api/employer/applicants/:applicationId/cv?mode=view|download
exports.getCvFile = async (req, res) => {
    try {
        const mode = req.query.mode === 'download' ? 'download' : 'view';
        const { filePath, fileName } = await ApplicantService.getCvFile(req.user.id, req.params.applicationId, mode);

        res.setHeader('Content-Type', 'application/pdf');
        if (mode === 'download') {
            res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
        } else {
            res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileName)}"`);
        }
        return res.sendFile(filePath);
    } catch (error) {
        return handleError(res, error, 'xem/tải CV');
    }
};

// PATCH /api/employer/applicants/:applicationId/status
exports.updateApplicationStatus = async (req, res) => {
    try {
        const { status, note } = req.body;
        if (!status) return res.status(400).json({ message: 'Vui lòng cung cấp trạng thái mới.' });

        const data = await ApplicantService.updateApplicationStatus(req.user.id, req.params.applicationId, status, note);
        return res.status(200).json({ message: 'Cập nhật trạng thái hồ sơ thành công.', data });
    } catch (error) {
        return handleError(res, error, 'cập nhật trạng thái hồ sơ');
    }
};

// DELETE /api/employer/applicants/:applicationId
exports.deleteApplication = async (req, res) => {
    try {
        await ApplicantService.deleteApplication(req.user.id, req.params.applicationId);
        return res.status(200).json({ message: 'Xóa đơn ứng tuyển thành công.' });
    } catch (error) {
        return handleError(res, error, 'xóa đơn ứng tuyển');
    }
};
