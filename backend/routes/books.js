const express = require('express');

function createBooksRouter({ booksFile, readJSON, writeJSON, authenticateToken }) {
  const router = express.Router();

  const DEFAULT_CATEGORY = 'Classic';
  const ALLOWED_SORT_FIELDS = ['title', 'author'];
  const ALLOWED_ORDERS = ['asc', 'desc'];

  const inferCategories = (book) => {
    const normalizedTitle = (book?.title || '').toString().toLowerCase();

    if (normalizedTitle.includes('hobbit') || normalizedTitle.includes('lord of the rings')) {
      return ['Fantasy', 'Adventure'];
    }
    if (normalizedTitle.includes('1984') || normalizedTitle.includes('brave new world') || normalizedTitle.includes('fahrenheit 451')) {
      return ['Dystopian', 'Science Fiction'];
    }
    if (
      normalizedTitle.includes('pride and prejudice')
      || normalizedTitle.includes('sense and sensibility')
      || normalizedTitle.includes('emma')
      || normalizedTitle.includes('persuasion')
    ) {
      return ['Classic', 'Romance'];
    }
    if (normalizedTitle.includes('moby-dick') || normalizedTitle.includes('odyssey') || normalizedTitle.includes('iliad')) {
      return ['Classic', 'Adventure'];
    }

    return [DEFAULT_CATEGORY];
  };

  const normalizeCategories = (book) => {
    const rawCategories = Array.isArray(book?.categories)
      ? book.categories
      : (typeof book?.category === 'string' ? [book.category] : inferCategories(book));

    const uniqueByNormalizedValue = new Map();
    for (const value of rawCategories) {
      if (typeof value !== 'string') continue;
      const trimmed = value.trim();
      if (!trimmed) continue;
      const normalizedKey = trimmed.toLowerCase();
      if (!uniqueByNormalizedValue.has(normalizedKey)) {
        uniqueByNormalizedValue.set(normalizedKey, trimmed);
      }
    }

    if (uniqueByNormalizedValue.size === 0) {
      return [DEFAULT_CATEGORY];
    }

    return Array.from(uniqueByNormalizedValue.values());
  };

  const normalizeBooks = (books) => books.map(book => ({
    ...book,
    categories: normalizeCategories(book),
  }));

  const parseCategoryQuery = (value) => {
    if (value === undefined) return [];

    const values = Array.isArray(value)
      ? value.flatMap(entry => entry.split(','))
      : value.split(',');

    return Array.from(
      new Set(
        values
          .map(entry => entry.trim().toLowerCase())
          .filter(Boolean)
      )
    );
  };

  router.get('/', (req, res) => {
    const books = normalizeBooks(readJSON(booksFile));
    const { sortBy, order, category } = req.query;
    const selectedCategories = parseCategoryQuery(category);

    let filteredBooks = books;
    if (selectedCategories.length > 0 && !selectedCategories.includes('all')) {
      filteredBooks = books.filter((book) => {
        const normalizedCategories = (book.categories || []).map(value => value.toLowerCase());
        return normalizedCategories.some(value => selectedCategories.includes(value));
      });
    }

    if (sortBy === undefined && order === undefined) {
      return res.json(filteredBooks);
    }

    const sortField = sortBy === undefined ? 'title' : sortBy;
    const sortOrder = order === undefined ? 'asc' : order;

    if (!ALLOWED_SORT_FIELDS.includes(sortField)) {
      return res.status(400).json({ error: `Invalid sortBy. Allowed values: ${ALLOWED_SORT_FIELDS.join(', ')}` });
    }
    if (!ALLOWED_ORDERS.includes(sortOrder)) {
      return res.status(400).json({ error: `Invalid order. Allowed values: ${ALLOWED_ORDERS.join(', ')}` });
    }

    const sorted = [...filteredBooks].sort((a, b) => {
      const av = (a[sortField] || '').toString().toLowerCase();
      const bv = (b[sortField] || '').toString().toLowerCase();
      if (av < bv) return sortOrder === 'asc' ? -1 : 1;
      if (av > bv) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    res.json(sorted);
  });

  // generated-by-copilot: PATCH /books/:id/rating — set a 1–5 star rating for a book
  router.patch('/:id/rating', (req, res) => {
    const { rating } = req.body;
    const ratingNum = Number(rating);

    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5.' });
    }

    const books = readJSON(booksFile);
    const bookIndex = books.findIndex(b => b.id === req.params.id);

    if (bookIndex === -1) {
      return res.status(404).json({ error: 'Book not found.' });
    }

    books[bookIndex] = { ...books[bookIndex], rating: ratingNum };
    writeJSON(booksFile, books);

    res.json(books[bookIndex]);
  });

  // POST /books removed: adding books is not allowed

  return router;
}

module.exports = createBooksRouter;
