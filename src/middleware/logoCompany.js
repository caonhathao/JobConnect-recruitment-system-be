const multer = require('multer');


const fileFilter = (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ chấp nhận file ảnh!'), false);
    }
};

const uploadLogoConfig = multer({
    storage: multer.memoryStorage(), // dùng Sharp xử lý từ buffer
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

module.exports = uploadLogoConfig;