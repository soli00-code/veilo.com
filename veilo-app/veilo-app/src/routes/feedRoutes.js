const router = require('express').Router();
const ctrl = require('../controllers/feedController');
const requireAuth = require('../middleware/auth');
const trackActivity = require('../middleware/activity');
const { postLimiter } = require('../middleware/rateLimit');
const asyncHandler = require('../utils/asyncHandler');

router.use(requireAuth, trackActivity);

router.get('/', asyncHandler(ctrl.list));
router.post('/', postLimiter, asyncHandler(ctrl.create));
router.post('/:postId/resonate', asyncHandler(ctrl.resonate));
router.get('/:postId/comments', asyncHandler(ctrl.listComments));
router.post('/:postId/comments', postLimiter, asyncHandler(ctrl.addComment));

module.exports = router;
