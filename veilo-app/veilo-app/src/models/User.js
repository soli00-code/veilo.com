const mongoose = require('mongoose');

const promptSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, maxlength: 120 },
    answer: { type: String, required: true, maxlength: 300 }
  },
  { _id: false }
);

const notificationPrefsSchema = new mongoose.Schema(
  {
    newMatches: { type: Boolean, default: true },
    newMessages: { type: Boolean, default: true },
    feedActivity: { type: Boolean, default: false }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },

    // Real identity — used only for login, age, and matching filters.
    // Nothing below this line is ever exposed to other users.
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, enum: ['man', 'woman', 'nonbinary'], required: true },
    seekingGender: { type: String, enum: ['men', 'women', 'everyone', 'nonbinary'], required: true },
    intent: { type: String, enum: ['casual', 'serious', 'unsure'], default: 'unsure' },
    ageRangeMin: { type: Number, default: 18, min: 18 },
    ageRangeMax: { type: Number, default: 99, min: 18 },

    // Anonymous public identity — this is what every other user sees.
    nickname: { type: String, required: true },
    auraId: { type: Number, min: 1, max: 6, required: true },

    // Unique code used to build this user's shareable profile link/QR (/p/<profileCode>).
    // Regenerating it invalidates every link and QR image shared before.
    profileCode: { type: String, required: true, unique: true },

    bio: { type: String, default: '', maxlength: 500 },
    interests: [{ type: String, maxlength: 40 }],
    prompts: [promptSchema],
    quizAnswers: {
      q1: String,
      q2: String,
      q3: String,
      q4: String
    },

    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // Used for "active time" matching: a rolling count of which UTC hours
    // this person tends to use the app in. See src/utils/matching.js.
    activityBuckets: { type: [Number], default: () => Array(24).fill(0) },
    lastActiveAt: { type: Date, default: Date.now },

    notificationPrefs: { type: notificationPrefsSchema, default: () => ({}) }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
