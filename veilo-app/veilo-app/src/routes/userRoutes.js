const router = require('express').Router();
const ctrl = require('../controllers/userController');
const requireAuth = require('../middleware/auth');
const trackActivity = require('../middleware/activity');
const asyncHandler = require('../utils/asyncHandler');

router.use(requireAuth, trackActivity);

router.get('/me', asyncHandler(ctrl.getMe));
router.patch('/me', asyncHandler(ctrl.updateMe));
router.patch('/me/identity', asyncHandler(ctrl.updateIdentity));
router.patch('/me/quiz', asyncHandler(ctrl.updateQuiz));
router.patch('/me/preferences', asyncHandler(ctrl.updatePreferences));
router.post('/me/change-password', asyncHandler(ctrl.changePassword));
router.delete('/me', asyncHandler(ctrl.deleteMe));

module.exports = router;
