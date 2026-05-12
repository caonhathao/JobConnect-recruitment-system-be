const path = require('path');
const fs   = require('fs');
const { Op } = require('sequelize');
const { Company, Application, User, Job, Candidate_profile, Experience, Education, Skill } = require('../models');

// ==============================================================================
// PRIVATE HELPER
// ==============================================================================
const _getCompanyId = async (userId) => {
    const company = await Company.findOne({ where: { user_id: userId } });
    if (!company) throw new Error('Bạn chưa có hồ sơ công ty.');
    return company.id;
};

// Dùng chung cho getAllApplicants, getApplicationDetail, getCvFile, updateApplicationStatus
const _getJobIds = async (companyId) => {
    const myJobs = await Job.findAll({
        where: { company_id: companyId },
        attributes: ['id']
    });
    return myJobs.map(j => j.id);
};


// ==============================================================================
// 1. XEM DANH SÁCH ỨNG VIÊN THEO TỪNG JOB
// ==============================================================================
/**
 * @param {string} userId  - recruiter userId
 * @param {string} jobId   - ID của tin tuyển dụng
 */
exports.getApplicantsByJob = async (userId, jobId, filters = {}) => {
    const companyId = await _getCompanyId(userId);

    const job = await Job.findOne({ where: { id: jobId, company_id: companyId } });
    if (!job) throw new Error('Tin tuyển dụng không tồn tại hoặc không thuộc công ty bạn.');

    const pageSize   = Math.min(50, Math.max(1, parseInt(filters.limit) || 10));
    const pageNumber = Math.max(1, parseInt(filters.page) || 1);
    const offset     = (pageNumber - 1) * pageSize;

    const where = { job_id: jobId };
    if (filters.status) where.status = filters.status;

    const { count, rows } = await Application.findAndCountAll({
        where,
        include: [{
            model: User,
            as: 'candidate',
            attributes: ['id', 'full_name', 'email', 'phone', 'avatar_url'],
            include: [{
                model: Candidate_profile,
                as: 'candidateProfile',
                attributes: ['headline', 'bio', 'linkedin_url']
            }]
        }],
        order:    [['applied_at', 'DESC']],
        limit:    pageSize,
        offset,
        distinct: true
    });

    return {
        total_items:   count,
        total_pages:   Math.ceil(count / pageSize),
        current_page:  pageNumber,
        applications:  rows.map(app => ({
            application_id:    app.id,
            status:            app.status,
            cover_letter:      app.cover_letter,
            cv_url:            app.cv_url,
            applied_at:        app.applied_at,
            note_by_recruiter: app.note_by_recruiter,
            candidate: {
                id:         app.candidate?.id,
                full_name:  app.candidate?.full_name,
                email:      app.candidate?.email,
                phone:      app.candidate?.phone,
                avatar_url: app.candidate?.avatar_url,
                headline:   app.candidate?.candidateProfile?.headline,
                bio:        app.candidate?.candidateProfile?.bio,
                linkedin_url: app.candidate?.candidateProfile?.linkedin_url
            }
        }))
    };
};

// ==============================================================================
// 2. XEM TOÀN BỘ ỨNG VIÊN CỦA TẤT CẢ JOB (tổng quan)
// ==============================================================================
exports.getAllApplicants = async (userId, filters = {}) => {
    const companyId = await _getCompanyId(userId);
    const jobIds    = await _getJobIds(companyId); // Dùng helper

    const pageSize   = Math.min(50, Math.max(1, parseInt(filters.limit) || 10));
    const pageNumber = Math.max(1, parseInt(filters.page) || 1);
    const offset     = (pageNumber - 1) * pageSize;

    // Trả về object phân trang luôn dù không có job
    if (jobIds.length === 0) {
        return { total_items: 0, total_pages: 0, current_page: pageNumber, applications: [] };
    }

    const where = { job_id: jobIds };
    if (filters.status) where.status = filters.status;

    const { count, rows } = await Application.findAndCountAll({
        where,
        include: [
            {
                model: User,
                as: 'candidate',
                attributes: ['id', 'full_name', 'email', 'phone', 'avatar_url'],
                include: [{ 
                    model: Candidate_profile, 
                    as: 'candidateProfile',
                    include: [
                        { model: Experience, as: 'experiences' },
                        { model: Education, as: 'educations' },
                        { model: Skill, as: 'skills', through: { attributes: [] } }
                    ]
                }]
            },
            {
                model: Job,
                as: 'job',
                attributes: ['id', 'title']
            }
        ],
        order:    [
            ['applied_at', 'DESC'],
            [{ model: User, as: 'candidate' }, { model: Candidate_profile, as: 'candidateProfile' }, { model: Experience, as: 'experiences' }, 'start_date', 'DESC'],
            [{ model: User, as: 'candidate' }, { model: Candidate_profile, as: 'candidateProfile' }, { model: Education, as: 'educations' }, 'start_date', 'DESC']
        ],
        limit:    pageSize,
        offset,
        distinct: true
    });

    return {
        total_items:  count,
        total_pages:  Math.ceil(count / pageSize),
        current_page: pageNumber,
        applications: rows.map(app => ({
            application_id: app.id,
            status:         app.status,
            cv_url:         app.cv_url,
            applied_at:     app.applied_at,
            job:       { id: app.job?.id, title: app.job?.title },
            candidate: {
                id:               app.candidate?.id,
                full_name:        app.candidate?.full_name,
                email:            app.candidate?.email,
                phone:            app.candidate?.phone,
                avatar_url:       app.candidate?.avatar_url,
                candidateProfile: app.candidate?.candidateProfile
            }
        }))
    };
};

// ==============================================================================
// 3. XEM CHI TIẾT ĐƠN ỨNG TUYỂN + COVER LETTER
// ==============================================================================
exports.getApplicationDetail = async (userId, applicationId) => {
    const companyId = await _getCompanyId(userId);
    const jobIds    = await _getJobIds(companyId); // Dùng helper

    const app = await Application.findOne({
        where: { id: applicationId, job_id: jobIds },
        include: [
            {
                model: User,
                as: 'candidate',
                attributes: ['id', 'full_name', 'email', 'phone', 'avatar_url'],
                include: [{ 
                    model: Candidate_profile, 
                    as: 'candidateProfile',
                    include: [
                        { model: Experience, as: 'experiences' },
                        { model: Education, as: 'educations' },
                        { model: Skill, as: 'skills', through: { attributes: [] } }
                    ]
                }]
            },
            {
                model: Job,
                as: 'job',
                attributes: ['id', 'title', 'location', 'job_type']
            }
        ]
    });

    if (!app) throw new Error('Không tìm thấy đơn ứng tuyển hoặc bạn không có quyền xem.');
    return app;
};

// ==============================================================================
// 4. XEM TRƯỚC PDF CV / TẢI CV
// ==============================================================================
exports.getCvFile = async (userId, applicationId, mode = 'view') => {
    const companyId = await _getCompanyId(userId);
    const jobIds    = await _getJobIds(companyId); // Dùng helper

    const app = await Application.findOne({
        where: { id: applicationId, job_id: jobIds }
    });
    if (!app)        throw new Error('Không tìm thấy đơn ứng tuyển hoặc bạn không có quyền xem.');
    if (!app.cv_url) throw new Error('Ứng viên này chưa đính kèm CV.');

    // ✅ Nếu là URL cloud (http/https) → trả về URL luôn, không đọc file local
    if (app.cv_url.startsWith('http://') || app.cv_url.startsWith('https://')) {
        return { 
            fileUrl:  app.cv_url, 
            fileName: path.basename(app.cv_url), 
            mode,
            isRemote: true 
        };
    }

    // local file
    const filePath = path.join(__dirname, '..', app.cv_url);
    if (!fs.existsSync(filePath)) throw new Error('File CV không tồn tại trên server.');

    return { filePath, fileName: path.basename(filePath), mode };
};

// ==============================================================================
// 5. CẬP NHẬT TRẠNG THÁI ĐƠN ỨNG TUYỂN
const VALID_TRANSITIONS = {
    submitted:    ['under_review', 'rejected'],
    under_review: ['interview',    'rejected'],
    interview:    ['accepted',     'rejected'],
    accepted:     [],
    rejected:     []
};

exports.updateApplicationStatus = async (userId, applicationId, status, note) => {
    const validStatuses = Object.keys(VALID_TRANSITIONS);
    if (!validStatuses.includes(status)) {
        throw new Error(`Trạng thái không hợp lệ. Chỉ chấp nhận: ${validStatuses.join(', ')}`);
    }   

    const companyId = await _getCompanyId(userId);
    const jobIds    = await _getJobIds(companyId);

    const app = await Application.findOne({
        where: { id: applicationId, job_id: jobIds }
    });
    if (!app) throw new Error('Không tìm thấy đơn ứng tuyển hoặc bạn không có quyền thao tác.');

    const allowedNext = VALID_TRANSITIONS[app.status];

    // Trạng thái cuối không thể thay đổi
    if (allowedNext.length === 0) {
        throw new Error(`Đơn ứng tuyển đã ở trạng thái "${app.status}", không thể thay đổi.`);
    }

    // Không nằm trong danh sách cho phép
    if (!allowedNext.includes(status)) {
        throw new Error(`Không thể chuyển từ "${app.status}" sang "${status}".`);
    }

    await app.update({
        status,
        note_by_recruiter: note?.trim() || app.note_by_recruiter
    });

    return app;
};

// ==============================================================================
// 6. XÓA ĐƠN ỨNG TUYỂN
// ==============================================================================
exports.deleteApplication = async (userId, applicationId) => {
    const companyId = await _getCompanyId(userId);
    const jobIds    = await _getJobIds(companyId);

    const app = await Application.findOne({
        where: { id: applicationId, job_id: jobIds }
    });
    if (!app) throw new Error('Không tìm thấy đơn ứng tuyển hoặc bạn không có quyền thao tác.');

    await app.destroy();
    return true;
};
