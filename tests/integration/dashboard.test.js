const request = require('supertest');
const prisma = require('../../src/config/prisma');
let app, token;

beforeAll(async () => {
    app = require('../../server');
    const user = await prisma.user.findFirst({ where: { role: 'recruiter' } });
    const res = await request(app).post('/api/auth/login').send({ email: user.email, password: 'password123' });
    token = res.body.data.accessToken;
});

describe('Dashboard API', () => {
    test('GET /api/employer/dashboard - should return dashboard', async () => {
        const res = await request(app).get('/api/employer/dashboard').set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toBe(200);
    });
});
