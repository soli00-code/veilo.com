const User = require('../models/User');
const Match = require('../models/Match');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const { mutualGenderMatch, mutualAgeMatch, computeResonance } = require('../utils/matching');

function partnerOf(match, userId) {
  return match.users.find((u) => u._id.toString() !== userId.toString());
}

function partnerPublicView(u) {
  return {
    id: u._id,
    nickname: u.nickname,
    auraId: u.auraId,
    bio: u.bio,
    interests: u.interests,
    prompts: u.prompts
  };
}

// Every user this person should never be re-suggested by the algorithm:
// themselves, anyone they've blocked (either direction), and anyone they
// already have any match with (active or ended) of any origin.
async function getExcludedIds(user) {
  const priorMatches = await Match.find({ users: user._id }).select('users');
  const ids = new Set([user._id.toString(), ...user.blockedUsers.map(String)]);
  priorMatches.forEach((m) => m.users.forEach((u) => ids.add(u.toString())));

  const blockedMe = await User.find({ blockedUsers: user._id }).select('_id');
  blockedMe.forEach((u) => ids.add(u._id.toString()));

  return [...ids];
}

exports.getStatus = async (req, res) => {
  const active = await Match.findOne({ users: req.user._id, origin: 'algorithm', status: 'active' }).populate(
    'users',
    'nickname auraId bio interests prompts'
  );

  if (!active) return res.json({ status: 'waiting' });

  const partner = partnerOf(active, req.user._id);
  const lastMessage = await Message.findOne({ match: active._id }).sort({ createdAt: -1 });
  res.json({
    status: 'active',
    matchId: active._id,
    resonanceScore: active.resonanceScore,
    partner: partnerPublicView(partner),
    hasMessages: !!lastMessage,
    lastMessage: lastMessage
      ? { type: lastMessage.type, text: lastMessage.text, createdAt: lastMessage.createdAt }
      : null,
    matchedAt: active.createdAt
  });
};

exports.findMatch = async (req, res) => {
  const existingActive = await Match.findOne({ users: req.user._id, origin: 'algorithm', status: 'active' });
  if (existingActive) {
    return res.json({ status: 'active', matchId: existingActive._id });
  }

  const excluded = await getExcludedIds(req.user);
  const candidates = await User.find({
    _id: { $nin: excluded },
    'quizAnswers.q1': { $exists: true, $ne: null }
  });

  const eligible = candidates.filter((c) => mutualGenderMatch(req.user, c) && mutualAgeMatch(req.user, c));
  if (eligible.length === 0) {
    return res.json({ status: 'waiting' });
  }

  let best = null;
  let bestScore = -1;
  for (const candidate of eligible) {
    const score = computeResonance(req.user, candidate);
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  const match = await Match.create({
    users: [req.user._id, best._id],
    origin: 'algorithm',
    resonanceScore: bestScore,
    status: 'active'
  });

  await Notification.insertMany([
    { user: req.user._id, type: 'match', text: `New match: ${best.nickname}`, link: `/chat.html?match=${match._id}` },
    { user: best._id, type: 'match', text: `New match: ${req.user.nickname}`, link: `/chat.html?match=${match._id}` }
  ]);

  res.json({
    status: 'active',
    matchId: match._id,
    resonanceScore: bestScore,
    partner: partnerPublicView(best)
  });
};

exports.listMatches = async (req, res) => {
  const matches = await Match.find({ users: req.user._id })
    .populate('users', 'nickname auraId')
    .sort({ updatedAt: -1 });

  const results = await Promise.all(
    matches.map(async (m) => {
      const partner = partnerOf(m, req.user._id);
      const lastMessage = await Message.findOne({ match: m._id }).sort({ createdAt: -1 });
      const unreadCount = await Message.countDocuments({
        match: m._id,
        sender: { $ne: req.user._id },
        readAt: null
      });
      return {
        matchId: m._id,
        status: m.status,
        origin: m.origin,
        resonanceScore: m.resonanceScore,
        partner: { id: partner._id, nickname: partner.nickname, auraId: partner.auraId },
        lastMessage: lastMessage
          ? { type: lastMessage.type, text: lastMessage.text, createdAt: lastMessage.createdAt }
          : null,
        unreadCount,
        updatedAt: m.updatedAt
      };
    })
  );

  res.json({ matches: results });
};

exports.getOne = async (req, res) => {
  const match = await Match.findById(req.params.matchId).populate('users', 'nickname auraId bio interests prompts');
  if (!match || !match.users.some((u) => u._id.toString() === req.user._id.toString())) {
    return res.status(404).json({ error: 'Match not found.' });
  }
  const partner = partnerOf(match, req.user._id);
  res.json({
    matchId: match._id,
    status: match.status,
    origin: match.origin,
    resonanceScore: match.resonanceScore,
    partner: partnerPublicView(partner)
  });
};

exports.unmatch = async (req, res) => {
  const match = await Match.findById(req.params.matchId);
  if (!match || !match.users.some((u) => u.toString() === req.user._id.toString())) {
    return res.status(404).json({ error: 'Match not found.' });
  }
  if (match.status !== 'active') {
    return res.status(400).json({ error: 'This conversation has already ended.' });
  }
  match.status = 'unmatched';
  match.endedBy = req.user._id;
  match.endedReason = 'unmatch';
  await match.save();
  res.json({ ok: true });
};
