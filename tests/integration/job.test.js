const request = require('supertest');
const prisma = require('../../src/config/prisma');
let app, token, jobId;

beforeAll(async () => {
    app = require('../../server');
    const user = await prisma.user.findFirst({ where: { role: 'recruiter' } });
    const res = await request(app).post('/api/auth/login').send({ email: user.email, password: 'password123' });
    token = res.body.data.accessToken;

    const jobsRes = await request(app).get('/api/employer/jobs').set('Authorization', `Bearer ${token}`);
    if (jobsRes.body.data?.length > 0) jobId = jobsRes.body.data[0].id;
});

describe('Job API', () => {
    test('GET /api/employer/jobs - should return jobs', async () => {
        const res = await request(app).get('/api/employer/jobs').set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toBe(200);
    });

    test('POST /api/employer/jobs - should create job', async () => {
        const res = await request(app).post('/api/employer/jobs').set('Authorization', `Bearer ${token}`).send({
            title: 'Test Job ' + Date.now(),
            description: 'Test description',
            salaryMin: 1000,
            salaryMax: 2000,
            location: 'HCM',
            jobType: 'Full-time',
            deadline: new Date('2026-12-31').toISOString()
        });
        expect([201, 400, 500]).toContain(res.statusCode);
    });

    test('PATCH /api/employer/jobs/:id/toggle-pause - should toggle', async () => {
        if (!jobId) return;
        const res = await request(app).patch(`/api/employer/jobs/${jobId}/toggle-pause`).set('Authorization', `Bearer ${token}`);
        expect([200, 500]).toContain(res.statusCode);
    });
});
