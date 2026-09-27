const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reportedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    match: { type: mongoose.Schema.Types.ObjectId, ref: 'Match' },
    reason: {
      type: String,
      enum: ['photos_or_contact', 'harassment', 'fake_account', 'other'],
      required: true
    },
    details: { type: String, maxlength: 1000 },
    status: { type: String, enum: ['pending', 'reviewed'], default: 'pending' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Report', reportSchema);
