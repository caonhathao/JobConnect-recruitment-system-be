const { Job, Company, User, Skill } = require('../models');
const { Op } = require('sequelize');

// ==============================================================================
// 1. DANH SÁCH TIN TUYỂN DỤNG ĐANG CHỜ DUYỆT
// ==============================================================================
exports.getPendingJobs = async (filters = {}) => {
    const pageSize   = Math.min(50, Math.max(1, parseInt(filters.limit) || 10));
    const pageNumber = Math.max(1, parseInt(filters.page) || 1);
    const offset     = (pageNumber - 1) * pageSize;

    const { count, rows } = await Job.findAndCountAll({
        where: { status: 'pending' },
        include: [
            {
                model: Company,
                as: 'company',
                attributes: ['id', 'name', 'logo_url', 'city'],
                include: [{ model: User, as: 'user', attributes: ['full_name', 'email'] }]
            },
            {
                model: Skill,
                as: 'skills',
                through: { attributes: [] },
                attributes: ['id', 'name']
            }
        ],
        order:    [['createdAt', 'ASC']], // FIFO
        limit:    pageSize,
        offset,
        distinct: true
    });

    return {
        total_items:  count,
        total_pages:  Math.ceil(count / pageSize),
        current_page: pageNumber,
        jobs:         rows
    };
};

// ==============================================================================
// 2. DANH SÁCH TẤT CẢ TIN TUYỂN DỤNG (lọc theo status)
// ==============================================================================
exports.getAllJobs = async (filters = {}) => {
    const {
        status,
        keyword,
        page  = 1,
        limit = 10
    } = filters;

    const pageSize   = Math.min(50, Math.max(1, parseInt(limit)));
    const pageNumber = Math.max(1, parseInt(page));
    const offset     = (pageNumber - 1) * pageSize;

    const where = {};
    if (status) where.status = status;

    // Tìm kiếm theo tiêu đề job
    if (keyword) {
        where.title = { [Op.substring]: keyword.trim() };
    }

    const { count, rows } = await Job.findAndCountAll({
        where,
        include: [
            {
                model: Company,
                as: 'company',
                attributes: ['id', 'name', 'logo_url', 'city']
            },
            {
                model: Skill,
                as: 'skills',
                through: { attributes: [] },
                attributes: ['id', 'name']
            }
        ],
        order:    [['createdAt', 'DESC']],
        limit:    pageSize,
        offset,
        distinct: true
    });

    return {
        total_items:  count,
        total_pages:  Math.ceil(count / pageSize),
        current_page: pageNumber,
        jobs:         rows
    };
};

// ==============================================================================
// 3. XEM CHI TIẾT MỘT TIN TUYỂN DỤNG
// ==============================================================================
exports.getJobDetail = async (jobId) => {
    const job = await Job.findByPk(jobId, {
        include: [
            {
                model: Company,
                as: 'company',
                include: [{ model: User, as: 'user', attributes: ['full_name', 'email', 'phone'] }]
            },
            { model: Skill, as: 'skills', through: { attributes: [] } }
        ]
    });
    if (!job) throw new Error('Tin tuyển dụng không tồn tại.');
    return job;
};

// ==============================================================================
// 4. DUYỆT TIN TUYỂN DỤNG (approved / rejected)
// ==============================================================================
/**
 * @param {string} jobId
 * @param {'approved' | 'rejected'} action
 * @param {string} [reason] - Bắt buộc khi rejected
 */
exports.reviewJob = async (jobId, action, reason) => {
    if (!['approved', 'rejected'].includes(action)) {
        throw new Error('Hành động không hợp lệ. Chỉ chấp nhận: approved hoặc rejected.');
    }
    if (action === 'rejected' && !reason?.trim()) {
        throw new Error('Vui lòng cung cấp lý do từ chối tin đăng.');
    }

    const job = await Job.findByPk(jobId);
    if (!job) throw new Error('Tin tuyển dụng không tồn tại.');

    if (job.status !== 'pending') {
        throw new Error(`Tin tuyển dụng này đã được xử lý (trạng thái hiện tại: ${job.status}).`);
    }

    await job.update({
        status:           action,
        rejection_reason: action === 'rejected' ? reason.trim() : null
    });

    return await Job.findByPk(jobId, {
        include: [{ model: Company, as: 'company', attributes: ['name'] }]
    });
};

// ==============================================================================
// 5. XÓA JOB VI PHẠM (Admin — kể cả job đã approved)
// ==============================================================================
exports.deleteJob = async (jobId) => {
    const job = await Job.findByPk(jobId);
    if (!job) throw new Error('Tin tuyển dụng không tồn tại.');
    await job.destroy();
    return true;
};
