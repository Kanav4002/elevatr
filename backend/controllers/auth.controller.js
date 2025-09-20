const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const verifyAuth = require('../middlewares/auth.middleware');

const registerUser = async(req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      throw new Error("All fields are required");
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists"});
    }

    const hashPass = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name,
      email: email,
      password: hashPass,
    });
    res.status(201).json({ user, message: "User created successfully"});
  } catch (error) {
    res.status(500).json({ message: error.message}); 
  }
};

module.exports =  { registerUser };