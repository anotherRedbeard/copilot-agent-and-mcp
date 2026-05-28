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
});
