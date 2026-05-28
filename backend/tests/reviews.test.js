const request = require('supertest');
const express = require('express');
const fs = require('fs');
const path = require('path');
const createApiRouter = require('../routes');

const jwt = require('jsonwebtoken');
const SECRET_KEY = 'test_secret';
function getToken(username = 'sandra') {
  return jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
}
function authHeader(token) {
  return 'Bearer ' + token;
}

const usersFile = path.join(__dirname, '../data/test-users.json');
const booksFile = path.join(__dirname, '../data/test-books.json');
const reviewsFile = path.join(__dirname, '../data/test-reviews.json');

const app = express();
app.use(express.json());
app.use('/api', createApiRouter({
  usersFile,
  booksFile,
  reviewsFile,
  readJSON: (file) => fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf-8')) : [],
  writeJSON: (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2)),
  authenticateToken: (req, res, next) => {
    const header = req.headers['authorization'];
    const token = header && header.split(' ')[1];
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

describe('Reviews API', () => {
  beforeEach(() => {
    // Start each test from an empty reviews store for isolation
    fs.writeFileSync(reviewsFile, '[]');
  });

  describe('POST /api/books/:bookId/reviews', () => {
    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/books/1/reviews')
        .send({ rating: 5, text: 'Great' });
      expect(res.statusCode).toBe(401);
    });

    it('should reject when rating is missing', async () => {
      const token = getToken('sandra');
      const res = await request(app)
        .post('/api/books/1/reviews')
        .set('Authorization', authHeader(token))
        .send({ text: 'No rating' });
      expect(res.statusCode).toBe(400);
    });

    it('should reject when rating is out of range', async () => {
      const token = getToken('sandra');
      const res = await request(app)
        .post('/api/books/1/reviews')
        .set('Authorization', authHeader(token))
        .send({ rating: 6, text: 'Too high' });
      expect(res.statusCode).toBe(400);
    });

    it('should reject when rating is not an integer', async () => {
      const token = getToken('sandra');
      const res = await request(app)
        .post('/api/books/1/reviews')
        .set('Authorization', authHeader(token))
        .send({ rating: 3.5, text: 'Half star' });
      expect(res.statusCode).toBe(400);
    });

    it('should reject when text is missing or empty', async () => {
      const token = getToken('sandra');
      const res = await request(app)
        .post('/api/books/1/reviews')
        .set('Authorization', authHeader(token))
        .send({ rating: 4, text: '   ' });
      expect(res.statusCode).toBe(400);
    });

    it('should reject when text is too long', async () => {
      const token = getToken('sandra');
      const res = await request(app)
        .post('/api/books/1/reviews')
        .set('Authorization', authHeader(token))
        .send({ rating: 4, text: 'a'.repeat(2001) });
      expect(res.statusCode).toBe(400);
    });

    it('should return 404 for unknown book', async () => {
      const token = getToken('sandra');
      const res = await request(app)
        .post('/api/books/does-not-exist/reviews')
        .set('Authorization', authHeader(token))
        .send({ rating: 4, text: 'Nice' });
      expect(res.statusCode).toBe(404);
    });

    it('should create a review for a valid book', async () => {
      const token = getToken('sandra');
      const res = await request(app)
        .post('/api/books/1/reviews')
        .set('Authorization', authHeader(token))
        .send({ rating: 5, text: 'Loved it!' });
      expect(res.statusCode).toBe(201);
      expect(res.body).toMatchObject({
        bookId: '1',
        username: 'sandra',
        rating: 5,
        text: 'Loved it!',
      });
      expect(res.body.id).toEqual(expect.any(String));
      expect(res.body.createdAt).toEqual(expect.any(String));
    });
  });

  describe('GET /api/books/:bookId/reviews', () => {
    it('should return 404 for unknown book', async () => {
      const res = await request(app).get('/api/books/does-not-exist/reviews');
      expect(res.statusCode).toBe(404);
    });

    it('should return an empty list for a book with no reviews', async () => {
      const res = await request(app).get('/api/books/1/reviews');
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('should return reviews for a book, newest first', async () => {
      const token = getToken('sandra');
      await request(app)
        .post('/api/books/1/reviews')
        .set('Authorization', authHeader(token))
        .send({ rating: 3, text: 'first' });
      // small delay to ensure distinct createdAt timestamps
      await new Promise(r => setTimeout(r, 5));
      await request(app)
        .post('/api/books/1/reviews')
        .set('Authorization', authHeader(token))
        .send({ rating: 5, text: 'second' });

      const res = await request(app).get('/api/books/1/reviews');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].text).toBe('second');
      expect(res.body[1].text).toBe('first');
    });

    it('should not include reviews for other books', async () => {
      const token = getToken('sandra');
      await request(app)
        .post('/api/books/1/reviews')
        .set('Authorization', authHeader(token))
        .send({ rating: 4, text: 'for one' });
      await request(app)
        .post('/api/books/2/reviews')
        .set('Authorization', authHeader(token))
        .send({ rating: 2, text: 'for two' });

      const res = await request(app).get('/api/books/1/reviews');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].text).toBe('for one');
    });
  });

  describe('GET /api/books/:bookId/average-rating', () => {
    it('should return 404 for unknown book', async () => {
      const res = await request(app).get('/api/books/does-not-exist/average-rating');
      expect(res.statusCode).toBe(404);
    });

    it('should return 0 / 0 for a book with no reviews', async () => {
      const res = await request(app).get('/api/books/1/average-rating');
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ bookId: '1', averageRating: 0, count: 0 });
    });

    it('should compute the average rating across all reviews for the book', async () => {
      const token = getToken('sandra');
      for (const rating of [5, 4, 3]) {
        await request(app)
          .post('/api/books/1/reviews')
          .set('Authorization', authHeader(token))
          .send({ rating, text: 'r' + rating });
      }
      const res = await request(app).get('/api/books/1/average-rating');
      expect(res.statusCode).toBe(200);
      expect(res.body.count).toBe(3);
      expect(res.body.averageRating).toBe(4);
      expect(res.body.bookId).toBe('1');
    });
  });
});
