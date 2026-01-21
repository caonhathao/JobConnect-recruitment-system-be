// models/index.js
const sequelize = require('../config/database'); 
const User = require('./User');
const Candidate_profile = require('./Candidate_profile');
const Company = require('./Company');

// ✅ ĐỊNH NGHĨA QUAN HỆ TẠI ĐÂY

// 1. Quan hệ User - Candidate (1-1)
User.hasOne(Candidate_profile, { 
    foreignKey: 'user_id',
    as: 'candidateProfile', // (Tùy chọn) Đặt alias để dễ gọi khi include, nếu không thích thì bỏ
    onDelete: 'CASCADE',    // Nếu xóa User -> Xóa luôn Profile
    onUpdate: 'CASCADE' 
});

Candidate_profile.belongsTo(User, { 
    foreignKey: 'user_id',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});

// 2. Quan hệ User - Company (1-1) -> Khi nào dùng thì mở ra, nhớ thêm CASCADE
/*
User.hasOne(Company, { 
    foreignKey: 'user_id',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});
Company.belongsTo(User, { 
    foreignKey: 'user_id' 
});
*/

// ✅ Xuất ra để dùng ở Controller
module.exports = {
    sequelize,
    User,
    Candidate_profile,
    Company
};