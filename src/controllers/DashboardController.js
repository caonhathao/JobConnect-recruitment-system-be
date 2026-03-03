const DashboardService = require('../services/DashboardService');

// GET /api/employer/dashboard
exports.getDashboard = async (req, res) => {
    try {
        const data = await DashboardService.getDashboard(req.user.id);
        return res.status(200).json({ status: 'success', data });
    } catch (error) {
        console.error('[DashboardController]:', error.message);
        if (error.message === 'Bạn chưa có hồ sơ công ty.') {
            return res.status(404).json({ message: error.message });
        }
        return res.status(500).json({ message: 'Lỗi server khi lấy thống kê', error: error.message });
    }
};
