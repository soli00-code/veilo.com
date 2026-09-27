const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema(
  {
    // Always exactly two users. Query "every match involving me" with { users: myId }.
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],

    // 'algorithm'   — created by the compatibility engine (one active at a time per user)
    // 'direct_link' — created because someone opened a shared profile link/QR and connected
    origin: { type: String, enum: ['algorithm', 'direct_link'], required: true },

    resonanceScore: { type: Number, min: 0, max: 100 },

    status: { type: String, enum: ['active', 'unmatched', 'blocked'], default: 'active' },
    endedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    endedReason: { type: String, enum: ['unmatch', 'block', 'report', 'account_deleted'] }
  },
  { timestamps: true }
);

matchSchema.index({ users: 1 });

module.exports = mongoose.model('Match', matchSchema);
