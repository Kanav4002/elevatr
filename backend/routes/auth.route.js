const express = require('express');
const router = express.Router();
const { verifyAuth } = require('../middlewares/auth.middleware');
const { registerUser, loginUser } = require('../controllers/auth.controller');

// POST - /api/auth/register
router.post('/register', registerUser);
// POST - /api/auth/login
router.post('/login', loginUser);

// Protected routes
router.get('/profile', verifyAuth, (req, res) => {
  res.json({
    message: "Profile access successful",
    user: req.user,
  })
});

// Test route to verify token
router.get('/verify-token', verifyAuth, (req, res) => {
  res.json({
    message: "Token is valid",
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;