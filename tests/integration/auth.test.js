const request = require('supertest');
const prisma = require('../../src/config/prisma');
let app;

beforeAll(async () => {
    app = require('../../server');
});

describe('Auth API', () => {
    test('POST /api/auth/login - should login with valid credentials', async () => {
        const user = await prisma.user.findFirst({ where: { role: 'candidate' } });
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: user.email, password: 'password123' });
        
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('data.accessToken');
    });

    test('POST /api/auth/register - should register new user', async () => {
        const uniqueEmail = `test${Date.now()}@gmail.com`;
        const uniquePhone = `090${Date.now().toString().slice(-7)}`;
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                fullName: 'Test User',
                email: uniqueEmail,
                phone: uniquePhone,
                password: 'password123'
            });
        
        expect([200, 201]).toContain(res.statusCode);
    });
});
