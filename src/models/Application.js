const { DataTypes } = require("sequelize")
const sequelize = require("../config/database")

const Application = sequelize.define("Application", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    job_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    cv_url: {
        type: DataTypes.STRING
    }, // Lưu link CV tại thời điểm ứng tuyển
    cover_letter: {
        type: DataTypes.TEXT 
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'submitted' // 'submitted', 'under_review', 'interview', 'accepted' rejected ,
    },
    note_by_recruiter: {
        type: DataTypes.TEXT 
    },
    // Ghi chú của nhà tuyển dụng
    applied_at: { 
        type: DataTypes.DATE, 
        defaultValue: DataTypes.NOW 
    },
    
    is_deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'applications',
    timestamps: true,
    updatedAt: 'updated_at',
    createdAt: false,        // ← bỏ conflict, dùng applied_at thủ công
});
 


module.exports = Application