const { Job, Company, Skill } = require('../models');

// ==============================================================================
// 1. LẤY CHI TIẾT 1 CÔNG VIỆC (PUBLIC)
// ==============================================================================
exports.getJobDetail = async (jobId) => {
    const job = await Job.findOne({
        where: { 
            id: jobId, 
            status: 'approved' // Khách chỉ thấy job đã duyệt
        },
        include: [
            {
                model: Company,
                as: 'company',
                attributes: ['id', 'name', 'logo_url', 'city', 'address', 'website', 'size', 'description']
            },
            {
                model: Skill,
                as: 'skills',
                attributes: ['id', 'name'],
                through: { attributes: [] }
            }
        ]
    });

    if (!job) {
        throw new Error('Không tìm thấy tin tuyển dụng hoặc tin đã bị khóa/gỡ bỏ.');
    }

    return job;
};

// ==============================================================================
// 2. LẤY CHI TIẾT THÔNG TIN 1 CÔNG TY VÀ CÁC JOB CỦA HỌ (PUBLIC)
// ==============================================================================
exports.getCompanyDetail = async (companyId) => {
    // 1. Lấy thông tin công ty
    // Thêm include Jobs vào query Company luôn
const company = await Company.findOne({
    where: { id: companyId, status: 'approved' },
    attributes: { exclude: ['user_id', 'status', 'rejection_reason'] },
    include: [{
        model: Job,
        as: 'jobs',
        where: { status: 'approved' },
        required: false, // LEFT JOIN — công ty không có job vẫn hiện
        attributes: ['id', 'title', 'location', 'salary_min', 'salary_max', 'job_type', 'created_at', 'deadline', 'job_level'],
        order: [['created_at', 'DESC']]
    }]
});

if (!company) throw new Error('Không tìm thấy thông tin công ty hoặc công ty chưa được duyệt.');

return {
    company,
    active_jobs: company.jobs
};
};
