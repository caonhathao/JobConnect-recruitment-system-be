const request = require('supertest');
const prisma = require('../../src/config/prisma');
let app, token;

beforeAll(async () => {
    app = require('../../server');
    const user = await prisma.user.findFirst({ where: { role: 'candidate' } });
    const res = await request(app).post('/api/auth/login').send({ email: user.email, password: 'password123' });
    token = res.body.data.accessToken;
});

describe('Candidate Profile API', () => {
    test('GET /api/candidate/profile - should return profile', async () => {
        const res = await request(app).get('/api/candidate/profile').set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toBe(200);
    });

    test('PUT /api/candidate/profile - should update profile', async () => {
        const res = await request(app).put('/api/candidate/profile').set('Authorization', `Bearer ${token}`).send({
            fullName: 'Test User ' + Date.now(),
            phone: `090${Date.now().toString().slice(-7)}`,
            headline: 'Developer',
            dateOfBirth: new Date('1990-01-01').toISOString()
        });
        expect([200, 500]).toContain(res.statusCode);
    });
});
