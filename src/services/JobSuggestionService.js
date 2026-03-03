const { Op } = require('sequelize');
const { Candidate_profile, Skill, Job, Company, sequelize } = require('../models');

// ==============================================================================
// ĐỀ XUẤT CÔNG VIỆC DỰA TRÊN KỸ NĂNG ỨNG VIÊN
// ==============================================================================
/**
 * @param {string} userId
 * @param {number} limit - số lượng kết quả tối đa
 */
exports.getJobSuggestions = async (userId, limit = 10) => {
    // 1. Lấy danh sách kỹ năng của ứng viên
    const profile = await Candidate_profile.findOne({
        where: { user_id: userId },
        include: [{
            model: Skill,
            as: 'skills',
            through: { attributes: [] },
            attributes: ['id', 'name']
        }]
    });

    // Không có kỹ năng → trả về job mới nhất được duyệt
    if (!profile || !profile.skills || profile.skills.length === 0) {
        return await Job.findAll({
            where: { status: 'approved' },
            include: [{ model: Company, as: 'company', attributes: ['name', 'logo_url', 'city'] }],
            order: [['createdAt', 'DESC']],
            limit: Number(limit)
        });
    }

    const candidateSkillIds = profile.skills.map(s => s.id);

    // 2. Tìm Job có ít nhất 1 skill trùng khớp, loại bỏ job đã ứng tuyển
    const jobs = await Job.findAll({
        where: {
            status: 'approved',
            id: {
                [Op.notIn]: sequelize.literal(`(
                    SELECT job_id FROM applications WHERE user_id = '${userId}'
                )`)
            }
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
                required: true  // INNER JOIN: chỉ lấy job có ít nhất 1 skill khớp
            }
        ],
        limit: Number(limit) * 3    // Lấy dư để sort rồi cắt
    });

    // 3. Tính điểm match và sắp xếp (nhiều skill khớp → đầu tiên)
    const scored = jobs
        .map(job => {
            const jobSkillIds    = job.skills.map(s => s.id);
            const matchCount     = jobSkillIds.filter(id => candidateSkillIds.includes(id)).length;
            const matchPercent   = Math.round((matchCount / candidateSkillIds.length) * 100);
            const matchedSkills  = job.skills
                .filter(s => candidateSkillIds.includes(s.id))
                .map(s => s.name);

            return {
                id:             job.id,
                title:          job.title,
                location:       job.location,
                job_type:       job.job_type,
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
        .slice(0, Number(limit));

    return scored;
};
