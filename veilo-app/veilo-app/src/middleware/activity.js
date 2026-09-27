const User = require('../models/User');

const THROTTLE_MS = 5 * 60 * 1000; // only record once per 5 minutes per user

// Increments this user's activity histogram for the current UTC hour so the
// matching engine can later find people whose active times overlap. Cheap,
// fire-and-continue — never blocks or fails the request it's attached to.
async function trackActivity(req, res, next) {
  next(); // don't make the person wait on this

  try {
    if (!req.user) return;

    const now = Date.now();
    const last = req.user.lastActiveAt ? new Date(req.user.lastActiveAt).getTime() : 0;
    if (now - last < THROTTLE_MS) return;

    const hour = new Date().getUTCHours();
    await User.updateOne(
      { _id: req.user._id },
      { $inc: { [`activityBuckets.${hour}`]: 1 }, $set: { lastActiveAt: new Date() } }
    );
  } catch (err) {
    console.error('trackActivity failed (non-fatal):', err.message);
  }
}

module.exports = trackActivity;
