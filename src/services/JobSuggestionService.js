const prisma = require('../config/prisma');

exports.getJobSuggestions = async (userId, limit = 10) => {
    const safeLimit = Math.min(50, Math.max(1, parseInt(limit) || 10));

    const profile = await prisma.candidate_profile.findUnique({
        where: { userId },
        include: {
            skills: {
                include: { skill: { select: { id: true, name: true } } }
            }
        }
    });

    // 2. Lấy tất cả job đã apply (kể cả đã xóa/rút) để loại trừ
    const appliedApplications = await Application.findAll({
        where: { user_id: userId },
        attributes: ['job_id']
    });

    const appliedJobIds = appliedApplications.map(a => a.job_id);

    const excludeClause = appliedJobIds.length > 0
        ? { id: { [Op.notIn]: appliedJobIds } }
        : {};

    const deadlineClause = {
        [Op.or]: [
            { deadline: { [Op.gt]: sequelize.fn('NOW') } },
            { deadline: null }
        ]
    };

    // 3. Không có kỹ năng → trả về job mới nhất chưa hết hạn
    if (!profile || !profile.skills || profile.skills.length === 0) {
        return await Job.findAll({
            where: {
                status: 'approved',
                ...excludeClause,
                ...deadlineClause
            },
            include: [
                { model: Company, as: 'company', attributes: ['name', 'logo_url', 'city'] },
                { model: Skill, as: 'skills', through: { attributes: [] }, attributes: ['id', 'name'] }
            ],
            order: [['createdAt', 'DESC']],
            limit: safeLimit
        });

        return jobs.map(job => ({
            id: job.id,
            title: job.title,
            location: job.location,
            jobType: job.jobType,
            jobLevel: job.jobLevel,
            benefits: job.benefits,
            description: job.description,
            requirements: job.requirements,
            skills: job.skills.map(js => js.skill),
            salaryMin: job.salaryMin,
            salaryMax: job.salaryMax,
            deadline: job.deadline,
            company: job.company
        }));
    }

    const candidateSkillIds = profile.skills.map(s => s.skill.id);

    // 4. Tìm job có skill khớp và chưa hết hạn
    const jobs = await Job.findAll({
        where: {
            status: 'approved',
            ...excludeClause,
            ...deadlineClause
        },
        include: [
            {
                model: Company,
                as: 'company',
                attributes: ['name', 'logo_url', 'city']
            },
            {
                model: Skill,
                as: 'skills',
                through: { attributes: [] },
                attributes: ['id', 'name'],
                where: { id: { [Op.in]: candidateSkillIds } },
                required: true
            }
        ],
        limit: safeLimit * 3
    });

    // 5. Tính điểm match và sắp xếp
    return jobs
        .map(job => {
            const jobSkillIds = job.skills.map(s => s.skill.id);
            const matchCount = jobSkillIds.filter(id => candidateSkillIds.includes(id)).length;
            const matchPercent = Math.round((matchCount / candidateSkillIds.length) * 100);
            const matchedSkills = job.skills
                .filter(s => candidateSkillIds.includes(s.skill.id))
                .map(s => s.skill.name);

            return {
                id: job.id,
                title: job.title,
                location: job.location,
                jobType: job.jobType,
                jobLevel: job.jobLevel,
                benefits: job.benefits,
                description: job.description,
                requirements: job.requirements,
                skills: job.skills.map(js => js.skill),
                salaryMin: job.salaryMin,
                salaryMax: job.salaryMax,
                deadline: job.deadline,
                company: job.company,
                matchedSkills,
                matchCount,
                matchPercent
            };
        })
        .sort((a, b) => b.matchCount - a.matchCount)
        .slice(0, safeLimit);
};
