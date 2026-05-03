const prisma = require('../config/prisma');

exports.searchJobs = async (filters) => {
    const {
        keyword, location, job_type, job_level, salary,
        page = 1, limit = 10
    } = filters;

    const pageSize = parseInt(limit);
    const pageNumber = parseInt(page);
    const skip = (pageNumber - 1) * pageSize;

    const where = {
        status: 'approved'
    };

    if (keyword) {
        const escapedKey = keyword.trim();
        where.OR = [
            { title: { contains: escapedKey, mode: 'insensitive' } },
            { company: { name: { contains: escapedKey, mode: 'insensitive' } } },
            {
                skills: {
                    some: {
                        skill: {
                            name: { contains: escapedKey, mode: 'insensitive' }
                        }
                    }
                }
            }
        ];
    }

    if (location) {
        const escapedLoc = location.trim();
        where.OR = [
            { location: { contains: escapedLoc, mode: 'insensitive' } },
            { company: { city: { contains: escapedLoc, mode: 'insensitive' } } },
            { company: { address: { contains: escapedLoc, mode: 'insensitive' } } }
        ];
    }

    if (job_type) where.jobType = job_type;
    if (job_level) where.jobLevel = job_level;
    if (salary) where.salaryMax = { gte: parseInt(salary) };

    const [count, jobs] = await Promise.all([
        prisma.job.count({ where }),
        prisma.job.findMany({
            where,
            include: {
                company: {
                    select: {
                        id: true,
                        name: true,
                        logoUrl: true,
                        city: true,
                        address: true
                    }
                },
                skills: {
                    include: {
                        skill: {
                            select: { id: true, name: true }
                        }
                    }
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
