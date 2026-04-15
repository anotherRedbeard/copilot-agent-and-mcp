const createAuthRouter = require('./auth');
const createBooksRouter = require('./books');
const createFavoritesRouter = require('./favorites');
const createReviewsRouter = require('./reviews');

function createApiRouter(deps) {
  const express = require('express');
  const router = express.Router();

  router.use('/', createAuthRouter(deps));
  router.use('/books', createBooksRouter(deps));
  router.use('/books', createReviewsRouter(deps));
  router.use('/favorites', createFavoritesRouter(deps));

  return router;
}

module.exports = createApiRouter;
