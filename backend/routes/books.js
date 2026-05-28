const express = require('express');

function createBooksRouter({ booksFile, readJSON, writeJSON, authenticateToken }) {
  const router = express.Router();

  const ALLOWED_SORT_FIELDS = ['title', 'author'];
  const ALLOWED_ORDERS = ['asc', 'desc'];

  router.get('/', (req, res) => {
    const books = readJSON(booksFile);
    const { sortBy, order } = req.query;

    if (sortBy === undefined && order === undefined) {
      return res.json(books);
    }

    const sortField = sortBy === undefined ? 'title' : sortBy;
    const sortOrder = order === undefined ? 'asc' : order;

    if (!ALLOWED_SORT_FIELDS.includes(sortField)) {
      return res.status(400).json({ error: `Invalid sortBy. Allowed values: ${ALLOWED_SORT_FIELDS.join(', ')}` });
    }
    if (!ALLOWED_ORDERS.includes(sortOrder)) {
      return res.status(400).json({ error: `Invalid order. Allowed values: ${ALLOWED_ORDERS.join(', ')}` });
    }

    const sorted = [...books].sort((a, b) => {
      const av = (a[sortField] || '').toString().toLowerCase();
      const bv = (b[sortField] || '').toString().toLowerCase();
      if (av < bv) return sortOrder === 'asc' ? -1 : 1;
      if (av > bv) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    res.json(sorted);
  });

  // POST /books removed: adding books is not allowed

  return router;
}

module.exports = createBooksRouter;
