const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const verifyAuth = require('../middlewares/auth.middleware');
const { registerUser } = require('../controllers/auth.controller');

// POST 
router.post('/register', registerUser);

module.exports = router;