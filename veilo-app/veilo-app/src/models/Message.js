const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    match: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    type: { type: String, enum: ['text', 'voice'], required: true },

    text: { type: String, maxlength: 2000 },

    // Voice notes are stored as binary data directly in MongoDB (not on local disk).
    // This keeps the app stateless and easy to host anywhere, including platforms with
    // an ephemeral filesystem — see HOSTING.md for the tradeoffs of this choice.
    audio: {
      data: Buffer,
      contentType: String,
      durationSeconds: Number
    },

    readAt: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);
