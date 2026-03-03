const { Company, Job, Skill, Job_skill, sequelize } = require('../models');

// ==============================================================================
// PRIVATE HELPERS
// ==============================================================================
/**
 * Lấy company của recruiter, throw nếu chưa có hoặc chưa được duyệt
 */
const _getApprovedCompany = async (userId) => {
    const company = await Company.findOne({ where: { user_id: userId } });
    if (!company) throw new Error('Bạn chưa có hồ sơ công ty.');
    if (company.status !== 'approved') throw new Error('Hồ sơ công ty chưa được Admin duyệt. Bạn chưa thể đăng tin.');
    return company;
};

/**
 * Kiểm tra job thuộc về công ty của recruiter
 */
const _getOwnJob = async (userId, jobId) => {
    const company = await Company.findOne({ where: { user_id: userId } });
    if (!company) throw new Error('Bạn chưa có hồ sơ công ty.');

    const job = await Job.findOne({
        where: { id: jobId, company_id: company.id },
        include: [{ model: Skill, as: 'skills', through: { attributes: [] } }]
    });
    if (!job) throw new Error('Không tìm thấy tin đăng hoặc bạn không có quyền thao tác.');
    return job;
};

// ==============================================================================
// 1. TẠO TIN TUYỂN DỤNG MỚI
// ==============================================================================
/**
 * @param {string} userId
 * @param {{ title, description, requirements, benefits, salary_min, salary_max,
 *           location, job_type, job_level, deadline, skills: string[] }} data
 */
exports.createJob = async (userId, data) => {
    const company = await _getApprovedCompany(userId);

    const {
        title, description, requirements, benefits,
        salary_min, salary_max, location,
        job_type, job_level, deadline, skills = []
    } = data;

    if (!title?.trim()) throw new Error('Tiêu đề công việc không được để trống.');

    const t = await sequelize.transaction();
    try {
        const job = await Job.create({
            company_id:  company.id,
            title:       title.trim(),
            description: description?.trim() || null,
            requirements: requirements?.trim() || null,
            benefits:    benefits?.trim() || null,
            salary_min:  salary_min || null,
            salary_max:  salary_max || null,
            location:    location?.trim() || null,
            job_type:    job_type?.trim() || null,
            job_level:   job_level?.trim() || null,
            deadline:    deadline || null,
            status:      'pending'  // Chờ Admin duyệt
        }, { transaction: t });

        // Gắn kỹ năng yêu cầu (nếu có)
        if (skills.length > 0) {
            const { Skill: SkillModel } = require('../models');
            const skillIds = [];
            for (const name of skills) {
                const [skill] = await SkillModel.findOrCreate({
                    where: { name: name.trim() },
                    defaults: { name: name.trim() },
                    transaction: t
                });
                skillIds.push(skill.id);
            }
            await job.setSkills(skillIds, { transaction: t });
        }

        await t.commit();
        return job;
    } catch (err) {
        await t.rollback();
        throw err;
    }
};

// ==============================================================================
// 2. DANH SÁCH TIN ĐĂNG CỦA CÔNG TY (lọc theo status)
// ==============================================================================
/**
 * @param {string} userId
 * @param {{ status?: string }} filters - lọc theo: pending | approved | rejected | paused
 */
exports.getMyJobs = async (userId, filters = {}) => {
    const company = await Company.findOne({ where: { user_id: userId } });
    if (!company) throw new Error('Bạn chưa có hồ sơ công ty.');

    const where = { company_id: company.id };
    if (filters.status) where.status = filters.status;

    return await Job.findAll({
        where,
        include: [{ model: Skill, as: 'skills', through: { attributes: [] }, attributes: ['id', 'name'] }],
        order: [['createdAt', 'DESC']]
    });
};

// ==============================================================================
// 3. XEM CHI TIẾT MỘT TIN ĐĂNG
// ==============================================================================
exports.getJobDetail = async (userId, jobId) => {
    return await _getOwnJob(userId, jobId);
};

// ==============================================================================
// 4. CẬP NHẬT TIN ĐĂNG
// ==============================================================================
exports.updateJob = async (userId, jobId, data) => {
    const job = await _getOwnJob(userId, jobId);

    // Không cho sửa tin đã bị rejected (phải tạo mới)
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

    const t = await sequelize.transaction();
    try {
        const updateData = {};
        if (title        !== undefined) updateData.title        = title.trim();
        if (description  !== undefined) updateData.description  = description?.trim() || null;
        if (requirements !== undefined) updateData.requirements = requirements?.trim() || null;
        if (benefits     !== undefined) updateData.benefits     = benefits?.trim() || null;
        if (salary_min   !== undefined) updateData.salary_min   = salary_min;
        if (salary_max   !== undefined) updateData.salary_max   = salary_max;
        if (location     !== undefined) updateData.location     = location?.trim() || null;
        if (job_type     !== undefined) updateData.job_type     = job_type?.trim() || null;
        if (job_level    !== undefined) updateData.job_level    = job_level?.trim() || null;
        if (deadline     !== undefined) updateData.deadline     = deadline;

        // Sau khi sửa → về pending chờ duyệt lại (trừ khi đang paused)
        if (Object.keys(updateData).length > 0 && job.status !== 'paused') {
            updateData.status           = 'pending';
            updateData.rejection_reason = null;
        }

        await job.update(updateData, { transaction: t });

        // Cập nhật skills nếu được gửi lên
        if (Array.isArray(skills)) {
            const { Skill: SkillModel } = require('../models');
            const skillIds = [];
            for (const name of skills) {
                const [skill] = await SkillModel.findOrCreate({
                    where: { name: name.trim() },
                    defaults: { name: name.trim() },
                    transaction: t
                });
                skillIds.push(skill.id);
            }
            await job.setSkills(skillIds, { transaction: t });
        }

        await t.commit();
        return await _getOwnJob(userId, jobId);
    } catch (err) {
        await t.rollback();
        throw err;
    }
};

// ==============================================================================
// 5. TẠM DỪNG / MỞ LẠI TIN ĐĂNG
// ==============================================================================
exports.togglePauseJob = async (userId, jobId) => {
    const job = await _getOwnJob(userId, jobId);

    if (job.status === 'pending') {
        throw new Error('Tin đang chờ duyệt. Không thể tạm dừng lúc này.');
    }
    if (job.status === 'rejected') {
        throw new Error('Tin đã bị từ chối. Không thể tạm dừng.');
    }

    if (job.status === 'paused') {
        // Mở lại → về approved (đã được duyệt trước đó)
        await job.update({ status: 'approved' });
        return { status: 'approved', message: 'Đã mở lại tin tuyển dụng.' };
    } else {
        // Đang approved → tạm dừng
        await job.update({ status: 'paused' });
        return { status: 'paused', message: 'Đã tạm dừng tin tuyển dụng.' };
    }
};

// ==============================================================================
// 6. XÓA TIN ĐĂNG
// ==============================================================================
exports.deleteJob = async (userId, jobId) => {
    const job = await _getOwnJob(userId, jobId);
    await job.destroy();
    return true;
};
