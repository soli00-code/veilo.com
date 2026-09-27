const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

function age(dateOfBirth) {
  return Math.floor((Date.now() - new Date(dateOfBirth).getTime()) / MS_PER_YEAR);
}

function genderSatisfiesPreference(preference, actualGender) {
  if (preference === 'everyone') return true;
  if (preference === 'men') return actualGender === 'man';
  if (preference === 'women') return actualGender === 'woman';
  if (preference === 'nonbinary') return actualGender === 'nonbinary';
  return false;
}

// Both people have to be within what the other is looking for.
function mutualGenderMatch(a, b) {
  return (
    genderSatisfiesPreference(a.seekingGender, b.gender) &&
    genderSatisfiesPreference(b.seekingGender, a.gender)
  );
}

// Both people have to fall inside each other's stated age range.
function mutualAgeMatch(a, b) {
  const ageA = age(a.dateOfBirth);
  const ageB = age(b.dateOfBirth);
  return (
    ageA >= b.ageRangeMin && ageA <= b.ageRangeMax &&
    ageB >= a.ageRangeMin && ageB <= a.ageRangeMax
  );
}

// Histogram-intersection similarity (0-100) between two people's 24-hour
// activity patterns. This is what "match people whose active times overlap"
// (e.g. two night owls) actually runs on. New accounts with too little
// activity data yet get a neutral score instead of being penalized.
function activityOverlapScore(a, b) {
  const bucketsA = a.activityBuckets || [];
  const bucketsB = b.activityBuckets || [];
  const totalA = bucketsA.reduce((sum, v) => sum + v, 0);
  const totalB = bucketsB.reduce((sum, v) => sum + v, 0);

  const MIN_SAMPLES = 5;
  if (totalA < MIN_SAMPLES || totalB < MIN_SAMPLES) return 50;

  let overlap = 0;
  for (let hour = 0; hour < 24; hour++) {
    const shareA = (bucketsA[hour] || 0) / totalA;
    const shareB = (bucketsB[hour] || 0) / totalB;
    overlap += Math.min(shareA, shareB);
  }
  return Math.round(overlap * 100);
}

function quizSimilarityCount(a, b) {
  const qa = a.quizAnswers || {};
  const qb = b.quizAnswers || {};
  let matches = 0;
  ['q1', 'q2', 'q3', 'q4'].forEach((key) => {
    if (qa[key] && qa[key] === qb[key]) matches++;
  });
  return matches; // 0-4
}

function sharedInterestCount(a, b) {
  const bSet = new Set((b.interests || []).map((s) => s.toLowerCase().trim()));
  return (a.interests || []).filter((i) => bSet.has(i.toLowerCase().trim())).length;
}

// Weighted 0-100 resonance score:
//   10  base
//   +40 max — quiz-answer similarity (4 questions x 10)
//   +15 max — shared interests (3 per shared interest, capped)
//   +10     — matching relationship intent
//   +25 max — activity-time overlap
function computeResonance(a, b) {
  const quizMatches = quizSimilarityCount(a, b);
  const interestCount = sharedInterestCount(a, b);
  const intentMatch = a.intent === b.intent ? 1 : 0;
  const activityScore = activityOverlapScore(a, b);

  let score = 10;
  score += quizMatches * 10;
  score += Math.min(interestCount * 3, 15);
  score += intentMatch * 10;
  score += activityScore * 0.25;

  return Math.max(30, Math.min(99, Math.round(score)));
}

module.exports = {
  age,
  mutualGenderMatch,
  mutualAgeMatch,
  activityOverlapScore,
  computeResonance
};
