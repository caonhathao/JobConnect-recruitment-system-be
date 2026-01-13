const jwt = require('jsonwebtoken'); 


const generateAccessToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET || 'secret_key_123', {
        expiresIn: process.env.JWT_EXPIRES_IN || '15m'
    });
};

const generateRefreshToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || 'refresh_secret_key_123', {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
    });
};

const verifyRefreshToken = (token) => {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'refresh_secret_key_123');
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken
};
