const express = require('express');
const rateLimit = require('express-rate-limit');

// generated-by-copilot: router for the book review system
function createReviewsRouter({ booksFile, reviewsFile, readJSON, writeJSON, authenticateToken }) {
  // Use mergeParams so :bookId from the parent mount point is available
  const router = express.Router({ mergeParams: true });

  // Stricter rate limit specifically for review submissions to mitigate spam.
  const submitLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // limit each IP to 10 review submissions per minute
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many review submissions, please try again later.' },
    // Skip rate limiting during unit tests so the suite is not flaky.
    skip: () => process.env.NODE_ENV === 'test',
  });

  function findBook(bookId) {
    const books = readJSON(booksFile);
    return books.find(b => String(b.id) === String(bookId));
  }

  function reviewsForBook(bookId) {
    const reviews = readJSON(reviewsFile);
    return reviews.filter(r => String(r.bookId) === String(bookId));
  }

  // GET /api/books/:bookId/reviews - list reviews for a book
  router.get('/:bookId/reviews', (req, res) => {
    const { bookId } = req.params;
    if (!findBook(bookId)) {
      return res.status(404).json({ message: 'Book not found' });
    }
    const list = reviewsForBook(bookId).sort((a, b) => {
      // newest first
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });
    res.json(list);
  });

  // GET /api/books/:bookId/average-rating - aggregate average rating for a book
  router.get('/:bookId/average-rating', (req, res) => {
    const { bookId } = req.params;
    if (!findBook(bookId)) {
      return res.status(404).json({ message: 'Book not found' });
    }
    const list = reviewsForBook(bookId);
    if (list.length === 0) {
      return res.json({ bookId: String(bookId), averageRating: 0, count: 0 });
    }
    const total = list.reduce((sum, r) => sum + Number(r.rating || 0), 0);
    const averageRating = Math.round((total / list.length) * 100) / 100;
    res.json({ bookId: String(bookId), averageRating, count: list.length });
  });

  // POST /api/books/:bookId/reviews - submit a new review for a book
  router.post('/:bookId/reviews', submitLimiter, authenticateToken, (req, res) => {
    const { bookId } = req.params;
    const { rating, text } = req.body || {};

    // Input validation
    const numericRating = Number(rating);
    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: 'Rating must be an integer between 1 and 5' });
    }
    if (typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ message: 'Review text is required' });
    }
    if (text.length > 2000) {
      return res.status(400).json({ message: 'Review text must be 2000 characters or fewer' });
    }

    if (!findBook(bookId)) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const reviews = readJSON(reviewsFile);
    const review = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      bookId: String(bookId),
      username: req.user.username,
      rating: numericRating,
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };
    reviews.push(review);
    writeJSON(reviewsFile, reviews);
    res.status(201).json(review);
  });

  return router;
}

module.exports = createReviewsRouter;
