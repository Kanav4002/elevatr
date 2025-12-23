const jwt = require('jsonwebtoken');

const verifyAuth = async (req, res, next) => {
  try {
    // ✅ Get token from httpOnly cookie (not Authorization header)
    const token = req.cookies?.token;
    
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    // Verify token
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (error) {
    console.log("Auth middleware error: ", error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Token expired, please login again" });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: "Invalid token" });
    } else {
      return res.status(401).json({ message: "Authentication failed" });
    }
  }
}

module.exports = { verifyAuth };