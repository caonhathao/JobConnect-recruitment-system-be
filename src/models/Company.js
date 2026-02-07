const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Company = sequelize.define('Company', {
    id: {
        type: DataTypes.UUID,        // 1. Đổi ID công ty sang UUID cho đồng bộ
        defaultValue: DataTypes.UUIDV4, // Tự động sinh mã
        primaryKey: true,
        allowNull: false

    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT
    },
    website: {
        type: DataTypes.STRING
    },
    logo_url: {
        type: DataTypes.STRING
    },
    address: {
        type: DataTypes.STRING
    },
    city: {
        type: DataTypes.STRING
    },
    size: {
        type: DataTypes.STRING
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'pending' // Nên có giá trị mặc định là pending
    },
    rejection_reason: {
        type: DataTypes.TEXT
    },
    user_id: {
        type: DataTypes.UUID,       // 2. ⚠️ QUAN TRỌNG: Phải là UUID mới khớp với bảng Users
        allowNull: false,           // Công ty bắt buộc phải thuộc về 1 User (Recruiter)
        references: {
            model: 'users',         // Dùng tên bảng (string) an toàn hơn
            key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    }
}, {
    tableName: 'companies',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});



module.exports = Company;