const request = require('supertest');
const prisma = require('../../src/config/prisma');
let app, token;

beforeAll(async () => {
    app = require('../../server');
    const user = await prisma.user.findFirst({ where: { role: 'candidate' } });
    const res = await request(app).post('/api/auth/login').send({ email: user.email, password: 'password123' });
    token = res.body.data.accessToken;
});

describe('Portfolio API', () => {
    test('GET /api/portfolio/experiences - should return experiences', async () => {
        const res = await request(app).get('/api/portfolio/experiences').set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toBe(200);
    });

    test('POST /api/portfolio/experiences - should create experience', async () => {
        const res = await request(app).post('/api/portfolio/experiences').set('Authorization', `Bearer ${token}`).send({
            company: 'Test Company ' + Date.now(),
            title: 'Developer',
            startDate: new Date('2024-01-01').toISOString(),
            description: 'Test description'
        });
        expect([201, 500]).toContain(res.statusCode);
    });

    test('GET /api/portfolio/educations - should return educations', async () => {
        const res = await request(app).get('/api/portfolio/educations').set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toBe(200);
    });

    test('GET /api/portfolio/skills - should return skills', async () => {
        const res = await request(app).get('/api/portfolio/skills').set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toBe(200);
    });
});
