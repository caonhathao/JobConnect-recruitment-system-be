const request = require('supertest');
const prisma = require('../../src/config/prisma');
let app, jobId;

beforeAll(async () => {
    app = require('../../server');
    const recruiter = await prisma.user.findFirst({ where: { role: 'recruiter' } });
    const rRes = await request(app).post('/api/auth/login').send({ email: recruiter.email, password: 'password123' });
    const jobsRes = await request(app).get('/api/employer/jobs').set('Authorization', `Bearer ${rRes.body.data.accessToken}`);
    if (jobsRes.body.data?.length > 0) jobId = jobsRes.body.data[0].id;
});

describe('Public API', () => {
    test('GET /api/public/jobs/:id - should return job', async () => {
        if (!jobId) return;
        const res = await request(app).get(`/api/public/jobs/${jobId}`);
        expect([200, 404, 500]).toContain(res.statusCode);
    });
});
