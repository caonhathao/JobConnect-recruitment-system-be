// models/Resume.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Resume = sequelize.define('Resume', {
    
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    user_id: { // Giữ nguyên theo sơ đồ của bạn
        type: DataTypes.UUID,
        allowNull: false
    },
    file_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    file_url: {
        type: DataTypes.STRING,
        allowNull: false
    },
    // 👇 THÊM TRƯỜNG NÀY: Để hiện dung lượng (tính bằng byte)
    file_size: {
        type: DataTypes.INTEGER, 
        allowNull: true
    },
    is_default: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'resumes',
    timestamps: true, // Tự động tạo created_at và updated_at
    updatedAt: 'updated_at',
    createdAt: 'created_at'
});

module.exports = Resume;