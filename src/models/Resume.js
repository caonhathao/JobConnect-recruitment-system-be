// models/Resume.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Resume = sequelize.define('Resume', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    user_id: { 
        type: DataTypes.UUID, // <--- Đã đúng (UUID)
        allowNull: false,
        // 👇 NÊN THÊM ĐOẠN NÀY: Để Database hiểu đây là khóa ngoại trỏ tới bảng users
        references: {
            model: 'users',
            key: 'id'
        },
        onDelete: 'CASCADE', // Xóa User thì xóa luôn Resume
        onUpdate: 'CASCADE'
    },
    file_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    file_url: {
        type: DataTypes.STRING,
        allowNull: false
    },
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
    timestamps: true,
    updatedAt: 'updated_at',
    createdAt: 'created_at'
});

module.exports = Resume;