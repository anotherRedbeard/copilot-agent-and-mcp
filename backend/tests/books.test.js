const request = require('supertest');
const express = require('express');
const createApiRouter = require('../routes');
const path = require('path');

const app = express();
app.use(express.json());
app.use('/api', createApiRouter({
  usersFile: path.join(__dirname, '../data/test-users.json'),
  booksFile: path.join(__dirname, '../data/test-books.json'),
  readJSON: (file) => require('fs').existsSync(file) ? JSON.parse(require('fs').readFileSync(file, 'utf-8')) : [],
  writeJSON: (file, data) => require('fs').writeFileSync(file, JSON.stringify(data, null, 2)),
  authenticateToken: (req, res, next) => next(), // No auth for books
  SECRET_KEY: 'test_secret',
}));

describe('Books API', () => {
  it('GET /api/books should return a list of books', async () => {
    const res = await request(app).get('/api/books');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(Array.isArray(res.body[0].categories)).toBe(true);
    expect(res.body[0].categories.length).toBeGreaterThan(0);
  });

  it('GET /api/books?category=fantasy should return only fantasy books', async () => {
    const res = await request(app).get('/api/books?category=fantasy');
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    res.body.forEach((book) => {
      const categories = (book.categories || []).map(value => value.toLowerCase());
      expect(categories).toContain('fantasy');
    });
  });

  it('GET /api/books?category=unknown should return an empty array', async () => {
    const res = await request(app).get('/api/books?category=unknown-category');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('GET /api/books?category=all should return all books', async () => {
    const allRes = await request(app).get('/api/books');
    const allCategoryRes = await request(app).get('/api/books?category=all');

    expect(allCategoryRes.statusCode).toBe(200);
    expect(allCategoryRes.body.length).toBe(allRes.body.length);
  });

  it('sanitizes malformed categories into default categories', async () => {
    const malformedApp = express();
    malformedApp.use(express.json());
    malformedApp.use('/api', createApiRouter({
      usersFile: path.join(__dirname, '../data/test-users.json'),
      booksFile: path.join(__dirname, '../data/test-books.json'),
      readJSON: (file) => {
        if (file.includes('test-books.json')) {
          return [
            { id: 'x1', title: 'Malformed Book', author: 'Nobody', categories: ['', '   ', null] },
          ];
        }

        return require('fs').existsSync(file) ? JSON.parse(require('fs').readFileSync(file, 'utf-8')) : [];
      },
      writeJSON: (file, data) => require('fs').writeFileSync(file, JSON.stringify(data, null, 2)),
      authenticateToken: (req, res, next) => next(),
      SECRET_KEY: 'test_secret',
    }));

    const res = await request(malformedApp).get('/api/books');
    expect(res.statusCode).toBe(200);
    expect(res.body[0].categories).toEqual(['Classic']);
  });

  it('POST /api/books should not be allowed', async () => {
    const res = await request(app)
      .post('/api/books')
      .send({ title: 'Test Book', author: 'Test Author' });
    expect([404, 405]).toContain(res.statusCode);
  });

  it('GET /api/books?sortBy=title&order=asc should return books sorted by title ascending', async () => {
    const res = await request(app).get('/api/books?sortBy=title&order=asc');
    expect(res.statusCode).toBe(200);
    const titles = res.body.map(b => b.title.toLowerCase());
    const sorted = [...titles].sort();
    expect(titles).toEqual(sorted);
  });

  it('GET /api/books?sortBy=title&order=desc should return books sorted by title descending', async () => {
    const res = await request(app).get('/api/books?sortBy=title&order=desc');
    expect(res.statusCode).toBe(200);
    const titles = res.body.map(b => b.title.toLowerCase());
    const sorted = [...titles].sort().reverse();
    expect(titles).toEqual(sorted);
  });

  it('GET /api/books?sortBy=author&order=asc should return books sorted by author ascending', async () => {
    const res = await request(app).get('/api/books?sortBy=author&order=asc');
    expect(res.statusCode).toBe(200);
    const authors = res.body.map(b => b.author.toLowerCase());
    const sorted = [...authors].sort();
    expect(authors).toEqual(sorted);
  });

  it('GET /api/books?sortBy=author&order=desc should return books sorted by author descending', async () => {
    const res = await request(app).get('/api/books?sortBy=author&order=desc');
    expect(res.statusCode).toBe(200);
    const authors = res.body.map(b => b.author.toLowerCase());
    const sorted = [...authors].sort().reverse();
    expect(authors).toEqual(sorted);
  });

  it('GET /api/books with invalid sortBy should return 400', async () => {
    const res = await request(app).get('/api/books?sortBy=invalid');
    expect(res.statusCode).toBe(400);
  });

  it('GET /api/books with invalid order should return 400', async () => {
    const res = await request(app).get('/api/books?sortBy=title&order=sideways');
    expect(res.statusCode).toBe(400);
  });

  // generated-by-copilot: rating endpoint tests
  describe('PATCH /api/books/:id/rating', () => {
    const fs = require('fs');
    const testBooksFile = path.join(__dirname, '../data/test-books.json');

    beforeEach(() => {
      // generated-by-copilot: reset ratings before each rating test
      const books = JSON.parse(fs.readFileSync(testBooksFile, 'utf-8'));
      const reset = books.map(b => { const { rating, ...rest } = b; return rest; });
      fs.writeFileSync(testBooksFile, JSON.stringify(reset, null, 2));
    });

    it('sets a valid rating and returns the updated book', async () => {
      const res = await request(app)
        .patch('/api/books/1/rating')
        .send({ rating: 4 });
      expect(res.statusCode).toBe(200);
      expect(res.body.id).toBe('1');
      expect(res.body.rating).toBe(4);
    });

    it('returns 400 when rating is below 1', async () => {
      const res = await request(app)
        .patch('/api/books/1/rating')
        .send({ rating: 0 });
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/between 1 and 5/);
    });

    it('returns 400 when rating is above 5', async () => {
      const res = await request(app)
        .patch('/api/books/1/rating')
        .send({ rating: 6 });
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/between 1 and 5/);
    });

    it('returns 400 when rating is not an integer', async () => {
      const res = await request(app)
        .patch('/api/books/1/rating')
        .send({ rating: 3.5 });
      expect(res.statusCode).toBe(400);
    });

    it('returns 404 when book does not exist', async () => {
      const res = await request(app)
        .patch('/api/books/9999/rating')
        .send({ rating: 3 });
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toMatch(/not found/i);
    });
  });
});
