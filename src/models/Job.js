const {DataTypes} = require("sequelize")
const sequelize = require("../config/database") 

const Job = sequelize.define("Job", {
id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    company_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    title: {
        type: DataTypes.STRING, 
        allowNull: false 
    },
    description: {
        type: DataTypes.TEXT 
    },
    requirements: {
        type: DataTypes.TEXT 
    }, // Yêu cầu
    benefits: {
        type: DataTypes.TEXT 
    },     // Quyền lợi
    salary_min: {
        type: DataTypes.INTEGER 
    },
    salary_max: {
        type: DataTypes.INTEGER
    },
    location: {
        type: DataTypes.STRING 
    },   // Địa điểm làm việc
    job_type: {
        type: DataTypes.STRING 
    },   // Full-time, Part-time...
    job_level: {
        type: DataTypes.STRING 
    },  // Junior, Senior...
    status: {    
        type: DataTypes.STRING, 
        defaultValue: 'pending' // pending, approved, closed, rejected
    },
    rejection_reason: {
        type: DataTypes.TEXT 
    },
    deadline: {
        type: DataTypes.DATE
    },     // Hạn nộp hồ sơ
    views_count:{ 
        type: DataTypes.INTEGER, 
        defaultValue: 0 
    }
}, {
    tableName: 'jobs',
    timestamps: true
});

module.exports = Job;
