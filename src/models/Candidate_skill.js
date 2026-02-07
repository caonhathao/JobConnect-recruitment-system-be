const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Candidate_skill = sequelize.define('Candidate_skill', {
    // Bảng trung gian thường không cần ID riêng, dùng cặp khóa chính phức hợp
    profile_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        references: { model: 'candidate_profiles', key: 'id' }
    },
    skill_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        references: { model: 'skills', key: 'id' }
    }
}, { tableName: 'candidate_skills', timestamps: false });

module.exports = Candidate_skill;