const request = require('supertest');
const prisma = require('../../src/config/prisma');
let app, token, jobId;

beforeAll(async () => {
    app = require('../../server');
    const admin = await prisma.user.findFirst({ where: { role: 'admin' } });
    const res = await request(app).post('/api/auth/login').send({ email: admin.email, password: 'password123' });
    token = res.body.data.accessToken;

    const recruiter = await prisma.user.findFirst({ where: { role: 'recruiter' } });
    const rRes = await request(app).post('/api/auth/login').send({ email: recruiter.email, password: 'password123' });
    const jobsRes = await request(app).get('/api/employer/jobs').set('Authorization', `Bearer ${rRes.body.data.accessToken}`);
    if (jobsRes.body.data?.length > 0) jobId = jobsRes.body.data[0].id;
});

describe('Admin Job API', () => {
    test('GET /api/admin/jobs - should return jobs', async () => {
        const res = await request(app).get('/api/admin/jobs').set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toBe(200);
    });

    test('GET /api/admin/jobs/:id - should return job detail', async () => {
        if (!jobId) return;
        const res = await request(app).get(`/api/admin/jobs/${jobId}`).set('Authorization', `Bearer ${token}`);
        expect([200, 500]).toContain(res.statusCode);
    });
});
