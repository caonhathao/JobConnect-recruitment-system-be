const prisma = require('../config/prisma');

const _getActiveJob = async (jobId) => {
    const job = await prisma.job.findFirst({ where: { id: jobId, status: 'approved' } });
    if (!job) throw new Error('Công việc không tồn tại hoặc đã đóng tuyển.');
    if (job.deadline && new Date(job.deadline) < new Date()) {
        throw new Error('Công việc này đã hết hạn nộp hồ sơ.');
    }
    return job;
};

exports.applyJob = async (userId, data) => {
    const { job_id, resume_id, cover_letter } = data;

    if (!job_id) throw new Error('Vui lòng chọn công việc muốn ứng tuyển.');

    await _getActiveJob(job_id);

    const existed = await prisma.application.findFirst({ where: { userId, jobId: job_id } });
    if (existed) throw new Error('Bạn đã nộp đơn ứng tuyển vị trí này rồi.');

    let resumeUrl = null;
    if (resume_id) {
        const resume = await prisma.resume.findFirst({ where: { id: resume_id, userId } });
        if (!resume) throw new Error('CV không tồn tại hoặc không thuộc về bạn.');
        resumeUrl = resume.fileUrl;
    } else {
        const defaultResume = await prisma.resume.findFirst({ where: { userId, isDefault: true } });
        if (defaultResume) resumeUrl = defaultResume.fileUrl;
    }

    const job = await prisma.job.findUnique({ where: { id: job_id } });
    const user = await prisma.user.findUnique({ where: { id: userId } });

    const application = await prisma.application.create({
        data: {
            userId,
            jobId: job_id,
            companyId: job?.companyId || null,
            fullName: user?.fullName || '',
            email: user?.email || '',
            phone: user?.phone || '',
            resumeUrl: resumeUrl,
            coverLetter: cover_letter?.trim() || null,
            status: 'submitted'
        }
    });

    return application;
};

exports.getMyApplications = async (userId, filters = {}) => {
    const pageSize = Math.min(50, Math.max(1, parseInt(filters.limit) || 10));
    const pageNumber = Math.max(1, parseInt(filters.page) || 1);
    const skip = (pageNumber - 1) * pageSize;

    const where = { userId };
    if (filters.status) where.status = filters.status;

    const [count, applications] = await Promise.all([
        prisma.application.count({ where }),
        prisma.application.findMany({
            where,
            include: {
                job: {
                    select: {
                        id: true, title: true, location: true, jobType: true,
                        salaryMin: true, salaryMax: true, deadline: true,
                        company: { select: { name: true, logoUrl: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: pageSize,
            skip
        })
    ]);

    return {
        total_items: count,
        total_pages: Math.ceil(count / pageSize),
        current_page: pageNumber,
        applications: applications.map(app => ({
            id: app.id,
            status: app.status,
            cover_letter: app.coverLetter,
            resume_url: app.resumeUrl,
            applied_at: app.createdAt,
            created_at: app.createdAt,
            job: {
                id: app.job?.id,
                title: app.job?.title,
                location: app.job?.location,
                job_type: app.job?.jobType,
                salary_min: app.job?.salaryMin,
                salary_max: app.job?.salaryMax,
                deadline: app.job?.deadline,
                company: app.job?.company
            }
        }))
    };
};

exports.getApplicationDetail = async (userId, applicationId) => {
    const app = await prisma.application.findFirst({
        where: { id: applicationId, userId },
        include: {
            job: {
                include: { company: true }
            }
        }
    });
    if (!app) throw new Error('Không tìm thấy đơn ứng tuyển.');
    return app;
};

exports.withdrawApplication = async (userId, applicationId) => {
    const app = await prisma.application.findFirst({ where: { id: applicationId, userId } });
    if (!app) throw new Error('Không tìm thấy đơn ứng tuyển.');

    if (app.status !== 'submitted') {
        throw new Error('Chỉ có thể rút đơn khi hồ sơ đang ở trạng thái "Đã nộp".');
    }

    await prisma.application.delete({ where: { id: applicationId } });
    return true;
};
