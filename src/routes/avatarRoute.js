const express = require('express');
const router = express.Router();
const avatarController = require('../controllers/avatarController');
const { protect} = require('../middleware/authMiddleware');
const uploadAvatarConfig = require('../middleware/uploadAvatar');
const multer = require('multer');

// PUT /api/avatar — Upload hoặc cập nhật avatar
router.put('/',
    protect,
    uploadAvatarConfig.single('avatar'),
    avatarController.updateAvatar
);

// DELETE /api/avatar — Xóa avatar
router.delete('/',
    protect,
    avatarController.deleteAvatar
);

// Xử lý lỗi Multer
router.use((err, _req, res, _next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ status: 'error', message: 'File quá lớn. Tối đa 5MB.' });
        }
        return res.status(400).json({ status: 'error', message: `Lỗi upload: ${err.message}` });
    }
    if (err.message === 'Chỉ chấp nhận file ảnh JPG, PNG, WEBP') {
        return res.status(400).json({ status: 'error', message: err.message });
    }
    return res.status(500).json({ status: 'error', message: 'Lỗi server', error: err.message });
});

module.exports = router;