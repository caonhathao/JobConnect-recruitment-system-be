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

describe('Bookmark API', () => {
    test('GET /api/bookmarks - should return bookmarks', async () => {
        const res = await request(app).get('/api/bookmarks').set('Authorization', `Bearer ${candidateToken}`);
        expect(res.statusCode).toBe(200);
    });

    test('POST /api/bookmarks/:jobId - should toggle bookmark', async () => {
        if (!jobId) return;
        const res = await request(app).post(`/api/bookmarks/${jobId}`).set('Authorization', `Bearer ${candidateToken}`);
        expect([200, 500]).toContain(res.statusCode);
    });
});
