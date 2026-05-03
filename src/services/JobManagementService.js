const prisma = require('../config/prisma');

const _getApprovedCompany = async (userId) => {
    const company = await prisma.company.findUnique({ where: { userId } });
    if (!company) throw new Error('Bạn chưa có hồ sơ công ty.');
    if (company.status !== 'approved') throw new Error('Hồ sơ công ty chưa được Admin duyệt. Bạn chưa thể đăng tin.');
    return company;
};

const _getOwnJob = async (userId, jobId) => {
    const company = await prisma.company.findUnique({ where: { userId } });
    if (!company) throw new Error('Bạn chưa có hồ sơ công ty.');

    const job = await prisma.job.findFirst({
        where: { id: jobId, companyId: company.id },
        include: {
            skills: {
                include: { skill: { select: { id: true, name: true } } }
            },
            company: true
        }
    });
    if (!job) throw new Error('Không tìm thấy tin đăng hoặc bạn không có quyền thao tác.');

    job.skills = job.skills.map(js => js.skill);
    return job;
};

const _attachSkills = async (jobId, skills) => {
    const skillIds = [];
    for (const name of skills) {
        const cleanName = name.trim();
        if (!cleanName) continue;
        const skill = await prisma.skill.upsert({
            where: { name: cleanName },
            update: {},
            create: { name: cleanName }
        });
        skillIds.push({ skillId: skill.id });
    }

    await prisma.job_skill.deleteMany({ where: { jobId } });
    if (skillIds.length > 0) {
        await prisma.job_skill.createMany({
            data: skillIds.map(s => ({ jobId, skillId: s.skillId }))
        });
    }
};

exports.createJob = async (userId, data) => {
    const company = await _getApprovedCompany(userId);

    const {
        title, description, requirements, benefits,
        salary_min, salary_max, location,
        job_type, job_level, deadline, skills = []
    } = data;

    if (!title?.trim()) throw new Error('Tiêu đề công việc không được để trống.');

    const job = await prisma.job.create({
        data: {
            companyId: company.id,
            title: title.trim(),
            description: description?.trim() || null,
            requirements: requirements?.trim() || null,
            benefits: benefits?.trim() || null,
            salaryMin: salary_min || null,
            salaryMax: salary_max || null,
            location: location?.trim() || null,
            jobType: job_type?.trim() || null,
            jobLevel: job_level?.trim() || null,
            deadline: deadline || null,
            status: 'pending'
        }
    });

    if (skills.length > 0) {
        await _attachSkills(job.id, skills);
    }

    return await _getOwnJob(userId, job.id);
};

exports.getMyJobs = async (userId, filters = {}) => {
    const company = await prisma.company.findUnique({ where: { userId } });
    if (!company) throw new Error('Bạn chưa có hồ sơ công ty.');

    const pageSize = Math.min(50, Math.max(1, parseInt(filters.limit) || 10));
    const pageNumber = Math.max(1, parseInt(filters.page) || 1);
    const skip = (pageNumber - 1) * pageSize;

    const where = { companyId: company.id };
    if (filters.status) where.status = filters.status;

    const [count, jobs] = await Promise.all([
        prisma.job.count({ where }),
        prisma.job.findMany({
            where,
            include: {
                skills: {
                    include: { skill: { select: { id: true, name: true } } }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: pageSize,
            skip
        })
    ]);

    const transformedJobs = jobs.map(job => ({
        ...job,
        skills: job.skills.map(js => js.skill)
    }));

    return {
        total_items: count,
        total_pages: Math.ceil(count / pageSize),
        current_page: pageNumber,
        jobs: transformedJobs
    };
};

exports.getJobDetail = async (userId, jobId) => {
    return await _getOwnJob(userId, jobId);
};

exports.updateJob = async (userId, jobId, data) => {
    const job = await _getOwnJob(userId, jobId);

    if (job.status === 'rejected') {
        throw new Error('Tin đăng đã bị từ chối. Vui lòng tạo tin đăng mới.');
    }

    const {
        title, description, requirements, benefits,
        salary_min, salary_max, location,
        job_type, job_level, deadline, skills
    } = data;

    if (title !== undefined && !title?.trim()) {
        throw new Error('Tiêu đề công việc không được để trống.');
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (requirements !== undefined) updateData.requirements = requirements?.trim() || null;
    if (benefits !== undefined) updateData.benefits = benefits?.trim() || null;
    if (salary_min !== undefined) updateData.salaryMin = salary_min;
    if (salary_max !== undefined) updateData.salaryMax = salary_max;
    if (location !== undefined) updateData.location = location?.trim() || null;
    if (job_type !== undefined) updateData.jobType = job_type?.trim() || null;
    if (job_level !== undefined) updateData.jobLevel = job_level?.trim() || null;
    if (deadline !== undefined) updateData.deadline = deadline;

    if (Object.keys(updateData).length > 0 && job.status !== 'paused') {
        updateData.status = 'pending';
        updateData.rejectionReason = null;
    }

    await prisma.job.update({
        where: { id: jobId },
        data: updateData
    });

    if (Array.isArray(skills) && skills.length > 0) {
        await _attachSkills(jobId, skills);
    }

    return await _getOwnJob(userId, jobId);
};

exports.togglePauseJob = async (userId, jobId) => {
    const job = await _getOwnJob(userId, jobId);

    if (job.status === 'pending') throw new Error('Tin đang chờ duyệt. Không thể tạm dừng lúc này.');
    if (job.status === 'rejected') throw new Error('Tin đã bị từ chối. Không thể tạm dừng.');

    if (job.status === 'paused') {
        await prisma.job.update({
            where: { id: jobId },
            data: { status: 'approved' }
        });
        return { status: 'approved', message: 'Đã mở lại tin tuyển dụng.' };
    } else {
        await prisma.job.update({
            where: { id: jobId },
            data: { status: 'paused' }
        });
        return { status: 'paused', message: 'Đã tạm dừng tin tuyển dụng.' };
    }
};

exports.deleteJob = async (userId, jobId) => {
    const job = await _getOwnJob(userId, jobId);
    await prisma.job.delete({ where: { id: jobId } });
    return true;
};
