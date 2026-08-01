const request = require('supertest');
const { app } = require('../app');

// Set test environment
process.env.NODE_ENV = 'test';

describe('Boards API', () => {
  let authToken;
  let userId;
  let boardId;

  beforeAll(async () => {
    // Create test user and get token
    const userResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'boardtest@example.com',
        password: 'Test123!@#',
        name: 'Board Test User',
      });

    authToken = userResponse.body.token;
    userId = userResponse.body.user.id;
  });

  describe('POST /api/boards', () => {
    it('should create a new board', async () => {
      const response = await request(app)
        .post('/api/boards')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Board',
          description: 'Test Description',
        });

      expect(response.status).toBe(201);
      expect(response.body.board.name).toBe('Test Board');
      expect(response.body.board.description).toBe('Test Description');
      boardId = response.body.board.id;
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/boards')
        .send({
          name: 'Test Board',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/boards', () => {
    it('should get all boards for user', async () => {
      const response = await request(app)
        .get('/api/boards')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/boards/:id', () => {
    it('should get board by id', async () => {
      const response = await request(app)
        .get(`/api/boards/${boardId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(boardId);
    });

    it('should return 403 for non-existent board', async () => {
      const response = await request(app)
        .get('/api/boards/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('PUT /api/boards/:id', () => {
    it('should update board', async () => {
      const response = await request(app)
        .put(`/api/boards/${boardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Board Name',
        });

      expect(response.status).toBe(200);
      expect(response.body.board.name).toBe('Updated Board Name');
    });
  });

  describe('DELETE /api/boards/:id', () => {
    it('should delete board', async () => {
      const response = await request(app)
        .delete(`/api/boards/${boardId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);

      // Verify deletion
      const getResponse = await request(app)
        .get(`/api/boards/${boardId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.status).toBe(403);
    });
  });
});