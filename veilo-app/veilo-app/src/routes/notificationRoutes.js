const router = require('express').Router();
const ctrl = require('../controllers/notificationController');
const requireAuth = require('../middleware/auth');
const trackActivity = require('../middleware/activity');
const asyncHandler = require('../utils/asyncHandler');

router.use(requireAuth, trackActivity);

router.get('/', asyncHandler(ctrl.list));
router.post('/:id/read', asyncHandler(ctrl.markRead));
router.post('/read-all', asyncHandler(ctrl.markAllRead));

module.exports = router;
