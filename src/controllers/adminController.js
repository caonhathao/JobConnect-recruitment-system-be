const adminService = require('../services/adminService');

exports.getAllUsers = async (req, res) => {
    try {
        const users = await adminService.getAllUsers(req.query);
        res.status(200).json({ status: 'success', count: users.length, data: users });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        await adminService.deleteUser(req.params.id);
        res.status(200).json({ message: 'Đã xóa user thành công' });
    } catch (error) {
        const { message } = error;
        if (message === 'User không tồn tại') return res.status(404).json({ message });
        if (message === 'Không thể xóa tài khoản Admin.') return res.status(403).json({ message });
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// PATCH /api/admin/users/:id/toggle-lock
exports.toggleLockUser = async (req, res) => {
    try {
        const result = await adminService.toggleLockUser(req.params.id);
        return res.status(200).json(result);
    } catch (error) {
        const { message } = error;
        if (message === 'User không tồn tại') return res.status(404).json({ message });
        if (message === 'Không thể khóa tài khoản Admin.') return res.status(403).json({ message });
        res.status(500).json({ message: 'Lỗi server', error: message });
    }
};

