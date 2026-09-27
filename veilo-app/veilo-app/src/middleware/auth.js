const { verify } = require('../utils/jwt');
const User = require('../models/User');

const COOKIE_NAME = 'veilo_token';

async function requireAuth(req, res, next) {
  try {
    const token =
      (req.cookies && req.cookies[COOKIE_NAME]) ||
      (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')
        ? req.headers.authorization.slice(7)
        : null);

    if (!token) {
      return res.status(401).json({ error: 'You need to log in first.' });
    }

    const payload = verify(token);
    const user = await User.findById(payload.id);
    if (!user) {
      return res.status(401).json({ error: 'Your session is no longer valid. Please log in again.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Your session has expired. Please log in again.' });
  }
}

module.exports = requireAuth;
module.exports.COOKIE_NAME = COOKIE_NAME;
