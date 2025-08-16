const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: 'Missing fields' });
  try {
    const exists = await User.findOne({ username });
    if (exists) return res.status(400).json({ message: 'Username taken' });
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, passwordHash: hash });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.json({ token, username: user.username });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: 'Missing fields' });
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const ok = await user.verifyPassword(password);
    if (!ok) return res.status(400).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.json({ token, username: user.username });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
