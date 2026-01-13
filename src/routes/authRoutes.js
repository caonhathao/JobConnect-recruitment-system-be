const express = require('express');
const router = express.Router();
const { register, login, refreshToken, logout } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');
const ROLES = require('../constants/roles');

router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/logout', protect, logout);

// Example protected route (just for testing)
router.get('/profile', protect, (req, res) => {
    res.json({
        message: 'Đây là thông tin profile bảo mật',
        user: req.user
    });
});

// Example admin only route
router.get('/admin-only', protect, authorize(ROLES.ADMIN), (req, res) => {
    res.json({ message: 'Chào mừng Admin' });
});

module.exports = router;
