const User = require('../models/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const verifyAuth = require('../middlewares/auth.middleware');

const registerUser = async(req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      // throw new Error("All fields are required");
      return res.status(400).json({ message: "All fields are required" });
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
      role: role || 'student'
    });

    const token = jwt.sign(
      {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h'}
    );

    res.cookie("token", token, { httpOnly: true, maxAge: 24*60*60*1000, secure: process.env.NODE_ENV === 'production' });

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({ user: userResponse, message: "User created successfully", token: token });
  } catch (error) {
    res.status(500).json({ message: error.message}); 
  }
};

const loginUser = async(req, res) => {
  try {
    const {email, password} = req.body;
    if(!email || !password) {
      // throw new Error("All fields are required");
      return res.status(400).json({ message: "All fields are required"});
    }

    const user = await User.findOne({email: email});
    if(!user) {
      // throw new Error("Invalid email or password");
      return res.status(401).json({ message: "Invalid email or password"});
    }

    const isMatched = await bcrypt.compare(password, user.password);
    if(!isMatched) {
      // throw new Error("Invalid email or password");
      return res.status(401).json({ message: "Invalid email or password"});
    }

    const token = jwt.sign(
      {
        id: user._id, 
        name: user.name,
        email: user.email,
        role: user.role,
      }, 
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 24*60*60*1000, // 24 hours
      secure: process.env.NODE_ENV === 'production'
    });

    res.status(200).json({
      message: "Login successful",
      token: token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    res.status(500).json({message: error.message});
  }
}

module.exports =  { registerUser, loginUser };