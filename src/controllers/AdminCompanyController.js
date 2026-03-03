const AdminCompanyService = require('../services/AdminCompanyService');

const handleError = (res, error, context) => {
    console.error(`[AdminCompanyController] ${context}:`, error.message);
    const { message } = error;

    const NOT_FOUND   = ['Công ty không tồn tại.'];
    const BAD_REQUEST = [
        'Hành động không hợp lệ. Chỉ chấp nhận: approved hoặc rejected.',
        'Vui lòng cung cấp lý do từ chối.',
    ];
    const CONFLICT = message.startsWith('Công ty này đã được xử lý');

    if (NOT_FOUND.includes(message))   return res.status(404).json({ message });
    if (BAD_REQUEST.includes(message)) return res.status(400).json({ message });
    if (CONFLICT)                      return res.status(409).json({ message });
    return res.status(500).json({ message: `Lỗi server khi ${context}`, error: message });
};

// ==============================================================================
// GET /api/admin/companies?status=pending|approved|rejected
// Danh sách tất cả công ty (có lọc theo status)
// ==============================================================================
exports.getAllCompanies = async (req, res) => {
    try {
        const data = await AdminCompanyService.getAllCompanies(req.query);
        return res.status(200).json({ status: 'success', count: data.length, data });
    } catch (error) {
        return handleError(res, error, 'lấy danh sách công ty');
    }
};

// ==============================================================================
// GET /api/admin/companies/pending
// Danh sách công ty đang chờ duyệt
// ==============================================================================
exports.getPendingCompanies = async (req, res) => {
    try {
        const data = await AdminCompanyService.getPendingCompanies();
        return res.status(200).json({ status: 'success', count: data.length, data });
    } catch (error) {
        return handleError(res, error, 'lấy danh sách công ty chờ duyệt');
    }
};

// ==============================================================================
// PATCH /api/admin/companies/:id/review
// Duyệt hoặc Từ chối công ty
// Body: { action: 'approved'|'rejected', reason?: string }
// ==============================================================================
exports.reviewCompany = async (req, res) => {
    try {
        const { action, reason } = req.body;

        if (!action) {
            return res.status(400).json({ message: 'Vui lòng cung cấp action (approved hoặc rejected).' });
        }

        const data = await AdminCompanyService.reviewCompany(req.params.id, action, reason);

        const msg = action === 'approved'
            ? 'Đã duyệt công ty thành công.'
            : 'Đã từ chối công ty.';

        return res.status(200).json({ message: msg, data });
    } catch (error) {
        return handleError(res, error, 'duyệt công ty');
    }
};
