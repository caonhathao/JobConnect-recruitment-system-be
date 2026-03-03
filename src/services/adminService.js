const { User, Company } = require('../models');

/**
 * Get all users except sensitive fields
 * @returns {Promise<Array>} List of users
 */
exports.getAllUsers = async (filters = {}) => {
    const where = {};
    if (filters.role) where.role = filters.role;
    if (filters.is_active !== undefined) where.is_active = filters.is_active === 'true';

    return await User.findAll({
        where,
        attributes: { exclude: ['password', 'refresh_token'] },
        order: [['created_at', 'DESC']]
    });
};

/**
 * Delete a user by ID
 * @param {string} id - User ID
 * @returns {Promise<boolean>} True if deleted, throws error if not found
 */
exports.deleteUser = async (id) => {
    const user = await User.findByPk(id);
    if (!user) throw new Error('User không tồn tại');
    if (user.role === 'admin') throw new Error('Không thể xóa tài khoản Admin.');
    await user.destroy();
    return true;
};

/**
 * Khóa hoặc Mở khóa tài khoản (toggle is_active)
 * @param {string} id - User ID
 */
exports.toggleLockUser = async (id) => {
    const user = await User.findByPk(id, { attributes: { exclude: ['password', 'refresh_token'] } });
    if (!user) throw new Error('User không tồn tại');
    if (user.role === 'admin') throw new Error('Không thể khóa tài khoản Admin.');

    const newStatus = !user.is_active;  // Toggle
    await user.update({ is_active: newStatus });

    return {
        id:        user.id,
        full_name: user.full_name,
        email:     user.email,
        role:      user.role,
        is_active: newStatus,
        message:   newStatus ? 'Đã mở khóa tài khoản.' : 'Đã khóa tài khoản.'
    };
};
