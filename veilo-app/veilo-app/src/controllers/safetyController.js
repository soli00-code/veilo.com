const Report = require('../models/Report');
const Match = require('../models/Match');
const User = require('../models/User');

const VALID_REASONS = ['photos_or_contact', 'harassment', 'fake_account', 'other'];

exports.report = async (req, res) => {
  const { matchId, reason, details } = req.body;
  if (!VALID_REASONS.includes(reason)) {
    return res.status(400).json({ error: 'Invalid report reason.' });
  }

  const match = await Match.findById(matchId);
  if (!match || !match.users.some((u) => u.toString() === req.user._id.toString())) {
    return res.status(404).json({ error: 'Match not found.' });
  }

  const reportedUserId = match.users.find((u) => u.toString() !== req.user._id.toString());

  await Report.create({
    reporter: req.user._id,
    reportedUser: reportedUserId,
    match: match._id,
    reason,
    details: typeof details === 'string' ? details.slice(0, 1000) : undefined
  });

  match.status = 'blocked';
  match.endedBy = req.user._id;
  match.endedReason = 'report';
  await match.save();

  await User.updateOne({ _id: req.user._id }, { $addToSet: { blockedUsers: reportedUserId } });

  res.json({ ok: true });
};

exports.block = async (req, res) => {
  const targetId = req.params.userId;
  if (targetId === req.user._id.toString()) {
    return res.status(400).json({ error: "You can't block yourself." });
  }

  await User.updateOne({ _id: req.user._id }, { $addToSet: { blockedUsers: targetId } });
  await Match.updateMany(
    { users: { $all: [req.user._id, targetId] }, status: 'active' },
    { status: 'blocked', endedBy: req.user._id, endedReason: 'block' }
  );

  res.json({ ok: true });
};

exports.unblock = async (req, res) => {
  await User.updateOne({ _id: req.user._id }, { $pull: { blockedUsers: req.params.userId } });
  res.json({ ok: true });
};

exports.listBlocked = async (req, res) => {
  const user = await User.findById(req.user._id).populate('blockedUsers', 'nickname auraId');
  res.json({ blocked: user.blockedUsers });
};
