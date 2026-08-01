const request = require('supertest');
const { app } = require('../app');

// Set test environment
process.env.NODE_ENV = 'test';

describe('Auth Routes', () => {
    describe('POST /api/auth/register', () => {
        test('should register a new user successfully', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({ email: 'authtest@test.com', password: 'password123', name: 'Auth Test User' });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('token');
            expect(response.body).toHaveProperty('user');
            expect(response.body.message).toBe('Registration successful!');
        });

        test('should reject duplicate email registration', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({ email: 'authtest@test.com', password: 'password123', name: 'Auth Test User' });

            expect(response.status).toBe(409);
            expect(response.body.error).toBe('Registration failed');
        });

        test('should reject registration with invalid email', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({ email: 'invalid', password: 'password123', name: 'Test User' });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Validation failed');
        });

        test('should reject registration with short password', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({ email: 'shortpw@test.com', password: '123', name: 'Test User' });

            expect(response.status).toBe(400);
        });

        test('should reject registration without name', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({ email: 'noname@test.com', password: 'password123' });

            expect(response.status).toBe(400);
        });
    });

    describe('POST /api/auth/login', () => {
        test('should login successfully with valid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ email: 'authtest@test.com', password: 'password123' });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('token');
            expect(response.body.message).toBe('Login successful!');
        });

        test('should reject login with wrong email', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ email: 'wrong@test.com', password: 'password123' });

            expect(response.status).toBe(401);
            expect(response.body.error).toBe('Login failed');
        });

        test('should reject login without email', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ password: 'password123' });

            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/auth/me', () => {
        test('should return user profile with valid token', async () => {
            // Login first to get token
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({ email: 'authtest@test.com', password: 'password123' });

            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${loginResponse.body.token}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('plan');
            expect(response.body).toHaveProperty('email');
        });

        test('should reject without authorization header', async () => {
            const response = await request(app).get('/api/auth/me');
            expect(response.status).toBe(401);
        });
    });
});

describe('Health Check', () => {
    test('GET /api/health should return ok', async () => {
        const response = await request(app).get('/api/health');
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('ok');
    });
});