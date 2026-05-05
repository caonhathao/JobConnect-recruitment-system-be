const request = require('supertest');
const prisma = require('../../src/config/prisma');
let app, token;

beforeAll(async () => {
    app = require('../../server');
    const user = await prisma.user.findFirst({ where: { role: 'candidate' } });
    const res = await request(app).post('/api/auth/login').send({ email: user.email, password: 'password123' });
    token = res.body.data.accessToken;
});

describe('Resume API', () => {
    test('GET /api/resumes - should return resumes', async () => {
        const res = await request(app).get('/api/resumes').set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toBe(200);
    });
});
