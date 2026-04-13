const express = require('express');
const jwt = require('jsonwebtoken');

function createAuthRouter({ usersFile, readJSON, writeJSON, SECRET_KEY }) {
  const router = express.Router();

  router.post('/register', (req, res) => {
    const { username, password, role } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Username and password required' });
    const users = readJSON(usersFile);
    if (users.find(u => u.username === username)) {
      return res.status(409).json({ message: 'User already exists' });
    }
    // generated-by-copilot: use provided role if valid, otherwise default to 'member'
    const validRoles = ['member', 'administrator'];
    const assignedRole = validRoles.includes(role) ? role : 'member';
    users.push({ username, password, role: assignedRole, favorites: [] });
    writeJSON(usersFile, users);
    res.status(201).json({ message: 'User registered' });
  });

  router.post('/login', (req, res) => {
    const { username, password } = req.body;
    const users = readJSON(usersFile);
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    // generated-by-copilot: include role in JWT payload so it's available server-side via req.user.role
    const role = user.role || 'member';
    const token = jwt.sign({ username, role }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token, role });
  });

  return router;
}

module.exports = createAuthRouter;
