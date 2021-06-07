const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    console.log(req.body);
    const token = req.headers.authorization;
    const decodedToken = jwt.verify(token, process.env.JWT_KEY);
    req.userData = { email: decodedToken.email, userId: decodedToken.userId };
    next();
  } catch (error) {
    res.status(401).json({ message: 'You are not authenticated!' });
  }
};
