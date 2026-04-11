const { Bookmark, Job, Company } = require('../models');

// ==============================================================================
// 1. TOGGLE LƯU / BỎ LƯU TIN TUYỂN DỤNG
// ==============================================================================
exports.toggleBookmark = async (userId, jobId) => {
    const job = await Job.findByPk(jobId);
    if (!job) throw new Error('Công việc không tồn tại.');

    const existing = await Bookmark.findOne({ where: { user_id: userId, job_id: jobId } });

    if (existing) {
        await existing.destroy();
        return { bookmarked: false, message: 'Đã bỏ lưu tin tuyển dụng.' };
    } else {
        await Bookmark.create({ user_id: userId, job_id: jobId });
        return { bookmarked: true, message: 'Đã lưu tin tuyển dụng.' };
    }
};

// ==============================================================================
// 2. DANH SÁCH TIN ĐÃ LƯU
// ==============================================================================
exports.getBookmarks = async (userId, filters = {}) => {
    const pageSize   = Math.min(50, Math.max(1, parseInt(filters.limit) || 10));
    const pageNumber = Math.max(1, parseInt(filters.page) || 1);
    const offset     = (pageNumber - 1) * pageSize;

    const { count, rows } = await Bookmark.findAndCountAll({
        where: { user_id: userId },
        include: [{
            model: Job,
            as: 'job',
            attributes: ['id', 'title', 'location', 'job_type', 'salary_min', 'salary_max', 'deadline', 'status'],
            include: [{
                model: Company,
                as: 'company',
                attributes: ['name', 'logo_url', 'city']
            }]
        }],
        order:    [['createdAt', 'DESC']],
        limit:    pageSize,
        offset,
        distinct: true
    });

    return {
        total_items:  count,
        total_pages:  Math.ceil(count / pageSize),
        current_page: pageNumber,
        bookmarks:    rows.map(b => ({
            bookmark_id: b.id,
            saved_at:    b.createdAt,
            job:         b.job
        }))
    };
};