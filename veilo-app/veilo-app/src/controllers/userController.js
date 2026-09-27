const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Match = require('../models/Match');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const {
  randomNickname,
  isValidNickname,
  randomAura,
  isValidAura
} = require('../utils/identity');

function publicSelf(user) {
  return {
    id: user._id,
    email: user.email,
    nickname: user.nickname,
    auraId: user.auraId,
    profileCode: user.profileCode,
    bio: user.bio,
    interests: user.interests,
    prompts: user.prompts,
    quizAnswers: user.quizAnswers,
    gender: user.gender,
    seekingGender: user.seekingGender,
    intent: user.intent,
    ageRangeMin: user.ageRangeMin,
    ageRangeMax: user.ageRangeMax,
    notificationPrefs: user.notificationPrefs,
    createdAt: user.createdAt
  };
}

exports.getMe = async (req, res) => {
  res.json(publicSelf(req.user));
};

exports.updateMe = async (req, res) => {
  const { bio, interests, prompts, notificationPrefs } = req.body;

  if (typeof bio === 'string') req.user.bio = bio.slice(0, 500);
  if (Array.isArray(interests)) req.user.interests = interests.slice(0, 12).map(String);
  if (Array.isArray(prompts)) {
    req.user.prompts = prompts
      .filter((p) => p && p.question && p.answer)
      .slice(0, 5)
      .map((p) => ({ question: String(p.question).slice(0, 120), answer: String(p.answer).slice(0, 300) }));
  }
  if (notificationPrefs && typeof notificationPrefs === 'object') {
    req.user.notificationPrefs = {
      newMatches: !!notificationPrefs.newMatches,
      newMessages: !!notificationPrefs.newMessages,
      feedActivity: !!notificationPrefs.feedActivity
    };
  }

  await req.user.save();
  res.json(publicSelf(req.user));
};

exports.updateIdentity = async (req, res) => {
  const { nickname, auraId } = req.body;
  req.user.nickname = isValidNickname(nickname) ? nickname : randomNickname();
  req.user.auraId = isValidAura(auraId) ? Number(auraId) : randomAura();
  await req.user.save();
  res.json({ nickname: req.user.nickname, auraId: req.user.auraId });
};

exports.updateQuiz = async (req, res) => {
  const { quizAnswers } = req.body;
  if (!quizAnswers || typeof quizAnswers !== 'object') {
    return res.status(400).json({ error: 'quizAnswers is required.' });
  }
  req.user.quizAnswers = {
    q1: quizAnswers.q1,
    q2: quizAnswers.q2,
    q3: quizAnswers.q3,
    q4: quizAnswers.q4
  };
  await req.user.save();
  res.json({ quizAnswers: req.user.quizAnswers });
};

const SEEKING = ['men', 'women', 'everyone', 'nonbinary'];
const INTENTS = ['casual', 'serious', 'unsure'];

exports.updatePreferences = async (req, res) => {
  const { seekingGender, intent, ageRangeMin, ageRangeMax } = req.body;

  if (seekingGender !== undefined) {
    if (!SEEKING.includes(seekingGender)) return res.status(400).json({ error: 'Invalid preference.' });
    req.user.seekingGender = seekingGender;
  }
  if (intent !== undefined) {
    if (!INTENTS.includes(intent)) return res.status(400).json({ error: 'Invalid intent.' });
    req.user.intent = intent;
  }
  if (ageRangeMin !== undefined) req.user.ageRangeMin = Math.max(18, Number(ageRangeMin) || 18);
  if (ageRangeMax !== undefined) req.user.ageRangeMax = Math.max(req.user.ageRangeMin, Number(ageRangeMax) || 99);

  await req.user.save();
  res.json({
    seekingGender: req.user.seekingGender,
    intent: req.user.intent,
    ageRangeMin: req.user.ageRangeMin,
    ageRangeMax: req.user.ageRangeMax
  });
};

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Both current and new password are required.' });
  }
  if (String(newPassword).length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters.' });
  }
  const ok = await bcrypt.compare(currentPassword, req.user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Current password is incorrect.' });

  req.user.passwordHash = await bcrypt.hash(newPassword, 10);
  await req.user.save();
  res.json({ ok: true });
};

exports.deleteMe = async (req, res) => {
  const userId = req.user._id;

  await Match.updateMany(
    { users: userId, status: 'active' },
    { status: 'unmatched', endedBy: userId, endedReason: 'account_deleted' }
  );

  const myPosts = await Post.find({ author: userId }).select('_id');
  const myPostIds = myPosts.map((p) => p._id);
  await Comment.deleteMany({ post: { $in: myPostIds } });
  await Post.deleteMany({ author: userId });
  await Comment.deleteMany({ author: userId });
  await Post.updateMany({}, { $pull: { resonatedBy: userId } });

  await Notification.deleteMany({ user: userId });
  await User.updateMany({}, { $pull: { blockedUsers: userId } });

  await User.deleteOne({ _id: userId });

  const { COOKIE_NAME } = require('../middleware/auth');
  res.clearCookie(COOKIE_NAME);
  res.json({ ok: true });
};
