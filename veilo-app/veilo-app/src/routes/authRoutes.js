const router = require('express').Router();
const ctrl = require('../controllers/authController');
const requireAuth = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');
const asyncHandler = require('../utils/asyncHandler');

router.post('/register', authLimiter, asyncHandler(ctrl.register));
router.post('/login', authLimiter, asyncHandler(ctrl.login));
router.post('/logout', ctrl.logout);
router.get('/session', requireAuth, asyncHandler(ctrl.session));

module.exports = router;
