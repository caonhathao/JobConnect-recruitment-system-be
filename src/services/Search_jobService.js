const { Job, Company, Skill, Job_skill, sequelize } = require('../models');
const { Op } = require('sequelize');

exports.searchJobs = async (filters) => {
    const { 
        keyword, location, job_type, job_level, salary,
        page = 1, limit = 10 
    } = filters;

    const pageSize = parseInt(limit);
    const pageNumber = parseInt(page);
    const offset = (pageNumber - 1) * pageSize;

    const conditions = [{ 
        status: 'approved' 
    }];

    // Keyword: tìm trong title, company.name, skill.name
    if (keyword) {
        const escapedKey = keyword.trim().replace(/[%_\\]/g, '\\$&');
        conditions.push({
            [Op.or]: [
                { title: { [Op.substring]: escapedKey } },
                { '$company.name$': { [Op.substring]: escapedKey } },
                {
                    id: {
                        [Op.in]: sequelize.literal(`(
                            SELECT js.job_id 
                            FROM job_skills js
                            INNER JOIN skills s ON js.skill_id = s.id
                            WHERE s.name LIKE '%${escapedKey}%'
                        )`)
                    }
                }
            ]
        });
    }

    // Location: tìm trong job.location, company.city, company.address
    if (location) {
        const escapedLoc = location.trim().replace(/[%_\\]/g, '\\$&');
        conditions.push({
            [Op.or]: [
                { location: { [Op.substring]: escapedLoc } },
                { '$company.city$': { [Op.substring]: escapedLoc } },
                { '$company.address$': { [Op.substring]: escapedLoc } }
            ]
        });
    }

    if (job_type)  conditions.push({ job_type });
    if (job_level) conditions.push({ job_level });
    if (salary)    conditions.push({ salary_max: { [Op.gte]: parseInt(salary) } });

    const { count, rows } = await Job.findAndCountAll({
        where: { [Op.and]: conditions },
        include: [
            {
                model: Company,
                as: 'company',
                attributes: ['id', 'name', 'logo_url', 'city', 'address']
            },
            {
                model: Skill,
                as: 'skills',
                attributes: ['id', 'name'],
                through: { attributes: [] }
            }
        ],
        order: [['createdAt', 'DESC']],
        limit: pageSize,
        offset,
        distinct: true,
        subQuery: false
    });

    return {
        total_items: count,
        total_pages: Math.ceil(count / pageSize),
        current_page: pageNumber,
        jobs: rows
    };
};