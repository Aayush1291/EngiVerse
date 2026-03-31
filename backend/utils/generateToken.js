const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
  const expiresIn = process.env.JWT_EXPIRE || '7d';
  
  return jwt.sign({ userId }, secret, { expiresIn });
};

const generateRefreshToken = (userId) => {
  const secret = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-token-key-change-this-in-production';
  const expiresIn = process.env.JWT_REFRESH_EXPIRE || '30d';
  
  return jwt.sign({ userId }, secret, { expiresIn });
};

module.exports = { generateToken, generateRefreshToken };

