const path = require('path');
const fs   = require('fs');
const { Company, Application, Resume, User, Job, Candidate_profile } = require('../models');

// ==============================================================================
// PRIVATE HELPER
// ==============================================================================
/**
 * Lấy company của recruiter (không cần approved vì đây là xem dữ liệu)
 */
const _getCompanyId = async (userId) => {
    const company = await Company.findOne({ where: { user_id: userId } });
    if (!company) throw new Error('Bạn chưa có hồ sơ công ty.');
    return company.id;
};

// ==============================================================================
// 1. XEM DANH SÁCH ỨNG VIÊN THEO TỪNG JOB
// ==============================================================================
/**
 * @param {string} userId  - recruiter userId
 * @param {string} jobId   - ID của tin tuyển dụng
 */
exports.getApplicantsByJob = async (userId, jobId) => {
    const companyId = await _getCompanyId(userId);

    // Kiểm tra job thuộc công ty này
    const job = await Job.findOne({ where: { id: jobId, company_id: companyId } });
    if (!job) throw new Error('Tin tuyển dụng không tồn tại hoặc không thuộc công ty bạn.');

    const applications = await Application.findAll({
        where: { job_id: jobId },
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
        order: [['applied_at', 'DESC']]
    });

    return applications.map(app => ({
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
            linkedin:   app.candidate?.candidateProfile?.linkedin_url
        }
    }));
};

// ==============================================================================
// 2. XEM TOÀN BỘ ỨNG VIÊN CỦA TẤT CẢ JOB (tổng quan)
// ==============================================================================
exports.getAllApplicants = async (userId, filters = {}) => {
    const companyId = await _getCompanyId(userId);

    // Lấy danh sách job_id của công ty
    const myJobs = await Job.findAll({
        where: { company_id: companyId },
        attributes: ['id']
    });
    const jobIds = myJobs.map(j => j.id);

    if (jobIds.length === 0) return [];

    const where = { job_id: jobIds };
    if (filters.status) where.status = filters.status;

    const applications = await Application.findAll({
        where,
        include: [
            {
                model: User,
                as: 'candidate',
                attributes: ['id', 'full_name', 'email', 'phone', 'avatar_url']
            },
            {
                model: Job,
                as: 'job',
                attributes: ['id', 'title']
            }
        ],
        order: [['applied_at', 'DESC']]
    });

    return applications.map(app => ({
        application_id: app.id,
        status:         app.status,
        cv_url:         app.cv_url,
        applied_at:     app.applied_at,
        job:            { id: app.job?.id, title: app.job?.title },
        candidate:      {
            id:         app.candidate?.id,
            full_name:  app.candidate?.full_name,
            email:      app.candidate?.email,
            phone:      app.candidate?.phone,
            avatar_url: app.candidate?.avatar_url
        }
    }));
};

// ==============================================================================
// 3. XEM CHI TIẾT ĐƠN ỨNG TUYỂN + COVER LETTER
// ==============================================================================
exports.getApplicationDetail = async (userId, applicationId) => {
    const companyId = await _getCompanyId(userId);

    const myJobs = await Job.findAll({ where: { company_id: companyId }, attributes: ['id'] });
    const jobIds = myJobs.map(j => j.id);

    const app = await Application.findOne({
        where: { id: applicationId, job_id: jobIds },
        include: [
            {
                model: User,
                as: 'candidate',
                attributes: ['id', 'full_name', 'email', 'phone', 'avatar_url'],
                include: [{ model: Candidate_profile, as: 'candidateProfile' }]
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
/**
 * @returns {{ filePath, fileName, mode }} mode = 'view' hoặc 'download'
 */
exports.getCvFile = async (userId, applicationId, mode = 'view') => {
    const companyId = await _getCompanyId(userId);
    const myJobs = await Job.findAll({ where: { company_id: companyId }, attributes: ['id'] });
    const jobIds = myJobs.map(j => j.id);

    const app = await Application.findOne({
        where: { id: applicationId, job_id: jobIds }
    });
    if (!app) throw new Error('Không tìm thấy đơn ứng tuyển hoặc bạn không có quyền xem.');
    if (!app.cv_url) throw new Error('Ứng viên này chưa đính kèm CV.');

    // cv_url lưu dạng: /uploads/resumes/resume-xxx.pdf
    const filePath = path.join(__dirname, '..', app.cv_url);
    if (!fs.existsSync(filePath)) throw new Error('File CV không tồn tại trên server.');

    const fileName = path.basename(filePath);
    return { filePath, fileName, mode };
};

// ==============================================================================
// 5. CẬP NHẬT TRẠNG THÁI HỒ SƠ ỨNG VIÊN
// ==============================================================================
const VALID_STATUS_FLOW = ['submitted', 'under_review', 'interview', 'accepted', 'rejected'];

exports.updateApplicationStatus = async (userId, applicationId, status, note) => {
    if (!VALID_STATUS_FLOW.includes(status)) {
        throw new Error(`Trạng thái không hợp lệ. Chỉ chấp nhận: ${VALID_STATUS_FLOW.join(', ')}`);
    }

    const companyId = await _getCompanyId(userId);
    const myJobs    = await Job.findAll({ where: { company_id: companyId }, attributes: ['id'] });
    const jobIds    = myJobs.map(j => j.id);

    const app = await Application.findOne({
        where: { id: applicationId, job_id: jobIds }
    });
    if (!app) throw new Error('Không tìm thấy đơn ứng tuyển hoặc bạn không có quyền thao tác.');

    // Không cho lùi trạng thái (chỉ tiến hoặc reject)
    const currentIdx = VALID_STATUS_FLOW.indexOf(app.status);
    const newIdx     = VALID_STATUS_FLOW.indexOf(status);

    if (newIdx < currentIdx && status !== 'rejected') {
        throw new Error('Không thể quay lại trạng thái trước đó.');
    }

    await app.update({
        status,
        note_by_recruiter: note?.trim() || app.note_by_recruiter
    });

    return app;
};
