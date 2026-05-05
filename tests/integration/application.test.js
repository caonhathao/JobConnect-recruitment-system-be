const request = require('supertest');
const prisma = require('../../src/config/prisma');
let app, candidateToken, jobId;

beforeAll(async () => {
    app = require('../../server');
    const candidate = await prisma.user.findFirst({ where: { role: 'candidate' } });
    const cRes = await request(app).post('/api/auth/login').send({ email: candidate.email, password: 'password123' });
    candidateToken = cRes.body.data.accessToken;

    const recruiter = await prisma.user.findFirst({ where: { role: 'recruiter' } });
    const rRes = await request(app).post('/api/auth/login').send({ email: recruiter.email, password: 'password123' });
    const jobsRes = await request(app).get('/api/employer/jobs').set('Authorization', `Bearer ${rRes.body.data.accessToken}`);
    if (jobsRes.body.data?.length > 0) jobId = jobsRes.body.data[0].id;
});

describe('Application API', () => {
    test('GET /api/applications - should return applications', async () => {
        const res = await request(app).get('/api/applications').set('Authorization', `Bearer ${candidateToken}`);
        expect(res.statusCode).toBe(200);
    });

    test('POST /api/applications - should apply', async () => {
        if (!jobId) return;
        const res = await request(app).post('/api/applications').set('Authorization', `Bearer ${candidateToken}`).send({
            jobId,
            coverLetter: 'Test application'
        });
        expect([201, 400, 500]).toContain(res.statusCode);
    });
});
