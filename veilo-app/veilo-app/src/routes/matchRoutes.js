const router = require('express').Router();
const ctrl = require('../controllers/matchController');
const requireAuth = require('../middleware/auth');
const trackActivity = require('../middleware/activity');
const asyncHandler = require('../utils/asyncHandler');

router.use(requireAuth, trackActivity);

router.get('/status', asyncHandler(ctrl.getStatus));
router.post('/find', asyncHandler(ctrl.findMatch));
router.get('/', asyncHandler(ctrl.listMatches));
router.get('/:matchId', asyncHandler(ctrl.getOne));
router.post('/:matchId/unmatch', asyncHandler(ctrl.unmatch));

module.exports = router;
