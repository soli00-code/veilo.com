const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { sign } = require('../utils/jwt');
const { COOKIE_NAME } = require('../middleware/auth');
const {
  randomNickname,
  isValidNickname,
  randomAura,
  isValidAura,
  generateProfileCode
} = require('../utils/identity');
const { age } = require('../utils/matching');

const isProd = process.env.NODE_ENV === 'production';

function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000
  });
}

function publicUser(user) {
  return {
    id: user._id,
    email: user.email,
    nickname: user.nickname,
    auraId: user.auraId,
    profileCode: user.profileCode
  };
}

async function generateUniqueProfileCode() {
  let code;
  let exists = true;
  while (exists) {
    code = generateProfileCode();
    exists = await User.exists({ profileCode: code });
  }
  return code;
}

const GENDERS = ['man', 'woman', 'nonbinary'];
const SEEKING = ['men', 'women', 'everyone', 'nonbinary'];
const INTENTS = ['casual', 'serious', 'unsure'];

exports.register = async (req, res) => {
  try {
    const {
      email,
      password,
      dateOfBirth,
      gender,
      seekingGender,
      intent,
      ageRangeMin,
      ageRangeMax,
      auraId,
      nickname,
      bio,
      interests,
      prompts,
      quizAnswers
    } = req.body;

    if (!email || !password || !dateOfBirth || !gender || !seekingGender) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ error: 'Enter a valid email address.' });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }
    if (!GENDERS.includes(gender) || !SEEKING.includes(seekingGender)) {
      return res.status(400).json({ error: 'Invalid gender or preference value.' });
    }
    if (isNaN(new Date(dateOfBirth).getTime()) || age(dateOfBirth) < 18) {
      return res.status(400).json({ error: 'You must be 18 or older to use Veilo.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const profileCode = await generateUniqueProfileCode();

    const user = await User.create({
      email: email.toLowerCase(),
      passwordHash,
      dateOfBirth,
      gender,
      seekingGender,
      intent: INTENTS.includes(intent) ? intent : 'unsure',
      ageRangeMin: Number(ageRangeMin) || 18,
      ageRangeMax: Number(ageRangeMax) || 99,
      nickname: isValidNickname(nickname) ? nickname : randomNickname(),
      auraId: isValidAura(auraId) ? Number(auraId) : randomAura(),
      profileCode,
      bio: typeof bio === 'string' ? bio.slice(0, 500) : '',
      interests: Array.isArray(interests) ? interests.slice(0, 12).map(String) : [],
      prompts: Array.isArray(prompts) ? prompts.slice(0, 5) : [],
      quizAnswers: quizAnswers && typeof quizAnswers === 'object' ? quizAnswers : {}
    });

    const token = sign({ id: user._id });
    setAuthCookie(res, token);
    res.status(201).json(publicUser(user));
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }
    console.error('register error:', err);
    res.status(500).json({ error: 'Something went wrong creating your account.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = sign({ id: user._id });
    setAuthCookie(res, token);
    res.json(publicUser(user));
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ error: 'Something went wrong logging you in.' });
  }
};

exports.logout = (req, res) => {
  res.clearCookie(COOKIE_NAME);
  res.json({ ok: true });
};

exports.session = async (req, res) => {
  res.json(publicUser(req.user));
};
