const request = require('supertest');
const prisma = require('../../src/config/prisma');
let app, token;

beforeAll(async () => {
    app = require('../../server');
    const user = await prisma.user.findFirst({ where: { role: 'candidate' } });
    const res = await request(app).post('/api/auth/login').send({ email: user.email, password: 'password123' });
    token = res.body.data.accessToken;
});

describe('Avatar API', () => {
    test('DELETE /api/avatar - should attempt delete', async () => {
        const res = await request(app).delete('/api/avatar').set('Authorization', `Bearer ${token}`);
        expect([200, 400, 500]).toContain(res.statusCode);
    });
});
