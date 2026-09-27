const crypto = require('crypto');

const ADJECTIVES = [
  'Quiet', 'Bold', 'Solar', 'Curious', 'Steady', 'Wandering',
  'Wry', 'Restless', 'Gentle', 'Sunny', 'Salty', 'Soft-spoken'
];

const NOUNS = [
  'Marigold', 'Static', 'Whistle', 'Harbor', 'Ember', 'Compass',
  'Echo', 'Comet', 'Lagoon', 'Ridge', 'Tide', 'Fable'
];

function randomNickname() {
  const a = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const n = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${a} ${n}`;
}

// A nickname is only ever a combination of the two approved word lists.
// This is deliberate: it stops someone from typing a real name into the
// nickname field and quietly defeating the whole point of the product.
function isValidNickname(nickname) {
  if (typeof nickname !== 'string') return false;
  const parts = nickname.trim().split(' ');
  if (parts.length !== 2) return false;
  return ADJECTIVES.includes(parts[0]) && NOUNS.includes(parts[1]);
}

function randomAura() {
  return Math.floor(Math.random() * 6) + 1;
}

function isValidAura(auraId) {
  const n = Number(auraId);
  return Number.isInteger(n) && n >= 1 && n <= 6;
}

function generateProfileCode() {
  return crypto.randomBytes(5).toString('hex'); // 10 characters, URL-safe
}

function initialsOf(nickname) {
  return nickname
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

module.exports = {
  ADJECTIVES,
  NOUNS,
  randomNickname,
  isValidNickname,
  randomAura,
  isValidAura,
  generateProfileCode,
  initialsOf
};
