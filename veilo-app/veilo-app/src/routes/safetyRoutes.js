const router = require('express').Router();
const ctrl = require('../controllers/safetyController');
const requireAuth = require('../middleware/auth');
const trackActivity = require('../middleware/activity');
const asyncHandler = require('../utils/asyncHandler');

router.use(requireAuth, trackActivity);

router.post('/report', asyncHandler(ctrl.report));
router.post('/block/:userId', asyncHandler(ctrl.block));
router.post('/unblock/:userId', asyncHandler(ctrl.unblock));
router.get('/blocked', asyncHandler(ctrl.listBlocked));

module.exports = router;
