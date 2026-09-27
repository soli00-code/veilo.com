const jwt = require('jsonwebtoken');

function sign(payload) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not set. Copy .env.example to .env and fill it in.');
  }
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' });
}

function verify(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = { sign, verify };
