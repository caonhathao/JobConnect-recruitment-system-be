const User = require('../models/User');

/**
 * Get all users except sensitive fields
 * @returns {Promise<Array>} List of users
 */
exports.getAllUsers = async () => {
    return await User.findAll({
        attributes: { exclude: ['password', 'refresh_token'] }
    });
};

/**
 * Delete a user by ID
 * @param {string} id - User ID
 * @returns {Promise<boolean>} True if deleted, throws error if not found
 */
exports.deleteUser = async (id) => {
    const user = await User.findByPk(id);

    if (!user) {
        throw new Error('User không tồn tại');
    }

    await user.destroy();
    return true;
};
