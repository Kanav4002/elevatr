const jwt = require('jsonwebtoken');

const verifyAuth = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;
    if(!authorization) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authorization.split(" ")[1]; // Bearer <token>
    if (!token) {
      return res.status(401).json({ message: "Invalid token format"});
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