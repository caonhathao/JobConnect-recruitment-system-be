const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Candidate_profile = sequelize.define('candidate_profile', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        references: {
            model: User,
            key: 'id'
        }
    },
    headline: {
        type: DataTypes.STRING,
        allowNull: false, 
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
    linkedin: {
        type: DataTypes.STRING,
        allowNull: true
    }, 
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        onUpdate: DataTypes.NOW
    },
      
    deleted_at: {
        type: DataTypes.DATE,
        allowNull: true
    },  
    

 },{
    tableName: 'candidate_profiles',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});
     
// Define Association
User.hasOne(Candidate_profile, { foreignKey: 'user_id' });
Candidate_profile.belongsTo(User, { foreignKey: 'user_id' });

module.exports = Candidate_profile;     