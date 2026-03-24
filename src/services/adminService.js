const { User } = require('../models');
const { Op } = require('sequelize')
/**
 * Get all users except sensitive fields
 * @returns {Promise<Array>} List of users
 */
exports.getAllUsers = async (filters = {}) => {
    const {
        role,
        is_active,
        page  = 1,
        limit = 10,
        keyword
    } = filters;

    const pageSize   = Math.min(50, Math.max(1, parseInt(limit)));
    const pageNumber = Math.max(1, parseInt(page));
    const offset     = (pageNumber - 1) * pageSize;

    // Build where clause
    const where = {};
    if (role)                        where.role      = role;
    if (is_active !== undefined)     where.is_active = is_active === 'true';

    // Tìm kiếm theo tên hoặc email
    if (keyword) {
        const key = keyword.trim();
        where[Op.or] = [
            { full_name: { [Op.substring]: key } },
            { email:     { [Op.substring]: key } },
            { phone:     { [Op.substring]: key } }
        ];
    }

    const { count, rows } = await User.findAndCountAll({
        where,
        attributes: { exclude: ['password', 'refresh_token'] },
        order:  [['created_at', 'DESC']],
        limit:  pageSize,
        offset,
        distinct: true
    });

    return {
        total_items:  count,
        total_pages:  Math.ceil(count / pageSize),
        current_page: pageNumber,
        users:        rows
    };
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
