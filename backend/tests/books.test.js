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
    expect(Array.isArray(res.body)).toBe(true);
    const titles = res.body.map(b => b.title.toLowerCase());
    for (let i = 1; i < titles.length; i++) {
      expect(titles[i] >= titles[i - 1]).toBe(true);
    }
  });

  it('GET /api/books?sortBy=title&order=desc should return books sorted by title descending', async () => {
    const res = await request(app).get('/api/books?sortBy=title&order=desc');
    expect(res.statusCode).toBe(200);
    const titles = res.body.map(b => b.title.toLowerCase());
    for (let i = 1; i < titles.length; i++) {
      expect(titles[i] <= titles[i - 1]).toBe(true);
    }
  });

  it('GET /api/books?sortBy=author&order=asc should return books sorted by author ascending', async () => {
    const res = await request(app).get('/api/books?sortBy=author&order=asc');
    expect(res.statusCode).toBe(200);
    const authors = res.body.map(b => b.author.toLowerCase());
    for (let i = 1; i < authors.length; i++) {
      expect(authors[i] >= authors[i - 1]).toBe(true);
    }
  });

  it('GET /api/books?sortBy=author&order=desc should return books sorted by author descending', async () => {
    const res = await request(app).get('/api/books?sortBy=author&order=desc');
    expect(res.statusCode).toBe(200);
    const authors = res.body.map(b => b.author.toLowerCase());
    for (let i = 1; i < authors.length; i++) {
      expect(authors[i] <= authors[i - 1]).toBe(true);
    }
  });

  it('GET /api/books without sortBy should return unsorted books', async () => {
    const res = await request(app).get('/api/books');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });
});
