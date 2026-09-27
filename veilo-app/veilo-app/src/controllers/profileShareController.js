const QRCode = require('qrcode');
const User = require('../models/User');
const Match = require('../models/Match');
const Notification = require('../models/Notification');
const { computeResonance } = require('../utils/matching');
const { generateProfileCode } = require('../utils/identity');

function baseUrl(req) {
  return process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`;
}

exports.getMyShareInfo = async (req, res) => {
  const link = `${baseUrl(req)}/p/${req.user.profileCode}`;
  const qrDataUrl = await QRCode.toDataURL(link, {
    margin: 1,
    width: 320,
    color: { dark: '#1B1330', light: '#FFF7ED' }
  });
  res.json({ link, qrDataUrl, profileCode: req.user.profileCode });
};

exports.regenerateCode = async (req, res) => {
  let code;
  let exists = true;
  while (exists) {
    code = generateProfileCode();
    exists = await User.exists({ profileCode: code });
  }
  req.user.profileCode = code;
  await req.user.save();
  res.json({ profileCode: code, link: `${baseUrl(req)}/p/${code}` });
};

function isBlockedEitherWay(me, owner) {
  const iBlockedThem = me.blockedUsers.some((id) => id.toString() === owner._id.toString());
  const theyBlockedMe = owner.blockedUsers.some((id) => id.toString() === me._id.toString());
  return iBlockedThem || theyBlockedMe;
}

exports.viewByCode = async (req, res) => {
  const owner = await User.findOne({ profileCode: req.params.code });
  if (!owner) {
    return res.status(404).json({ error: 'This profile link is no longer valid.' });
  }

  if (owner._id.toString() === req.user._id.toString()) {
    return res.json({ isSelf: true, nickname: owner.nickname, auraId: owner.auraId });
  }

  if (isBlockedEitherWay(req.user, owner)) {
    return res.status(404).json({ error: 'This profile is not available.' });
  }

  const existingMatch = await Match.findOne({ users: { $all: [req.user._id, owner._id] } });

  res.json({
    isSelf: false,
    nickname: owner.nickname,
    auraId: owner.auraId,
    bio: owner.bio,
    interests: owner.interests,
    prompts: owner.prompts,
    resonanceScore: computeResonance(req.user, owner),
    existingMatch: existingMatch ? { matchId: existingMatch._id, status: existingMatch.status } : null
  });
};

exports.connectByCode = async (req, res) => {
  const owner = await User.findOne({ profileCode: req.params.code });
  if (!owner) {
    return res.status(404).json({ error: 'This profile link is no longer valid.' });
  }
  if (owner._id.toString() === req.user._id.toString()) {
    return res.status(400).json({ error: "That's your own profile link." });
  }
  if (isBlockedEitherWay(req.user, owner)) {
    return res.status(404).json({ error: 'This profile is not available.' });
  }

  let match = await Match.findOne({ users: { $all: [req.user._id, owner._id] } });
  if (match) {
    if (match.status !== 'active') {
      return res.status(400).json({ error: 'This conversation has already ended.' });
    }
    return res.json({ matchId: match._id });
  }

  const resonanceScore = computeResonance(req.user, owner);
  match = await Match.create({
    users: [req.user._id, owner._id],
    origin: 'direct_link',
    resonanceScore,
    status: 'active'
  });

  await Notification.create({
    user: owner._id,
    type: 'match',
    text: `${req.user.nickname} connected with you through your shared profile link`,
    link: `/chat.html?match=${match._id}`
  });

  res.status(201).json({ matchId: match._id });
};
