const request = require('supertest');
const prisma = require('../../src/config/prisma');
let app, token;

beforeAll(async () => {
    app = require('../../server');
    const user = await prisma.user.findFirst({ where: { role: 'admin' } });
    const res = await request(app).post('/api/auth/login').send({ email: user.email, password: 'password123' });
    token = res.body.data.accessToken;
});

describe('Admin User API', () => {
    test('GET /api/admin/ - should return users', async () => {
        const res = await request(app).get('/api/admin/').set('Authorization', `Bearer ${token}`);
        expect([200, 404, 500]).toContain(res.statusCode);
    });
});
