const express = require('express');

function createBooksRouter({ booksFile, readJSON, writeJSON, authenticateToken }) {
  const router = express.Router();

  router.get('/', (req, res) => {
    const books = readJSON(booksFile);
    const { sortBy, order } = req.query;
    if (sortBy === 'title' || sortBy === 'author') {
      const dir = order === 'desc' ? -1 : 1;
      books.sort((a, b) => {
        const valA = (a[sortBy] || '').toLowerCase();
        const valB = (b[sortBy] || '').toLowerCase();
        if (valA < valB) return -1 * dir;
        if (valA > valB) return 1 * dir;
        return 0;
      });
    }
    res.json(books);
  });

  // POST /books removed: adding books is not allowed

  return router;
}

module.exports = createBooksRouter;
