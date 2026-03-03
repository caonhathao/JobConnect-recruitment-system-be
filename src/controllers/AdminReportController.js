const AdminReportService = require('../services/AdminReportService');

const handleError = (res, error, context) => {
    console.error(`[AdminReportController] ${context}:`, error.message);
    return res.status(500).json({ message: `Lỗi server khi ${context}`, error: error.message });
};

// GET /api/admin/reports/overview
exports.getSystemStats = async (req, res) => {
    try {
        const data = await AdminReportService.getSystemStats();
        return res.status(200).json({ status: 'success', data });
    } catch (error) {
        return handleError(res, error, 'lấy thống kê tổng quan');
    }
};

// GET /api/admin/reports/users/growth
exports.getUserGrowth = async (req, res) => {
    try {
        const data = await AdminReportService.getUserGrowth();
        return res.status(200).json({ status: 'success', data });
    } catch (error) {
        return handleError(res, error, 'lấy tăng trưởng user');
    }
};

// GET /api/admin/reports/applications/monthly
exports.getApplicationsByMonth = async (req, res) => {
    try {
        const data = await AdminReportService.getApplicationsByMonth();
        return res.status(200).json({ status: 'success', data });
    } catch (error) {
        return handleError(res, error, 'lấy thống kê đơn ứng tuyển theo tháng');
    }
};

// GET /api/admin/reports/jobs/by-type
exports.getJobsByType = async (req, res) => {
    try {
        const data = await AdminReportService.getJobsByType();
        return res.status(200).json({ status: 'success', data });
    } catch (error) {
        return handleError(res, error, 'lấy thống kê job theo loại');
    }
};

// GET /api/admin/reports/jobs/by-level
exports.getJobsByLevel = async (req, res) => {
    try {
        const data = await AdminReportService.getJobsByLevel();
        return res.status(200).json({ status: 'success', data });
    } catch (error) {
        return handleError(res, error, 'lấy thống kê job theo cấp độ');
    }
};
