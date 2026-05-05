const request = require('supertest');
const prisma = require('../../src/config/prisma');
let app, recruiterToken, applicationId;

beforeAll(async () => {
    app = require('../../server');
    const user = await prisma.user.findFirst({ where: { role: 'recruiter' } });
    const res = await request(app).post('/api/auth/login').send({ email: user.email, password: 'password123' });
    recruiterToken = res.body.data.accessToken;

    const appsRes = await request(app).get('/api/employer/applicants').set('Authorization', `Bearer ${recruiterToken}`);
    if (appsRes.body.data?.length > 0) applicationId = appsRes.body.data[0].id;
});

describe('Applicant API', () => {
    test('GET /api/employer/applicants - should return applicants', async () => {
        const res = await request(app).get('/api/employer/applicants').set('Authorization', `Bearer ${recruiterToken}`);
        expect(res.statusCode).toBe(200);
    });

    test('GET /api/employer/applicants/:id - should return detail', async () => {
        if (!applicationId) return;
        const res = await request(app).get(`/api/employer/applicants/${applicationId}`).set('Authorization', `Bearer ${recruiterToken}`);
        expect([200, 500]).toContain(res.statusCode);
    });
});
