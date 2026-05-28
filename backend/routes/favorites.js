const express = require('express');

function createFavoritesRouter({ usersFile, booksFile, readJSON, writeJSON, authenticateToken }) {
  const router = express.Router();

  router.get('/', authenticateToken, (req, res) => {
    const users = readJSON(usersFile);
    const user = users.find(u => u.username === req.user.username);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const books = readJSON(booksFile);
    const comments = user.favoriteComments || {};
    // generated-by-copilot: enrich each favorite book with its comment
    const favorites = books
      .filter(b => user.favorites.indexOf(b.id) !== -1)
      .map(b => ({ ...b, comment: comments[b.id] || '' }));
    res.json(favorites);
  });

  router.post('/', authenticateToken, (req, res) => {
    const { bookId } = req.body;
    if (!bookId) return res.status(400).json({ message: 'Book ID required' });
    const users = readJSON(usersFile);
    const user = users.find(u => u.username === req.user.username);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.favorites.indexOf(bookId) == -1) {
      user.favorites.push(bookId);
      writeJSON(usersFile, users);
    }
    res.status(200).json({ message: 'Book added to favorites' });
  });

  // generated-by-copilot: clear all favorites (and their comments) for the current user
  router.delete('/', authenticateToken, (req, res) => {
    const users = readJSON(usersFile);
    const user = users.find(u => u.username === req.user.username);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.favorites = [];
    user.favoriteComments = {};
    writeJSON(usersFile, users);
    res.status(200).json({ message: 'All favorites cleared' });
  });

  router.delete('/:bookId', authenticateToken, (req, res) => {
    const { bookId } = req.params;
    if (!bookId) return res.status(400).json({ message: 'Book ID required' });
    const users = readJSON(usersFile);
    const user = users.find(u => u.username === req.user.username);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const idx = user.favorites.indexOf(bookId);
    if (idx !== -1) {
      user.favorites.splice(idx, 1);
      // generated-by-copilot: clean up any comment when removing a favorite
      if (user.favoriteComments) delete user.favoriteComments[bookId];
      writeJSON(usersFile, users);
    }
    res.status(200).json({ message: 'Book removed from favorites' });
  });

  // generated-by-copilot: add or update a comment on a favorite book
  router.post('/:bookId/comment', authenticateToken, (req, res) => {
    const { bookId } = req.params;
    const { comment } = req.body;
    if (comment === undefined) return res.status(400).json({ message: 'Comment is required' });
    const users = readJSON(usersFile);
    const user = users.find(u => u.username === req.user.username);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.favorites.indexOf(bookId) === -1) {
      return res.status(404).json({ message: 'Book not in favorites' });
    }
    if (!user.favoriteComments) user.favoriteComments = {};
    user.favoriteComments[bookId] = comment;
    writeJSON(usersFile, users);
    res.status(200).json({ message: 'Comment saved', comment });
  });

  return router;
}

module.exports = createFavoritesRouter;
