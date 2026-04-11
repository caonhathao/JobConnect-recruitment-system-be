const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Education = sequelize.define('Education', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    profile_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    school_name: { type: DataTypes.STRING, allowNull: false },
    degree: { type: DataTypes.STRING }, 
    start_date: { type: DataTypes.DATEONLY },
    end_date: { type: DataTypes.DATEONLY }
}, { tableName: 'educations', timestamps: true });

module.exports = Education;