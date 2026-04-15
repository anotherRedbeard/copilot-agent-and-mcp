const request = require('supertest');
const express = require('express');
const createApiRouter = require('../routes');
const path = require('path');

const fs = require('fs');
const usersFile = path.join(__dirname, '../data/test-users.json');
const booksFile = path.join(__dirname, '../data/test-books.json');
const reviewsFile = path.join(__dirname, '../data/test-reviews.json');

// generated-by-copilot: helper to get a valid JWT for testing reviews API
const jwt = require('jsonwebtoken');
const SECRET_KEY = 'test_secret';
function getToken(username = 'sandra', role = 'member') {
  return jwt.sign({ username, role }, SECRET_KEY, { expiresIn: '1h' });
}

const app = express();
app.use(express.json());
app.use('/api', createApiRouter({
  usersFile,
  booksFile,
  reviewsFile,
  readJSON: (file) => fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf-8')) : [],
  writeJSON: (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2)),
  authenticateToken: (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);
    try {
      req.user = jwt.verify(token, SECRET_KEY);
      next();
    } catch {
      return res.sendStatus(403);
    }
  },
  SECRET_KEY,
}));

// generated-by-copilot: reset reviews data before each test for isolation
beforeEach(() => {
  fs.writeFileSync(reviewsFile, JSON.stringify([], null, 2));
});

describe('Reviews API', () => {
  it('GET /api/books/:id/reviews should return empty array for book with no reviews', async () => {
    const res = await request(app).get('/api/books/1/reviews');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });

  it('GET /api/books/:id/reviews should 404 for non-existent book', async () => {
    const res = await request(app).get('/api/books/99999/reviews');
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toMatch(/not found/i);
  });

  it('GET /api/books/:id/average-rating should return 0 for book with no reviews', async () => {
    const res = await request(app).get('/api/books/1/average-rating');
    expect(res.statusCode).toBe(200);
    expect(res.body.averageRating).toBe(0);
    expect(res.body.totalReviews).toBe(0);
  });

  it('GET /api/books/:id/average-rating should 404 for non-existent book', async () => {
    const res = await request(app).get('/api/books/99999/average-rating');
    expect(res.statusCode).toBe(404);
  });

  it('POST /api/books/:id/reviews should fail without auth', async () => {
    const res = await request(app)
      .post('/api/books/1/reviews')
      .send({ rating: 5, reviewText: 'Great book!' });
    expect(res.statusCode).toBe(401);
  });

  it('POST /api/books/:id/reviews should create a review', async () => {
    const token = getToken('sandra');
    const res = await request(app)
      .post('/api/books/1/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 5, reviewText: 'Amazing read!' });
    expect(res.statusCode).toBe(201);
    expect(res.body.bookId).toBe('1');
    expect(res.body.username).toBe('sandra');
    expect(res.body.rating).toBe(5);
    expect(res.body.reviewText).toBe('Amazing read!');
    expect(res.body.id).toBeDefined();
    expect(res.body.createdAt).toBeDefined();
  });

  it('POST /api/books/:id/reviews should fail with missing rating', async () => {
    const token = getToken('sandra');
    const res = await request(app)
      .post('/api/books/1/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({ reviewText: 'Great book!' });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/rating/i);
  });

  it('POST /api/books/:id/reviews should fail with missing review text', async () => {
    const token = getToken('sandra');
    const res = await request(app)
      .post('/api/books/1/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 4 });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/review text/i);
  });

  it('POST /api/books/:id/reviews should fail with invalid rating (too high)', async () => {
    const token = getToken('sandra');
    const res = await request(app)
      .post('/api/books/1/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 6, reviewText: 'Great!' });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/rating/i);
  });

  it('POST /api/books/:id/reviews should fail with invalid rating (too low)', async () => {
    const token = getToken('sandra');
    const res = await request(app)
      .post('/api/books/1/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 0, reviewText: 'Bad!' });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/rating/i);
  });

  it('POST /api/books/:id/reviews should fail with non-integer rating', async () => {
    const token = getToken('sandra');
    const res = await request(app)
      .post('/api/books/1/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 3.5, reviewText: 'Okay' });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/rating/i);
  });

  it('POST /api/books/:id/reviews should fail for non-existent book', async () => {
    const token = getToken('sandra');
    const res = await request(app)
      .post('/api/books/99999/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 4, reviewText: 'Nice!' });
    expect(res.statusCode).toBe(404);
  });

  it('POST /api/books/:id/reviews should prevent duplicate reviews from same user', async () => {
    const token = getToken('sandra');
    await request(app)
      .post('/api/books/1/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 5, reviewText: 'First review' });
    const res = await request(app)
      .post('/api/books/1/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 3, reviewText: 'Second review' });
    expect(res.statusCode).toBe(409);
    expect(res.body.message).toMatch(/already reviewed/i);
  });

  it('GET /api/books/:id/reviews should return reviews after posting', async () => {
    const token = getToken('sandra');
    await request(app)
      .post('/api/books/1/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 4, reviewText: 'Really enjoyed this!' });
    const res = await request(app).get('/api/books/1/reviews');
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].rating).toBe(4);
    expect(res.body[0].reviewText).toBe('Really enjoyed this!');
  });

  it('GET /api/books/:id/average-rating should return correct average', async () => {
    const token1 = getToken('sandra');
    const token2 = getToken('admin');
    await request(app)
      .post('/api/books/1/reviews')
      .set('Authorization', `Bearer ${token1}`)
      .send({ rating: 4, reviewText: 'Great!' });
    await request(app)
      .post('/api/books/1/reviews')
      .set('Authorization', `Bearer ${token2}`)
      .send({ rating: 2, reviewText: 'Not bad' });
    const res = await request(app).get('/api/books/1/average-rating');
    expect(res.statusCode).toBe(200);
    expect(res.body.averageRating).toBe(3);
    expect(res.body.totalReviews).toBe(2);
  });

  it('POST /api/books/:id/reviews should fail with empty review text', async () => {
    const token = getToken('sandra');
    const res = await request(app)
      .post('/api/books/1/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 3, reviewText: '   ' });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/review text/i);
  });
});
