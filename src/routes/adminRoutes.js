const express = require('express');
const router = express.Router();
const { getAllUsers, deleteUser } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');
const ROLES = require('../constants/roles');

// Tất cả các route dưới đây đều yêu cầu đăng nhập và quyền Admin
router.use(protect);
router.use(authorize(ROLES.ADMIN));

router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);

module.exports = router;
