const express = require('express');

// generated-by-copilot: book reviews API routes
function createReviewsRouter({ booksFile, reviewsFile, readJSON, writeJSON, authenticateToken }) {
  const router = express.Router();

  // GET /api/books/:id/reviews - Get all reviews for a book
  router.get('/:id/reviews', (req, res) => {
    const { id } = req.params;
    const books = readJSON(booksFile);
    const book = books.find(b => b.id === id);
    if (!book) return res.status(404).json({ message: 'Book not found' });

    const reviews = readJSON(reviewsFile);
    const bookReviews = reviews.filter(r => r.bookId === id);
    res.json(bookReviews);
  });

  // GET /api/books/:id/average-rating - Get average rating for a book
  router.get('/:id/average-rating', (req, res) => {
    const { id } = req.params;
    const books = readJSON(booksFile);
    const book = books.find(b => b.id === id);
    if (!book) return res.status(404).json({ message: 'Book not found' });

    const reviews = readJSON(reviewsFile);
    const bookReviews = reviews.filter(r => r.bookId === id);
    if (bookReviews.length === 0) {
      return res.json({ averageRating: 0, totalReviews: 0 });
    }
    const sum = bookReviews.reduce((acc, r) => acc + r.rating, 0);
    const averageRating = Math.round((sum / bookReviews.length) * 10) / 10;
    res.json({ averageRating, totalReviews: bookReviews.length });
  });

  // POST /api/books/:id/reviews - Submit a new review (authenticated, rate-limited)
  router.post('/:id/reviews', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { rating, reviewText } = req.body;

    // generated-by-copilot: validate required fields
    if (rating === undefined || rating === null) {
      return res.status(400).json({ message: 'Rating is required' });
    }
    const numRating = Number(rating);
    if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({ message: 'Rating must be an integer between 1 and 5' });
    }
    if (!reviewText || typeof reviewText !== 'string' || reviewText.trim().length === 0) {
      return res.status(400).json({ message: 'Review text is required' });
    }

    const books = readJSON(booksFile);
    const book = books.find(b => b.id === id);
    if (!book) return res.status(404).json({ message: 'Book not found' });

    const reviews = readJSON(reviewsFile);

    // generated-by-copilot: prevent duplicate reviews from same user on same book
    const existingReview = reviews.find(r => r.bookId === id && r.username === req.user.username);
    if (existingReview) {
      return res.status(409).json({ message: 'You have already reviewed this book' });
    }

    const newReview = {
      // generated-by-copilot: combine timestamp with random suffix for unique IDs
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      bookId: id,
      username: req.user.username,
      rating: numRating,
      reviewText: reviewText.trim(),
      createdAt: new Date().toISOString(),
    };

    reviews.push(newReview);
    writeJSON(reviewsFile, reviews);
    res.status(201).json(newReview);
  });

  return router;
}

module.exports = createReviewsRouter;
