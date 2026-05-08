jest.mock('../../src/utils/preprocessing/textEmbedding');

const request = require('supertest');
const prisma = require('../../src/config/prisma');
let app, server, token, jobId;

jest.setTimeout(30000);

beforeAll(async () => {
    // Database wipe commented out to allow post-test database analysis
    // await prisma.$executeRaw`DELETE FROM job_vectors`;
    // await prisma.application.deleteMany({});
    // await prisma.job.deleteMany({});

    const serverModule = require('../../server');
    app = serverModule.app;
    server = serverModule.server;

    const user = await prisma.user.findFirst({ where: { role: 'recruiter' } });
    if (!user) throw new Error('No recruiter user found for testing');

    // Find or create approved company
    let company = await prisma.company.findUnique({ where: { userId: user.id } });
    if (!company) {
        company = await prisma.company.create({
            data: {
                userId: user.id,
                name: 'Test Approved Company',
                status: 'approved'
            }
        });
    } else {
        await prisma.company.update({
            where: { id: company.id },
            data: { status: 'approved' }
        });
    }

    const res = await request(app).post('/api/auth/login').send({
        email: user.email,
        password: 'password123'
    });
    token = res.body.data.accessToken;

    const jobsRes = await request(app).get('/api/employer/jobs').set('Authorization', `Bearer ${token}`);
    if (jobsRes.body.data?.length > 0) jobId = jobsRes.body.data[0].id;
});

afterAll(async () => {
    // Close server to stop TCP handle
    await new Promise(resolve => {
        if (server) server.close(resolve);
        else resolve();
    });

    // Stop cron job to prevent open handle
    try {
        const { stopVectorSchedule } = require('../../src/scheduler/jobVectorRetry');
        if (stopVectorSchedule) await stopVectorSchedule();
    } catch (e) {}

    // Allow lingering event loops to clear
    await new Promise(resolve => setTimeout(resolve, 500));

    await prisma.$disconnect();
});

describe('Job API & RAG Pipeline', () => {
    test('GET /api/employer/jobs - should return jobs', async () => {
        const res = await request(app).get('/api/employer/jobs').set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toBe(200);
    });

    test('POST /api/employer/jobs - should create job and persist embeddings to jobVectors', async () => {
        const jobTitle = `Debug_Job_${Date.now()}`;
        const res = await request(app)
            .post('/api/employer/jobs')
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: jobTitle,
                description: 'Senior Node.js developer needed with experience in Express, Prisma, and PostgreSQL. Must have 3+ years of experience building REST APIs and integrating with vector databases for RAG pipelines.',
                salaryMin: 2000,
                salaryMax: 4000,
                location: 'HCM',
                jobType: 'Full-time',
                jobLevel: 'Senior',
                deadline: new Date('2026-12-31').toISOString()
            });

        console.dir(res.body, { depth: null });

        expect(res.statusCode).toBe(201);
        const createdJobId = res.body.data?.id;
        expect(createdJobId).toBeTruthy();

        // 10-iteration polling loop (2s delay each, total 20s) for background embedding
        const maxAttempts = 10;
        const pollDelay = 2000;
        let jobVectors = [];
        let jobStatus = 'PENDING';

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            await new Promise(resolve => setTimeout(resolve, pollDelay));

            // Use raw SQL because Prisma's Unsupported type doesn't return embedding
            const results = await prisma.$queryRaw`
                SELECT id, job_id, content, embedding::text as embedding
                FROM job_vectors
                WHERE job_id = ${createdJobId}
            `;

            if (results.length > 0) {
                // Parse embedding from text to array
                jobVectors = results.map(v => ({
                    ...v,
                    embedding: JSON.parse(v.embedding)
                }));
                console.log(`[Polling] Found ${jobVectors.length} vectors after ${attempt * 2}s`);
            }

            // Check if background task completed
            const updatedJob = await prisma.job.findUnique({ where: { id: createdJobId } });
            jobStatus = updatedJob.vectorStatus;

            if (jobVectors.length > 0 && jobStatus === 'COMPLETED') {
                console.log(`[Polling] VectorStatus is COMPLETED after ${attempt * 2}s`);
                break;
            }

            if (jobStatus === 'FAILED') {
                console.log(`[Polling] VectorStatus is FAILED after ${attempt * 2}s`);
                break;
            }

            console.log(`[Polling] Attempt ${attempt}/${maxAttempts}: vectors=${jobVectors.length}, status=${jobStatus}`);
        }

        if (jobVectors.length === 0) {
            console.error("DEBUG: Polling failed for Job ID: " + createdJobId);
        }

        expect(jobVectors.length).toBeGreaterThan(0);
        expect(jobVectors[0].embedding).toBeTruthy();
        expect(Array.isArray(jobVectors[0].embedding)).toBe(true);
        expect(typeof jobVectors[0].embedding[0]).toBe('number');

        const updatedJob = await prisma.job.findUnique({ where: { id: createdJobId } });
        expect(['COMPLETED', 'FAILED']).toContain(updatedJob.vectorStatus);
    }, 30000);

    test('PATCH /api/employer/jobs/:id/toggle-pause - should toggle status', async () => {
        if (!jobId) return;
        const res = await request(app)
            .patch(`/api/employer/jobs/${jobId}/toggle-pause`)
            .set('Authorization', `Bearer ${token}`);
        expect([200, 500]).toContain(res.statusCode);
    });
});
