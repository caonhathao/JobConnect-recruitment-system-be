const multer = require('multer');
const path   = require('path');
const fs     = require('fs');
const { Resume } = require('../models');

const UPLOAD_DIR = path.join(__dirname, '../uploads/resumes');

if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `resume-${uniqueSuffix}${ext}`);
    }
});

const fileFilter = async (req, file, cb) => {
    // 1. Kiểm tra định dạng
    if (file.mimetype !== 'application/pdf') {
        return cb(new Error('Chỉ chấp nhận file PDF!'), false);
    }

    // 2. Kiểm tra giới hạn 3 CV trước khi lưu file
    try {
        const count = await Resume.count({ where: { user_id: req.user.id } });
        if (count >= 3) {
            return cb(new Error('Bạn chỉ được upload tối đa 3 CV. Vui lòng xóa CV cũ trước khi upload mới.'), false);
        }
        cb(null, true);
    } catch (error) {
        cb(error, false);
    }
};

const uploadResumeConfig = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
        files: 1
    }
});

module.exports = uploadResumeConfig;