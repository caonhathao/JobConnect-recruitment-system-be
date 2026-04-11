const { Op } = require('sequelize');
const { Candidate_profile, Skill, Job, Company, Application, sequelize } = require('../models');

exports.getJobSuggestions = async (userId, limit = 10) => {
    // Giới hạn tối đa 50
    const safeLimit = Math.min(50, Math.max(1, parseInt(limit) || 10));

    // 1. Lấy kỹ năng ứng viên
    const profile = await Candidate_profile.findOne({
        where: { user_id: userId },
        include: [{
            model: Skill,
            as: 'skills',
            through: { attributes: [] },
            attributes: ['id', 'name']
        }]
    });

    // 1a. Lấy danh sách job đã ứng tuyển — dùng Sequelize thay vì literal
    const appliedApplications = await Application.findAll({
        where:      { user_id: userId },
        attributes: ['job_id']
    });
    const appliedJobIds = appliedApplications.map(a => a.job_id);

    const excludeClause = appliedJobIds.length > 0
        ? { id: { [Op.notIn]: appliedJobIds } }
        : {};

    // Không có kỹ năng → trả về job mới nhất
    if (!profile || !profile.skills || profile.skills.length === 0) {
        return await Job.findAll({
            where: { status: 'approved', ...excludeClause },
            include: [{ model: Company, as: 'company', attributes: ['name', 'logo_url', 'city'] },
            {model: Skill, as: 'skills', through: { attributes: [] }, attributes: ['id', 'name']}],
            order: [['createdAt', 'DESC']],
            limit: safeLimit
        });
    }

    const candidateSkillIds = profile.skills.map(s => s.id);

    // 2. Tìm job có skill khớp
    const jobs = await Job.findAll({
        where: {
            status: 'approved',
            ...excludeClause
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
                where:    { id: { [Op.in]: candidateSkillIds } },
                required: true
            }
        ],
        limit: safeLimit * 3
    });

    // 3. Tính điểm match và sắp xếp
    return jobs
        .map(job => {
            const jobSkillIds   = job.skills.map(s => s.id);
            const matchCount    = jobSkillIds.filter(id => candidateSkillIds.includes(id)).length;
            const matchPercent  = Math.round((matchCount / candidateSkillIds.length) * 100);
            const matchedSkills = job.skills
                .filter(s => candidateSkillIds.includes(s.id))
                .map(s => s.name);

            return {
                id:             job.id,
                title:          job.title,
                location:       job.location,
                job_type:       job.job_type,
                job_level:      job.job_level,
                benefits:       job.benefits,
                description:    job.description,
                requirements:   job.requirements,
                skills:         job.skills,
                salary_min:     job.salary_min,
                salary_max:     job.salary_max,
                deadline:       job.deadline,
                company:        job.company,
                matched_skills: matchedSkills,
                match_count:    matchCount,
                match_percent:  matchPercent
            };
        })
        .sort((a, b) => b.match_count - a.match_count)
        .slice(0, safeLimit);
};