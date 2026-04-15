const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = 4000;
const SECRET_KEY = 'your_jwt_secret';

app.use(cors());
app.use(bodyParser.json());


const isTest = process.env.TEST_MODE === '1';
const booksFile = isTest
  ? path.join(__dirname, 'data', 'test-books.json')
  : path.join(__dirname, 'data', 'books.json');
const usersFile = isTest
  ? path.join(__dirname, 'data', 'test-users.json')
  : path.join(__dirname, 'data', 'users.json');
// generated-by-copilot: reviews data file for the book review system
const reviewsFile = isTest
  ? path.join(__dirname, 'data', 'test-reviews.json')
  : path.join(__dirname, 'data', 'reviews.json');

// Helper functions
function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}
function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// Auth middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}



// generated-by-copilot: rate limiter for API endpoints (disabled in test mode)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later' },
  skip: () => isTest,
});

// Use central API router
const createApiRouter = require('./routes');
app.use('/api', apiLimiter, createApiRouter({
  usersFile,
  booksFile,
  reviewsFile,
  readJSON,
  writeJSON,
  authenticateToken,
  SECRET_KEY
}));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
