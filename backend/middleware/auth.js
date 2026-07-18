const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  const authHeader = req.header('Authorization');
  if (!authHeader) {
    return res.status(401).json({ message: 'No authorization token, access denied' });
  }

  const token = authHeader.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'No token found, access denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'beyond-the-face-jwt-secret-token-key-2026');
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is invalid or expired, authorization failed' });
  }
};
