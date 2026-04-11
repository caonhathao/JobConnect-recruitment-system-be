const { Op, fn, col, literal } = require('sequelize');
const { User, Job, Application, Company, sequelize } = require('../models');

// ==============================================================================
// THỐNG KÊ TỔNG QUAN HỆ THỐNG
// ==============================================================================
exports.getSystemStats = async () => {
    const [totalUsers, totalCandidates, totalRecruiters,
           totalCompanies, approvedCompanies,
           totalJobs, approvedJobs,
           totalApplications, acceptedApplications] = await Promise.all([
        User.count(),
        User.count({ where: { role: 'candidate' } }),
        User.count({ where: { role: 'recruiter' } }),
        Company.count(),
        Company.count({ where: { status: 'approved' } }),
        Job.count(),
        Job.count({ where: { status: 'approved' } }),
        Application.count(),
        Application.count({ where: { status: 'accepted' } }),
    ]);

    const reviewed = await Application.count({
        where: { status: { [Op.in]: ['accepted', 'rejected'] } }
    });

    return {
        users: {
            total:      totalUsers,
            candidates: totalCandidates,
            recruiters: totalRecruiters
        },
        companies: {
            total:    totalCompanies,
            approved: approvedCompanies,
            pending:  totalCompanies - approvedCompanies
        },
        jobs: {
            total:    totalJobs,
            approved: approvedJobs,
            pending:  await Job.count({ where: { status: 'pending' } }),
            rejected: await Job.count({ where: { status: 'rejected' } })
        },
        applications: {
            total:    totalApplications,
            accepted: acceptedApplications,
            success_rate: reviewed > 0
                ? `${Math.round((acceptedApplications / reviewed) * 100)}%`
                : '0%'
        }
    };
};

// ==============================================================================
// TĂNG TRƯỞNG USER THEO THÁNG (12 tháng gần nhất)
// ==============================================================================
exports.getUserGrowth = async () => {
    const rows = await User.findAll({
        attributes: [
            [fn('DATE_TRUNC', 'month', col('created_at')), 'month'],
            [fn('COUNT', col('id')), 'count'],
            'role'
        ],
        where: {
            created_at: {
                [Op.gte]: literal("NOW() - INTERVAL '12 months'")
            }
        },
        group: [literal("DATE_TRUNC('month', created_at)"), 'role'],
        order: [[literal("DATE_TRUNC('month', created_at)"), 'ASC']],
        raw: true
    });

    // Gom nhóm theo tháng
    const byMonth = {};
    rows.forEach(row => {
        const month = new Date(row.month).toISOString().slice(0, 7); // YYYY-MM
        if (!byMonth[month]) byMonth[month] = { month, candidate: 0, recruiter: 0, total: 0 };
        byMonth[month][row.role] = parseInt(row.count);
        byMonth[month].total += parseInt(row.count);
    });

    return Object.values(byMonth);
};

// ==============================================================================
// SỐ ĐƠN ỨNG TUYỂN / CV THEO THÁNG (12 tháng gần nhất)
// ==============================================================================
exports.getApplicationsByMonth = async () => {
    const rows = await Application.findAll({
        attributes: [
            [fn('DATE_TRUNC', 'month', col('applied_at')), 'month'],
            [fn('COUNT', col('id')), 'count'],
            'status'
        ],
        where: {
            applied_at: {
                [Op.gte]: literal("NOW() - INTERVAL '12 months'")
            }
        },
        group: [literal("DATE_TRUNC('month', applied_at)"), 'status'],
        order: [[literal("DATE_TRUNC('month', applied_at)"), 'ASC']],
        raw: true
    });

    // Gom nhóm theo tháng
    const byMonth = {};
    rows.forEach(row => {
        const month = new Date(row.month).toISOString().slice(0, 7);
        if (!byMonth[month]) byMonth[month] = { month, total: 0, accepted: 0, rejected: 0 };
        byMonth[month].total += parseInt(row.count);
        if (row.status === 'accepted') byMonth[month].accepted += parseInt(row.count);
        if (row.status === 'rejected') byMonth[month].rejected += parseInt(row.count);
    });

    return Object.values(byMonth);
};

// ==============================================================================
// TIN TUYỂN DỤNG THEO LOẠI CÔNG VIỆC (job_type)
// ==============================================================================
exports.getJobsByType = async () => {
    const rows = await Job.findAll({
        attributes: [
            'job_type',
            [fn('COUNT', col('id')), 'count']
        ],
        where: { status: 'approved' },
        group: ['job_type'],
        order: [[literal('COUNT(id)'), 'DESC']],
        raw: true
    });

    return rows.map(r => ({
        job_type: r.job_type || 'Khác',
        count:    parseInt(r.count)
    }));
};

// ==============================================================================
// TIN TUYỂN DỤNG THEO CẤP ĐỘ (job_level)
// ==============================================================================
exports.getJobsByLevel = async () => {
    const rows = await Job.findAll({
        attributes: [
            'job_level',
            [fn('COUNT', col('id')), 'count']
        ],
        where: { status: 'approved' },
        group: ['job_level'],
        order: [[literal('COUNT(id)'), 'DESC']],
        raw: true
    });

    return rows.map(r => ({
        job_level: r.job_level || 'Khác',
        count:     parseInt(r.count)
    }));
};
