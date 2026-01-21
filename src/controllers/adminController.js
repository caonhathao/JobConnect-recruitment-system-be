const adminService = require('../services/adminService');

// Lấy danh sách tất cả Users (chỉ Admin)
exports.getAllUsers = async (req, res) => {
    try {
        const users = await adminService.getAllUsers();
        
        res.status(200).json({
            status: 'success',
            count: users.length,
            data: users
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// Xóa User (ban hoặc xóa vĩnh viễn)
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        
        await adminService.deleteUser(id);

        res.status(200).json({ message: 'Đã xóa user thành công' });
    } catch (error) {
        console.error(error);
        
        if (error.message === 'User không tồn tại') {
            return res.status(404).json({ message: error.message });
        }

        res.status(500).json({ message: 'Lỗi server' });
    }
};

