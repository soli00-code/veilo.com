const router = require('express').Router();
const ctrl = require('../controllers/messageController');
const requireAuth = require('../middleware/auth');
const trackActivity = require('../middleware/activity');
const upload = require('../middleware/upload');
const asyncHandler = require('../utils/asyncHandler');

router.use(requireAuth, trackActivity);

router.get('/matches/:matchId/messages', asyncHandler(ctrl.list));
router.post('/matches/:matchId/messages', asyncHandler(ctrl.sendText));
router.post('/matches/:matchId/messages/voice', upload.single('audio'), asyncHandler(ctrl.sendVoice));
router.get('/messages/:messageId/audio', asyncHandler(ctrl.getAudio));

module.exports = router;
