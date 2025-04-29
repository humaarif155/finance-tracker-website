const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db');
const { ensureAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// === Serve pages ===
router.get('/signup', (req, res) => res.sendFile('signup.html', { root: './public' }));
router.get('/login', (req, res) => res.sendFile('login.html', { root: './public' }));
router.get('/dashboard', ensureAuth, (req, res) => res.sendFile('index.html', { root: './public' }));

// === Signup Route ===
router.post('/signup', async (req, res) => {
  const { first_name, last_name, email, password } = req.body;

  if (!first_name || !last_name || !email || !password) {
    console.log("Signup error: Missing fields");
    return res.redirect('/signup');
  }

  try {
    const hash = await bcrypt.hash(password, 12);
    console.log("Signup hash created:", hash);

    await pool.query(
      'INSERT INTO users (first_name, last_name, email, password) VALUES (?, ?, ?, ?)',
      [first_name, last_name, email, hash]
    );

    console.log("User registered:", email);
    res.redirect('/login');
  } catch (err) {
    console.error("Signup error:", err);
    res.redirect('/signup');
  }
});

// === Login Route ===
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    console.log("Login error: Missing email or password");
    return res.redirect('/login');
  }

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);

    if (rows.length === 0) {
      console.log("Login failed: User not found");
      return res.redirect('/login');
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      console.log("Login failed: Incorrect password");
      return res.redirect('/login');
    }

    req.session.userId = user.id;
    console.log("Login successful for:", email);
    res.redirect('/dashboard');
  } catch (err) {
    console.error("Login error:", err);
    res.redirect('/login');
  }
});

// === Logout Route ===
router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.redirect('/dashboard');
    res.clearCookie('connect.sid');
    res.redirect('/login');
  });
});

module.exports = router;
