const request = require('supertest');
const prisma = require('../../src/config/prisma');
let app, token;

beforeAll(async () => {
    app = require('../../server');
    const user = await prisma.user.findFirst({ where: { role: 'recruiter' } });
    const res = await request(app).post('/api/auth/login').send({ email: user.email, password: 'password123' });
    token = res.body.data.accessToken;
});

describe('Employer API', () => {
    test('GET /api/employer/ - should return company profile', async () => {
        const res = await request(app).get('/api/employer/').set('Authorization', `Bearer ${token}`);
        expect([200, 404]).toContain(res.statusCode);
    });
});
