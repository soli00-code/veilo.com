const router = require('express').Router();
const ctrl = require('../controllers/profileShareController');
const requireAuth = require('../middleware/auth');
const trackActivity = require('../middleware/activity');
const asyncHandler = require('../utils/asyncHandler');

router.use(requireAuth, trackActivity);

router.get('/me/share', asyncHandler(ctrl.getMyShareInfo));
router.post('/me/regenerate-code', asyncHandler(ctrl.regenerateCode));
router.get('/by-code/:code', asyncHandler(ctrl.viewByCode));
router.post('/by-code/:code/connect', asyncHandler(ctrl.connectByCode));

module.exports = router;
