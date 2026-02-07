const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Candidate_profile = sequelize.define('Candidate_profile', {
    id: {
        type: DataTypes.UUID,               
        defaultValue: DataTypes.UUIDV4, 
        primaryKey: true,
        allowNull: false
    },
    user_id: {
        type: DataTypes.UUID,               
        allowNull: false,
        references: {
            model: 'users',             
            key: 'id'
        },
        onDelete: 'CASCADE',            
        onUpdate: 'CASCADE'
    },
    headline: {
        type: DataTypes.STRING,
        allowNull: true,                
        defaultValue: 'Chưa cập nhật'
    },
    bio: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    website: {
        type: DataTypes.STRING,
        allowNull: true
    },
    linkedin_url: {                         
        type: DataTypes.STRING,
        allowNull: true
    },
   
    deleted_at: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'candidate_profiles',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: true // ✅ Quan trọng: Thêm dòng này nếu bạn muốn dùng tính năng 'deleted_at' (xóa mềm)
});



module.exports = Candidate_profile;