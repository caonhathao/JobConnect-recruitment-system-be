const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Bookmark = sequelize.define('Bookmark', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    job_id: {
        type: DataTypes.UUID,
        allowNull: false
    }
}, {
    tableName: 'bookmarks',
    timestamps: true
});

module.exports = Bookmark;