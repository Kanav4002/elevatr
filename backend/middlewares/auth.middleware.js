const jwt = require('jsonwebtoken');

async function verifyAuth(req, res, next) {
  try {
    const authorization = req.headers.authorization;
    const token = authorization.splilt(" ")[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (error) {
    console.log(error);
    res.status(400).json({message: "You are not Authorized, Please login first"});
  }
}

module.exports = verifyAuth;