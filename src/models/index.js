const sequelize = require('../config/database');

// 1. IMPORT TẤT CẢ MODELS
const User = require('./User');
const Candidate_profile = require('./Candidate_profile');
const Company = require('./Company');
const Skill = require('./Skill');
const Candidate_skill = require('./Candidate_skill');
const Experience = require('./Experience');
const Education = require('./Education');
const Resume = require('./Resume'); // Nhớ file tên Resume.js nhé
const Job = require('./Job');
const Application = require('./Application');
const Bookmark = require('./Bookmark');
const Job_skill = require('./Job_skill');

// 2. ĐỊNH NGHĨA QUAN HỆ (ASSOCIATIONS)

// === GROUP 1: USER & PROFILE ===
// User <-> Candidate Profile
User.hasOne(Candidate_profile, { foreignKey: 'user_id', as: 'candidateProfile', onDelete: 'CASCADE' });
Candidate_profile.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User <-> Company Profile (Recruiter)
User.hasOne(Company, { foreignKey: 'user_id', as: 'companyProfile', onDelete: 'CASCADE' });
Company.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User <-> Resume (CV upload)
User.hasMany(Resume, { foreignKey: 'user_id', as: 'resumes' });
Resume.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// === GROUP 2: CHI TIẾT ỨNG VIÊN (CV ONLINE) ===
// Profile <-> Experience
Candidate_profile.hasMany(Experience, { foreignKey: 'profile_id', as: 'experiences' });
Experience.belongsTo(Candidate_profile, { foreignKey: 'profile_id', as: 'profile' });

// Profile <-> Education
Candidate_profile.hasMany(Education, { foreignKey: 'profile_id', as: 'educations' });
Education.belongsTo(Candidate_profile, { foreignKey: 'profile_id', as: 'profile' });

// Profile <-> Skill (N-N)
Candidate_profile.belongsToMany(Skill, { through: Candidate_skill, foreignKey: 'profile_id', otherKey: 'skill_id', as: 'skills' });
Skill.belongsToMany(Candidate_profile, { through: Candidate_skill, foreignKey: 'skill_id', otherKey: 'profile_id', as: 'candidates' });

// === GROUP 3: VIỆC LÀM (JOBS) ===
// Company <-> Job (1 công ty đăng nhiều job)
Company.hasMany(Job, { foreignKey: 'company_id', as: 'jobs' });
Job.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });

// Job <-> Skill (N-N: Một job yêu cầu nhiều skill)
Job.belongsToMany(Skill, { through: Job_skill, foreignKey: 'job_id', otherKey: 'skill_id', as: 'skills' });
Skill.belongsToMany(Job, { through: Job_skill, foreignKey: 'skill_id', otherKey: 'job_id', as: 'jobs' });

// === GROUP 4: ỨNG TUYỂN (APPLICATIONS) ===
// Job <-> Application (1 job có nhiều đơn ứng tuyển)
Job.hasMany(Application, { foreignKey: 'job_id', as: 'applications' });
Application.belongsTo(Job, { foreignKey: 'job_id', as: 'job' });

// User (Candidate) <-> Application (1 người ứng tuyển nhiều nơi)
User.hasMany(Application, { foreignKey: 'user_id', as: 'applications' });
Application.belongsTo(User, { foreignKey: 'user_id', as: 'candidate' }); // Alias là candidate cho dễ hiểu

// === GROUP 5: TIỆN ÍCH (BOOKMARKS) ===
// User <-> Bookmark (Lưu việc làm)
User.hasMany(Bookmark, { foreignKey: 'user_id', as: 'bookmarks' });
Bookmark.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Job.hasMany(Bookmark, { foreignKey: 'job_id', as: 'bookmarkedBy' });
Bookmark.belongsTo(Job, { foreignKey: 'job_id', as: 'job' });

// 3. EXPORT
module.exports = {
    sequelize,
    User, Candidate_profile, Company,
    Skill, Candidate_skill, Experience, Education, Resume,
    Job, Application, Bookmark, Job_skill
};