const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Tên không được để trống'
      },
      len: {
        args: [2, 100],
        msg: 'Tên phải có từ 2-100 ký tự'
      }
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: {
      msg: 'Email đã tồn tại'
    },
    validate: {
      isEmail: {
        msg: 'Email không hợp lệ'
      },
      notEmpty: {
        msg: 'Email không được để trống'
      }
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isStrongPassword(value) {
        // Chỉ validate nếu password được set (không validate với Google login)
        if (value && value.length < 8) {
          throw new Error('Password phải có ít nhất 8 ký tự');
        }
        if (value && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          throw new Error('Password phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số');
        }
      }
    }
  },
  googleId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: {
      msg: 'Google ID đã được sử dụng'
    }
  },
  role: {
    type: DataTypes.ENUM('candidate', 'employer', 'admin'),
    defaultValue: 'candidate',
    allowNull: false,
    validate: {
      isIn: {
        args: [['candidate', 'employer', 'admin']],
        msg: 'Role không hợp lệ'
      }
    }
  },
  emailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  emailVerificationToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  emailVerificationExpires: {
    type: DataTypes.DATE,
    allowNull: true
  },
  resetPasswordToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  resetPasswordExpires: {
    type: DataTypes.DATE,
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isValidPhone(value) {
        if (value && !/^[0-9]{10,11}$/.test(value)) {
          throw new Error('Số điện thoại không hợp lệ');
        }
      }
    }
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isUrl: {
        msg: 'URL hình ảnh không hợp lệ'
      }
    }
  },
  banned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  banReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  banExpires: {
    type: DataTypes.DATE,
    allowNull: true
  },
  companyId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Companies',
      key: 'id'
    }
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true
  },
  loginAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lockUntil: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true,
  paranoid: true, // Soft delete
  indexes: [
    {
      unique: true,
      fields: ['email']
    },
    {
      fields: ['googleId']
    },
    {
      fields: ['companyId']
    },
    {
      fields: ['role']
    },
    {
      fields: ['banned']
    }
  ],
  hooks: {
    beforeSave: async (user) => {
      // Chỉ hash password nếu nó được thay đổi và không null
      if (user.changed('password') && user.password) {
        const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeCreate: (user) => {
      // Validate: User phải có password hoặc googleId
      if (!user.password && !user.googleId) {
        throw new Error('User phải có password hoặc Google ID');
      }
    }
  }
});

// Instance Methods
User.prototype.comparePassword = async function(candidatePassword) {
  if (!this.password) {
    return false;
  }
  return await bcrypt.compare(candidatePassword, this.password);
};

User.prototype.isBanned = function() {
  if (!this.banned) return false;
  
  // Kiểm tra nếu ban đã hết hạn
  if (this.banExpires && new Date() > this.banExpires) {
    this.banned = false;
    this.banReason = null;
    this.banExpires = null;
    this.save();
    return false;
  }
  
  return true;
};

User.prototype.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

User.prototype.incrementLoginAttempts = async function() {
  // Nếu đã có lock và đã hết hạn, reset
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return await this.update({
      loginAttempts: 1,
      lockUntil: null
    });
  }
  
  // Tăng số lần thử
  const updates = { loginAttempts: this.loginAttempts + 1 };
  
  // Lock account sau 5 lần thử sai (lock 2 giờ)
  if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
    updates.lockUntil = Date.now() + 2 * 60 * 60 * 1000; // 2 hours
  }
  
  return await this.update(updates);
};

User.prototype.resetLoginAttempts = async function() {
  return await this.update({
    loginAttempts: 0,
    lockUntil: null
  });
};

User.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  
  // Loại bỏ các trường nhạy cảm khi trả về JSON
  delete values.password;
  delete values.emailVerificationToken;
  delete values.resetPasswordToken;
  delete values.loginAttempts;
  delete values.lockUntil;
  
  return values;
};

// Class Methods
User.findByEmail = async function(email) {
  return await this.findOne({ where: { email: email.toLowerCase() } });
};

User.findByGoogleId = async function(googleId) {
  return await this.findOne({ where: { googleId } });
};

User.findActiveUsers = async function() {
  return await this.findAll({
    where: {
      banned: false,
      emailVerified: true
    }
  });
};

module.exports = User;