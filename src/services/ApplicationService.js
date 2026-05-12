const { Application, Job, Resume, Company } = require('../models');

// ==============================================================================
// PRIVATE HELPERS
// ==============================================================================
const _getActiveJob = async (jobId) => {
    const job = await Job.findOne({ where: { id: jobId, status: 'approved' } });
    if (!job) throw new Error('Công việc không tồn tại hoặc đã đóng tuyển.');
    if (job.deadline && new Date(job.deadline) < new Date()) {
        throw new Error('Công việc này đã hết hạn nộp hồ sơ.');
    }
    return job;
};

// ==============================================================================
// 1. NỘP ĐƠN ỨNG TUYỂN
// ==============================================================================
/**
 * @param {string} userId
 * @param {{ job_id, resume_id?, cover_letter? }} data
 */
exports.applyJob = async (userId, data) => {
    const { job_id, resume_id, cover_letter } = data;

    if (!job_id) throw new Error('Vui lòng chọn công việc muốn ứng tuyển.');

    // Kiểm tra job hợp lệ
    await _getActiveJob(job_id);

    // Kiểm tra đã nộp đơn chưa
    const existed = await Application.findOne({ where: { user_id: userId, job_id } });
    if (existed) throw new Error('Bạn đã nộp đơn ứng tuyển vị trí này rồi.');

    // Lấy CV URL (ưu tiên CV được chỉ định, fallback về CV default)
    let cvUrl = null;
    if (resume_id) {
        const resume = await Resume.findOne({ where: { id: resume_id, user_id: userId } });
        if (!resume) throw new Error('CV không tồn tại hoặc không thuộc về bạn.');
        cvUrl = resume.file_url;
    } else {
        const defaultResume = await Resume.findOne({ where: { user_id: userId, is_default: true } });
        if (defaultResume) cvUrl = defaultResume.file_url;
    }

    const application = await Application.create({
        user_id:      userId,
        job_id,
        cv_url:       cvUrl,
        cover_letter: cover_letter?.trim() || null,
        status:       'submitted'
    });

    return application;
};

// ==============================================================================
// 2. DANH SÁCH ĐƠN ỨNG TUYỂN — Thêm phân trang + filter
// ==============================================================================
exports.getMyApplications = async (userId, filters = {}) => {
    const pageSize   = Math.min(50, Math.max(1, parseInt(filters.limit) || 10));
    const pageNumber = Math.max(1, parseInt(filters.page) || 1);
    const offset     = (pageNumber - 1) * pageSize;
    
    const where = { user_id: userId, is_deleted: false }; 
    if (filters.status) where.status = filters.status;

    const { count, rows } = await Application.findAndCountAll({
        where,
        include: [{
            model: Job,
            as: 'job',
            attributes: ['id', 'title', 'location', 'job_type', 'salary_min', 'salary_max', 'deadline'],
            include: [{ model: Company, as: 'company', attributes: ['name', 'logo_url'] }]
        }],
        order:    [['applied_at', 'DESC']],
        limit:    pageSize,
        offset,
        distinct: true
    });

    return {
        total_items:  count,
        total_pages:  Math.ceil(count / pageSize),
        current_page: pageNumber,
        applications: rows.map(app => ({
            id:                app.id,
            status:            app.status,
            cover_letter:      app.cover_letter,
            cv_url:            app.cv_url,
            applied_at:        app.applied_at,
            note_by_recruiter: app.note_by_recruiter,
            job: {
                id:         app.job?.id,
                title:      app.job?.title,
                location:   app.job?.location,
                job_type:   app.job?.job_type,
                salary_min: app.job?.salary_min,
                salary_max: app.job?.salary_max,
                deadline:   app.job?.deadline,
                company:    app.job?.company
            }
        }))
    };
};

// ==============================================================================
// 3. CHI TIẾT MỘT ĐƠN ỨNG TUYỂN
// ==============================================================================
exports.getApplicationDetail = async (userId, applicationId) => {
    const app = await Application.findOne({
        where: { id: applicationId, user_id: userId },
        include: [{
            model: Job,
            as: 'job',
            include: [{ model: Company, as: 'company' }]
        }]
    });
    if (!app) throw new Error('Không tìm thấy đơn ứng tuyển.');
    return app;
};

// ==============================================================================
// 4. RÚT ĐƠN ỨNG TUYỂN (chỉ khi status = submitted)
// ==============================================================================

exports.withdrawApplication = async (userId, applicationId) => {
    const app = await Application.findOne({ 
        where: { id: applicationId, user_id: userId } 
    });
    if (!app) throw new Error('Không tìm thấy đơn ứng tuyển.');

    if (app.status !== 'submitted') {
        throw new Error('Chỉ có thể rút đơn khi hồ sơ đang ở trạng thái "Đã nộp".');
    }

    // ✅ Soft delete thay vì destroy()
    await app.update({ is_deleted: true });
    return true;
};
// ==============================================================================
// 5. Xóa đơn đó nếu bị từ chối
// ==============================================================================   

exports.deleteRejectedApplication = async (userId, applicationId) => {
    const app = await Application.findOne({ 
        where: { id: applicationId, user_id: userId } 
    });
    if (!app) throw new Error('Không tìm thấy đơn ứng tuyển.');

    if (app.status !== 'rejected') {
        throw new Error('Chỉ có thể xóa đơn khi hồ sơ đã bị từ chối.');
    }

    // ✅ Soft delete — giữ lại record để excludeClause vẫn hoạt động
    await app.update({ is_deleted: true });
    return true;
};