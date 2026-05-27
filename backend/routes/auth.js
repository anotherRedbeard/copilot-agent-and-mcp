const express = require('express');
const jwt = require('jsonwebtoken');

function createAuthRouter({ usersFile, readJSON, writeJSON, SECRET_KEY }) {
  const router = express.Router();

  const VALID_ROLES = ['member', 'administrator'];

  router.post('/register', (req, res) => {
    const { username, password, role } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Username and password required' });
    const users = readJSON(usersFile);
    if (users.find(u => u.username === username)) {
      return res.status(409).json({ message: 'User already exists' });
    }
    const userRole = VALID_ROLES.includes(role) ? role : 'member';
    users.push({ username, password, role: userRole, favorites: [] });
    writeJSON(usersFile, users);
    res.status(201).json({ message: 'User registered', role: userRole });
  });

  router.post('/login', (req, res) => {
    const { username, password } = req.body;
    const users = readJSON(usersFile);
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const role = VALID_ROLES.includes(user.role) ? user.role : 'member';
    const token = jwt.sign({ username, role }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token, username, role });
  });

  return router;
}

module.exports = createAuthRouter;
