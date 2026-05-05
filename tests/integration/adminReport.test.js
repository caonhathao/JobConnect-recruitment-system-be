const request = require('supertest');
const prisma = require('../../src/config/prisma');
let app, token;

beforeAll(async () => {
    app = require('../../server');
    const admin = await prisma.user.findFirst({ where: { role: 'admin' } });
    const res = await request(app).post('/api/auth/login').send({ email: admin.email, password: 'password123' });
    token = res.body.data.accessToken;
});

describe('Admin Report API', () => {
    test('GET /api/admin/reports/overview - should return stats', async () => {
        const res = await request(app).get('/api/admin/reports/overview').set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toBe(200);
    });

    test('GET /api/admin/reports/users/growth - should return growth', async () => {
        const res = await request(app).get('/api/admin/reports/users/growth').set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toBe(200);
    });
});
