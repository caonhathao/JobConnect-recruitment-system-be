const request = require('supertest');
const prisma = require('../../src/config/prisma');
let app, token;

beforeAll(async () => {
    app = require('../../server');
    const user = await prisma.user.findFirst({ where: { role: 'admin' } });
    const res = await request(app).post('/api/auth/login').send({ email: user.email, password: 'password123' });
    token = res.body.data.accessToken;
});

describe('Admin Company API', () => {
    test('GET /api/admin/companies - should return companies', async () => {
        const res = await request(app).get('/api/admin/companies').set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toBe(200);
    });
});
