const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Experience = sequelize.define('Experience', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    // Trong hình nối với profile_id
    profile_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    company_name: { 
        type: DataTypes.STRING, 
        allowNull: false 
    },
    position: { 
        type: DataTypes.STRING, 
        allowNull: false 
    },
    start_date: { 
        type: DataTypes.DATEONLY,
        allowNull: false    
    }, // Chỉ cần ngày tháng năm
    end_date: {  
        type: DataTypes.DATEONLY,
        allowNull: true   // null = vẫn đang làm việc tại đây
    },
    description: { 
        type: DataTypes.TEXT,
        allowNull: false  // Bắt buộc phải mô tả công việc
    }
}, { tableName: 'experiences', timestamps: true });

module.exports = Experience;