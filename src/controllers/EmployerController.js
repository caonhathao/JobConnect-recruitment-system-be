const EmployerService = require('../services/EmployerService');

// ==============================================================================
// HELPER ERROR
// ==============================================================================
const handleError = (res, error, context) => {
    console.error(`[EmployerController] ${context}:`, error.message);
    const { message } = error;

    const BAD_REQUEST = [
        'Tên công ty không được để trống.',
        'Địa chỉ công ty không được để trống.',
        'Bạn đã có hồ sơ công ty. Hãy dùng chức năng cập nhật.',
    ];
    const NOT_FOUND = [
        'Bạn chưa có hồ sơ công ty. Vui lòng tạo hồ sơ.',
    ];

    if (BAD_REQUEST.includes(message)) return res.status(400).json({ message });
    if (NOT_FOUND.includes(message))   return res.status(404).json({ message });
    return res.status(500).json({ message: `Lỗi server khi ${context}`, error: message });
};

// ==============================================================================
// GET /api/employer/profile
// Lấy profile công ty của recruiter đang đăng nhập
// ==============================================================================
exports.getMyCompany = async (req, res) => {
    try {
        const data = await EmployerService.getMyCompany(req.user.id);
        if (!data) {
            return res.status(404).json({ message: 'Bạn chưa có hồ sơ công ty. Vui lòng tạo hồ sơ.' });
        }
        return res.status(200).json({ status: 'success', data });
    } catch (error) {
        return handleError(res, error, 'lấy profile công ty');
    }
};

// ==============================================================================
// POST /api/employer/profile
// Tạo profile công ty (nếu chưa có)
// ==============================================================================
exports.createCompany = async (req, res) => {
    try {
        const data = await EmployerService.createCompany(req.user.id, req.body);
        return res.status(201).json({
            message: 'Tạo hồ sơ công ty thành công! Đang chờ Admin duyệt.',
            data
        });
    } catch (error) {
        return handleError(res, error, 'tạo profile công ty');
    }
};

// ==============================================================================
// PUT /api/employer/profile
// Cập nhật profile công ty
// ==============================================================================
exports.updateCompany = async (req, res) => {
    try {
        const data = await EmployerService.updateCompany(req.user.id, req.body);
        return res.status(200).json({
            message: 'Cập nhật hồ sơ công ty thành công! Đang chờ Admin duyệt lại.',
            data
        });
    } catch (error) {
        return handleError(res, error, 'cập nhật profile công ty');
    }
};
