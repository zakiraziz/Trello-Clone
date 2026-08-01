const request = require('supertest');
const { app } = require('../app');

// Set test environment
process.env.NODE_ENV = 'test';

describe('Cards API', () => {
  let authToken;
  let boardId;
  let listId;
  let cardId;

  beforeAll(async () => {
    // Create test user and get token
    const userResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'cardtest@example.com',
        password: 'Test123!@#',
        name: 'Card Test User',
      });

    authToken = userResponse.body.token;

    // Create board
    const boardResponse = await request(app)
      .post('/api/boards')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Test Board for Cards' });

    boardId = boardResponse.body.board.id;

    // Create list via /api/lists endpoint (lists route requires board_id in body)
    const listResponse = await request(app)
      .post('/api/lists')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ board_id: boardId, title: 'Test List' });

    listId = listResponse.body.list.id;
  });

  describe('POST /api/cards', () => {
    it('should create a new card', async () => {
      const response = await request(app)
        .post('/api/cards')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          list_id: listId,
          title: 'Test Card',
        });

      expect(response.status).toBe(201);
      expect(response.body.card.title).toBe('Test Card');
      cardId = response.body.card.id;
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/cards')
        .send({
          list_id: listId,
          title: 'Test Card',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/cards/:id', () => {
    it('should update card', async () => {
      const response = await request(app)
        .put(`/api/cards/${cardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Card Title',
          description: 'Updated description',
        });

      expect(response.status).toBe(200);
      expect(response.body.card.title).toBe('Updated Card Title');
    });
  });

  describe('POST /api/cards/:id/comments', () => {
    it('should add comment to card', async () => {
      const response = await request(app)
        .post(`/api/cards/${cardId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ text: 'Test comment' });

      expect(response.status).toBe(201);
      expect(response.body.content).toBe('Test comment');
    });
  });

  describe('DELETE /api/cards/:id', () => {
    it('should delete card', async () => {
      const response = await request(app)
        .delete(`/api/cards/${cardId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });
  });
});