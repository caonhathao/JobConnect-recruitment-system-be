const path = require('path');
const fs   = require('fs');
const sharp = require('sharp');
const { Op } = require('sequelize');
const { Company, User, sequelize } = require('../models');

// Thư mục lưu logo
const LOGO_DIR = path.join(__dirname, '../uploads/logos');
if (!fs.existsSync(LOGO_DIR)) {
    fs.mkdirSync(LOGO_DIR, { recursive: true });
}


// ==============================================================================
// PRIVATE HELPER
// ==============================================================================
/**
 * Lấy Company thuộc về user (recruiter), throw nếu chưa có
 */
const _getCompany = async (userId) => {
    const company = await Company.findOne({ where: { user_id: userId } });
    if (!company) throw new Error('Bạn chưa có hồ sơ công ty. Vui lòng tạo hồ sơ.');
    return company;
};

// ==============================================================================
// 1. LẤY PROFILE CÔNG TY CỦA RECRUITER ĐANG ĐĂNG NHẬP
// ==============================================================================
exports.getMyCompany = async (userId) => {
    const company = await Company.findOne({
        where: { user_id: userId },
        include: [{
            model: User,
            as: 'user',
            attributes: ['full_name', 'email', 'phone', 'avatar_url']
        }]
    });

    if (!company) return null;

    return {
        id:               company.id,
        name:             company.name,
        description:      company.description,
        website:          company.website,
        logo_url:         company.logo_url,
        address:          company.address,
        city:             company.city,
        size:             company.size,
        status:           company.status,          // pending | approved | rejected
        rejection_reason: company.rejection_reason,
        recruiter: {
            full_name:  company.user?.full_name,
            email:      company.user?.email,
            phone:      company.user?.phone,
            avatar_url: company.user?.avatar_url
        }
    };
};

// ==============================================================================
// 2. TẠO PROFILE CÔNG TY (nếu chưa có sau khi đăng ký)
// ==============================================================================

// Nếu muốn sử dụng thì bỏ comment ở dưới
// exports.createCompany = async (userId, data) => {
//     const existing = await Company.findOne({ where: { user_id: userId } });
//     if (existing) throw new Error('Bạn đã có hồ sơ công ty. Hãy dùng chức năng cập nhật.');

//     const { name, description, website, logo_url, address, city, size } = data;

//     if (!name?.trim()) throw new Error('Tên công ty không được để trống.');
//     if (!address?.trim()) throw new Error('Địa chỉ công ty không được để trống.');

//     const company = await Company.create({
//         user_id:     userId,
//         name:        name.trim(),
//         description: description?.trim() || null,
//         website:     website?.trim()     || null,
//         logo_url:    logo_url?.trim()    || null,
//         address:     address.trim(),
//         city:        city?.trim()        || null,
//         size:        size?.trim()        || null,
//         status:      'pending'           // Luôn bắt đầu là pending, chờ admin duyệt
//     });

//     return company;
// };

// ==============================================================================
// 3. CẬP NHẬT PROFILE CÔNG TY
// ==============================================================================

exports.updateCompany = async (userId, data) => {
    const company = await _getCompany(userId);

    const { name, description, website, address, city, size } = data;

    // Validate những trường bắt buộc nếu được gửi lên
    if (name !== undefined && !name?.trim()) {
        throw new Error('Tên công ty không được để trống.');
    }
    if (address !== undefined && !address?.trim()) {
        throw new Error('Địa chỉ công ty không được để trống.');
    }

    // Chỉ update các field được gửi lên (partial update)
    const updateData = {};
    if (name        !== undefined) updateData.name        = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (website     !== undefined) updateData.website     = website?.trim()     || null;
    if (address     !== undefined) updateData.address     = address.trim();
    if (city        !== undefined) updateData.city        = city?.trim()        || null;
    if (size        !== undefined) updateData.size        = size?.trim()        || null;

    // Nếu đang cập nhật → đưa về pending để admin duyệt lại
    if (Object.keys(updateData).length > 0) {
        updateData.status           = 'pending';
        updateData.rejection_reason = null;
    }

    await company.update(updateData);
    return await Company.findByPk(company.id);
};

// ==============================================================================
// 4. CẬP NHẬT LOGO CÔNG TY
// ==============================================================================
exports.updateLogo = async (userId, fileBuffer) => {
    let newFilePath = null;

    try {
        const company = await _getCompany(userId);

        // Xử lý ảnh bằng Sharp
        const fileName = `logo-${userId}-${Date.now()}.webp`;
        const savePath = path.join(LOGO_DIR, fileName);

        await sharp(fileBuffer)
            .resize(300, 300, { fit: 'cover', position: 'center' })
            .webp({ quality: 80 })
            .toFile(savePath);

        newFilePath = savePath;

        const dbLogoUrl = `/uploads/logos/${fileName}`;

        // Xóa logo cũ nếu là file local
        if (company.logo_url?.startsWith('/uploads/')) {
            const oldPath = path.join(LOGO_DIR, path.basename(company.logo_url));
            if (fs.existsSync(oldPath)) {
                try {
                    fs.unlinkSync(oldPath);
                } catch (err) {
                    console.error('Không thể xóa logo cũ:', err);
                }
            }
        }

        await company.update({ logo_url: dbLogoUrl });
        return dbLogoUrl;

    } catch (error) {
        // Rollback: xóa file mới nếu lỡ tạo
        if (newFilePath && fs.existsSync(newFilePath)) {
            fs.unlinkSync(newFilePath);
        }
        throw error;
    }
};

// ==============================================================================
// 5. XÓA LOGO CÔNG TY
// ==============================================================================
exports.deleteLogo = async (userId) => {
    const company = await _getCompany(userId);

    if (!company.logo_url) {
        throw new Error('Công ty chưa có logo để xóa.');
    }

    if (company.logo_url.startsWith('/uploads/')) {
        const oldPath = path.join(LOGO_DIR, path.basename(company.logo_url));
        if (fs.existsSync(oldPath)) {
            try {
                fs.unlinkSync(oldPath);
            } catch (err) {
                console.error('Không thể xóa file logo:', err);
            }
        }
    }

    await company.update({ logo_url: null });
    return true;
};