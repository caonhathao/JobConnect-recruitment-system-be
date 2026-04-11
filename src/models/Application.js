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
        defaultValue: 'submitted' // submitted, viewed, interview, rejected, hired
    },
    note_by_recruiter: {
        type: DataTypes.TEXT 
    },
    // Ghi chú của nhà tuyển dụng
    applied_at: { 
        type: DataTypes.DATE, 
        defaultValue: DataTypes.NOW 
    }
}, {
    tableName: 'applications',
    timestamps: true,
    updatedAt: 'updated_at',
    createdAt: 'applied_at' // Map created_at thành applied_at cho đúng ngữ nghĩa
});    


module.exports = Application