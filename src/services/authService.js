const { User, Company, Candidate_profile, sequelize } = require('../models');
const { ROLES } = require('../constants/roles');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/tokenUtils');
const { Op } = require('sequelize');

/**
 * Register a new user
 * @param {Object} data - Registration data
 * @returns {Promise<Object>} Created user and tokens
 */
exports.register = async (data) => {
    // 1. CHUẨN HÓA DỮ LIỆU ĐẦU VÀO (Làm sạch 1 lần, dùng cho toàn bộ file)
    const email = data.email?.trim();
    const phone = data.phone?.trim();
    const full_name = data.full_name?.trim();
    const password = data.password;
    const company_name = data.company_name?.trim();
    const address = data.address?.trim();

    // 2. VALIDATE EMAIL
    if (!/^[a-z0-9.]+@gmail\.com$/.test(email)) {
        throw new Error('Email không hợp lệ (Viết liền, không dấu, không chữ hoa, đuôi @gmail.com)');
    }

    // 3. VALIDATE PASSWORD
    if (!password || password.length < 6) {
        throw new Error('Password phải có ít nhất 6 ký tự');
    }

    // 4. VALIDATE PHONE
    if (!phone) {
        throw new Error('Số điện thoại là bắt buộc');
    }
    if (!/^0\d{9}$/.test(phone)) {
        throw new Error('Số điện thoại phải bắt đầu bằng số 0 và có đúng 10 chữ số');
    }   

    // 5. VALIDATE FULL NAME
    if (!full_name) {
        throw new Error('Họ tên không được để trống');
    }
    if (full_name.length < 2 || full_name.length > 50) {
        throw new Error('Họ tên phải từ 2 đến 50 ký tự');
    }
    if (!/^[a-zA-ZÀ-ỹ\s]+$/.test(full_name)) {
        throw new Error('Họ tên chỉ được chứa chữ cái và khoảng trắng');
    }
    
    // Check conflicts (Email or Phone)
    const existingUser = await User.findOne({
        where: {
            [Op.or]: [
                { email: email },
                { phone: phone }
            ]
        }
    });

   if (existingUser) {
        if (existingUser.email === email) throw new Error('Email đã được sử dụng');
        if (existingUser.phone === phone) throw new Error('Số điện thoại đã được sử dụng');
    }
    
    // Determine role
let role = ROLES.CANDIDATE;
// Nếu có nhập bất kỳ thông tin công ty nào
if (company_name || address) {
    // Validate: Phải nhập đủ cả 2
    if (!company_name) {
        throw new Error('Thiếu tên công ty. Vui lòng nhập đầy đủ thông tin công ty hoặc bỏ trống để đăng ký tài khoản ứng viên');
    }
    if (!address) {
        throw new Error('Thiếu địa chỉ công ty. Vui lòng nhập đầy đủ địa chỉ công ty hoặc bỏ trống để đăng ký tài khoản ứng viên');
    }
    role = ROLES.RECRUITER;
}
    const t = await sequelize.transaction();

    try {
        // Create user
        const user = await User.create({
            email,
            phone,
            password,
            full_name,
            role: role
        }, { transaction: t });

        // Create profile based on role
        if (role === ROLES.CANDIDATE) {
            await Candidate_profile.create({
                user_id: user.id
            }, { transaction: t }); 
        }

        if (role === ROLES.RECRUITER) {
        await Company.create({
            user_id: user.id,
            name:    company_name.trim(),
            address: address.trim(),
            status:  'pending'
        }, { transaction: t });
    }

        // Generate tokens
        const accessToken = generateAccessToken(user.id, user.role);
        const refreshToken = generateRefreshToken(user.id);

        // Save refresh token
        user.refresh_token = refreshToken;
        await user.save({ transaction: t });

        await t.commit();

        return {
            id: user.id,
            email: user.email,
            phone: user.phone,
            full_name: user.full_name,
            role: user.role,
            // không trả về công ty và địa chỉ khi đăng kí 
            // company_name: role === ROLES.RECRUITER ? company_name : undefined,
            // address: role === ROLES.RECRUITER ? address : undefined,
            accessToken,
            refreshToken
        };

    } catch (error) {
        await t.rollback();
        throw error;
    }
};

/**
 * Login user
 * @param {Object} credentials - email and password
 * @returns {Promise<Object>} User info and tokens
 */
exports.login = async ({ email, password }) => {
    const user = await User.findOne({ where: { email } });
    if (!user) {
        throw new Error('Email hoặc mật khẩu không đúng');
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
        throw new Error('Mật khẩu không đúng');
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);

    // Save refresh token to DB
    user.refresh_token = refreshToken;
    await user.save();

    return {
        id: user.id,
        phone: user.phone,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        company_name: user.company_name, // Note: user.company_name might not exist solely on User model unless joined or virtual. Controller used it, so keeping assuming it's available or undefined.
        address: user.address,           // Same as above
        accessToken,
        refreshToken
    };
};

/**
 * Refresh access token
 * @param {string} refreshToken 
 * @returns {Promise<string>} New access token
 */
exports.refreshToken = async (refreshToken) => {
    try {
        const decoded = verifyRefreshToken(refreshToken);
        const user = await User.findByPk(decoded.id);

        if (!user || user.refresh_token !== refreshToken) {
            throw new Error('Refresh token không hợp lệ hoặc đã hết hạn');
        }

        return generateAccessToken(user.id, user.role);
    } catch (error) {
        throw new Error('Refresh token không hợp lệ');
    }
};

/**
 * Logout user
 * @param {Object} user - User instance from request
 * @returns {Promise<void>}
 */
exports.logout = async (user) => {
    if (user) {
        user.refresh_token = null;
        await user.save();
    }
};
