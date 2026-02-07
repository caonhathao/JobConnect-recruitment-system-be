const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Job_skill = sequelize.define('Job_skill', {
    job_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        references: { model: 'jobs', key: 'id' }
    },
    skill_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        references: { model: 'skills', key: 'id' }
    }
}, {
    tableName: 'job_skills',
    timestamps: false
});

module.exports = Job_skill;