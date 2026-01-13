const User = require('../models/User');

// Lấy danh sách tất cả Users (chỉ Admin)
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['password', 'refresh_token'] } // Không trả về password, token
        });
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
        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({ message: 'User không tồn tại' });
        }

        // Tùy chọn: Xóa cứng (hard delete) hoặc xóa mềm (set is_active = false)
        // Ở đây demo xóa cứng
        await user.destroy();

        res.status(200).json({ message: 'Đã xóa user thành công' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};
