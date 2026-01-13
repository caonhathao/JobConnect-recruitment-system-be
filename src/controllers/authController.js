const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Company = require('../models/Company');
const ROLES = require('../constants/roles');
const sequelize = require('../config/database');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/tokenUtils');
// const { sendEmail } = require('../services/emailService');

exports.register = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { email, password, full_name, company_name, address } = req.body;
        
        // Validate email domain
        if (!email || !email.endsWith('@gmail.com')) {
            await t.rollback();
            return res.status(400).json({ message: 'Email phải có đuôi @gmail.com' });
        }

        // Check if user exists
        const userExists = await User.findOne({ where: { email } });
        if (userExists) {
            await t.rollback();
            return res.status(400).json({ message: 'Email đã được sử dụng' });
        }

        // Determine role based on input
        let role = ROLES.CANDIDATE;
        if (company_name && address) {
            role = ROLES.RECRUITER;
        }

        // Create user
        const user = await User.create({
            email,
            password,
            full_name,
            role: role
        }, { transaction: t });

        // If Recruiter, create Company
        if (role === ROLES.RECRUITER) {
            await Company.create({
                name: company_name,
                address: address,
                user_id: user.id
            }, { transaction: t });
        }

        // Generate tokens
        const accessToken = generateAccessToken(user.id, user.role);
        const refreshToken = generateRefreshToken(user.id);

        // Save refresh token to DB
        user.refresh_token = refreshToken;
        await user.save({ transaction: t });

        await t.commit();
        
        // sendEmail(...)

        res.status(201).json({
            status: 'success',
            data: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
                company_name: role === ROLES.RECRUITER ? company_name : undefined,
                accessToken,
                refreshToken
            }
        });

    } catch (error) {
        await t.rollback();
        console.error(error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check for email
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
        }

        // Check password
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
        }

        // Generate tokens
        const accessToken = generateAccessToken(user.id, user.role);
        const refreshToken = generateRefreshToken(user.id);

        // Save refresh token to DB
        user.refresh_token = refreshToken;
        await user.save();

        // Return token
        res.status(200).json({
            status: 'success',
            data: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
                accessToken,
                refreshToken
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

exports.refreshToken = async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(401).json({ message: 'Vui lòng cung cấp Refresh Token' });
    }

    try {
        // Verify token
        const decoded = verifyRefreshToken(refreshToken);
        
        const user = await User.findByPk(decoded.id);

        if (!user || user.refresh_token !== refreshToken) {
            return res.status(403).json({ message: 'Refresh token không hợp lệ hoặc đã hết hạn' });
        }

        // Generate new access token
        const newAccessToken = generateAccessToken(user.id, user.role);

        res.status(200).json({
            accessToken: newAccessToken
        });
    } catch (error) {
        console.error(error);
        res.status(403).json({ message: 'Refresh token không hợp lệ' });
    }
};

exports.logout = async (req, res) => {
    try {
        // If protected route is used:
        if (req.user) {
            req.user.refresh_token = null;
            await req.user.save();
            return res.status(200).json({ message: 'Đăng xuất thành công' });
        }

        res.status(400).json({ message: 'User not found' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};
