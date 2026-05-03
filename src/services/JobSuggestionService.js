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

    const appliedApplications = await prisma.application.findMany({
        where: { userId },
        select: { jobId: true }
    });
    const appliedJobIds = appliedApplications.map(a => a.jobId);

    const excludeClause = appliedJobIds.length > 0
        ? { id: { notIn: appliedJobIds } }
        : {};

    if (!profile || !profile.skills || profile.skills.length === 0) {
        const jobs = await prisma.job.findMany({
            where: { status: 'approved', ...excludeClause },
            include: {
                company: { select: { name: true, logoUrl: true, city: true } },
                skills: {
                    include: { skill: { select: { id: true, name: true } } }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: safeLimit
        });

        return jobs.map(job => ({
            ...job,
            skills: job.skills.map(js => js.skill)
        }));
    }

    const candidateSkillIds = profile.skills.map(s => s.skill.id);

    const jobs = await prisma.job.findMany({
        where: {
            status: 'approved',
            ...excludeClause,
            skills: {
                some: {
                    skillId: { in: candidateSkillIds }
                }
            }
        },
        include: {
            company: { select: { name: true, logoUrl: true, city: true } },
            skills: {
                include: { skill: { select: { id: true, name: true } } }
            }
        },
        take: safeLimit * 3
    });

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
                job_type: job.jobType,
                job_level: job.jobLevel,
                benefits: job.benefits,
                description: job.description,
                requirements: job.requirements,
                skills: job.skills.map(js => js.skill),
                salary_min: job.salaryMin,
                salary_max: job.salaryMax,
                deadline: job.deadline,
                company: job.company,
                matched_skills: matchedSkills,
                match_count: matchCount,
                match_percent: matchPercent
            };
        })
        .sort((a, b) => b.match_count - a.match_count)
        .slice(0, safeLimit);
};
