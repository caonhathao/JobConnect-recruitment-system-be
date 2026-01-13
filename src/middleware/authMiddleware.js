const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET|| 'secret_key_123');

            req.user = await User.findByPk(decoded.id);

            if (!req.user) {
                return res.status(401).json({ message: 'User không tồn tại' });
            }

            next();
        } catch (error) {
             console.error(error);
            res.status(401).json({ message: 'Token không hợp lệ, vui lòng đăng nhập lại' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Không có quyền truy cập, vui lòng đăng nhập' });
    }
};

exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: `Role '${req.user.role}' không có quyền truy cập tài nguyên này` 
            });
        }
        next();
    };
};
