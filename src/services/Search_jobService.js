const prisma = require('../config/prisma');

exports.searchJobs = async (filters) => {
    const {
        keyword, location, jobType, jobLevel, salary,
        page = 1, limit = 10
    } = filters;

    const pageSize   = Math.min(50, Math.max(1, parseInt(limit) || 10));
    const pageNumber = Math.max(1, parseInt(page) || 1);
    const skip       = (pageNumber - 1) * pageSize;

    // ─── Build AND array (all conditions combined) ────────────────────────────
    const andConditions = [];

    // 1. Chỉ lấy job đã duyệt
    andConditions.push({ status: 'approved' });

    // 2. Deadline chưa hết hoặc không giới hạn
    andConditions.push({
        OR: [
            { deadline: { gt: new Date() } },
            { deadline: null }
        ]
    });

    // 3. Keyword — tìm theo title, company name, skill name
    if (keyword) {
        const key = keyword.trim();
        andConditions.push({
            OR: [
                { title:   { contains: key, mode: 'insensitive' } },
                { company: { name: { contains: key, mode: 'insensitive' } } },
                {
                    skills: {
                        some: {
                            skill: { name: { contains: key, mode: 'insensitive' } }
                        }
                    }
                }
            ]
        });
    }

    // 4. Location — tìm theo job.location (ưu tiên) hoặc company.city (phụ)
    //    KHÔNG dùng company.address vì đó là địa chỉ đăng ký công ty,
    //    có thể khác với địa điểm thực tế của job
    if (location) {
        const loc = location.trim();
        andConditions.push({
            OR: [
                { location: { contains: loc, mode: 'insensitive' } },
                {
                    AND: [
                        { location: null },          // chỉ fallback khi job không có location riêng
                        { company: { city: { contains: loc, mode: 'insensitive' } } }
                    ]
                }
            ]
        });
    }

    // 5. Job Type (case-insensitive contains để tránh lỗi format không khớp)
    if (jobType) {
        andConditions.push({
            jobType: { contains: jobType.trim(), mode: 'insensitive' }
        });
    }

    // 6. Job Level (case-insensitive contains)
    if (jobLevel) {
        andConditions.push({
            jobLevel: { contains: jobLevel.trim(), mode: 'insensitive' }
        });
    }

    // 7. Salary — lọc job có mức lương phù hợp (salaryMin <= ngưỡng người dùng)
    if (salary) {
        const salaryNum = parseInt(salary);
        andConditions.push({
            OR: [
                { salaryMin: { lte: salaryNum } },
                { salaryMin: null }
            ]
        });
    }

    const where = { AND: andConditions };

    const [count, jobs] = await Promise.all([
        prisma.job.count({ where }),
        prisma.job.findMany({
            where,
            include: {
                company: {
                    select: {
                        id:       true,
                        name:     true,
                        logoUrl:  true,
                        city:     true,
                        address:  true
                    }
                },
                skills: {
                    include: {
                        skill: { select: { id: true, name: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: pageSize,
            skip
        })
    ]);

    const transformedJobs = jobs.map(job => ({
        id:           job.id,
        title:        job.title,
        location:     job.location,
        jobType:      job.jobType,
        jobLevel:     job.jobLevel,
        benefits:     job.benefits,
        description:  job.description,
        requirements: job.requirements,
        skills:       job.skills.map(js => js.skill),
        salaryMin:    job.salaryMin,
        salaryMax:    job.salaryMax,
        deadline:     job.deadline,
        company:      job.company
    }));

    return {
        total_items:  count,
        total_pages:  Math.ceil(count / pageSize),
        current_page: pageNumber,
        jobs:         transformedJobs
    };
};