const multer = require('multer');

const fileFilter = (_req, file,  cb ) =>
{
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if( !allowedTypes.includes(file.mimetype)  ){
        return cb(new Error('Chỉ chấp nhận file ảnh JPG, PNG, WEBP', false)
        )
    }
    cb(null,true);
}

const uploadAvatarConfig = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter
});

module.exports = uploadAvatarConfig;    
