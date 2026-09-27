const Match = require('../models/Match');
const Message = require('../models/Message');
const Notification = require('../models/Notification');

async function loadMatchForUser(matchId, userId) {
  const match = await Match.findById(matchId);
  if (!match || !match.users.some((u) => u.toString() === userId.toString())) return null;
  return match;
}

function serializeMessage(m) {
  return {
    id: m._id,
    sender: m.sender,
    type: m.type,
    text: m.text,
    durationSeconds: m.audio ? m.audio.durationSeconds : undefined,
    audioUrl: m.type === 'voice' ? `/api/messages/${m._id}/audio` : undefined,
    createdAt: m.createdAt
  };
}

exports.list = async (req, res) => {
  const match = await loadMatchForUser(req.params.matchId, req.user._id);
  if (!match) return res.status(404).json({ error: 'Match not found.' });

  const messages = await Message.find({ match: match._id }).sort({ createdAt: 1 }).limit(300);

  await Message.updateMany(
    { match: match._id, sender: { $ne: req.user._id }, readAt: null },
    { readAt: new Date() }
  );

  res.json({ messages: messages.map(serializeMessage) });
};

exports.sendText = async (req, res) => {
  const match = await loadMatchForUser(req.params.matchId, req.user._id);
  if (!match) return res.status(404).json({ error: 'Match not found.' });
  if (match.status !== 'active') return res.status(400).json({ error: 'This conversation has ended.' });

  const text = String(req.body.text || '').trim();
  if (!text) return res.status(400).json({ error: 'Message cannot be empty.' });
  if (text.length > 2000) return res.status(400).json({ error: 'Message is too long.' });

  const message = await Message.create({ match: match._id, sender: req.user._id, type: 'text', text });

  const partnerId = match.users.find((u) => u.toString() !== req.user._id.toString());
  await Notification.create({
    user: partnerId,
    type: 'message',
    text: `${req.user.nickname} sent you a message`,
    link: `/chat.html?match=${match._id}`
  });

  res.status(201).json(serializeMessage(message));
};

exports.sendVoice = async (req, res) => {
  const match = await loadMatchForUser(req.params.matchId, req.user._id);
  if (!match) return res.status(404).json({ error: 'Match not found.' });
  if (match.status !== 'active') return res.status(400).json({ error: 'This conversation has ended.' });
  if (!req.file) return res.status(400).json({ error: 'No audio was received.' });

  const duration = Number(req.body.duration) || 0;

  const message = await Message.create({
    match: match._id,
    sender: req.user._id,
    type: 'voice',
    audio: {
      data: req.file.buffer,
      contentType: req.file.mimetype,
      durationSeconds: duration
    }
  });

  const partnerId = match.users.find((u) => u.toString() !== req.user._id.toString());
  await Notification.create({
    user: partnerId,
    type: 'message',
    text: `${req.user.nickname} sent a voice message`,
    link: `/chat.html?match=${match._id}`
  });

  res.status(201).json(serializeMessage(message));
};

exports.getAudio = async (req, res) => {
  const message = await Message.findById(req.params.messageId);
  if (!message || message.type !== 'voice' || !message.audio || !message.audio.data) {
    return res.status(404).end();
  }
  const match = await loadMatchForUser(message.match, req.user._id);
  if (!match) return res.status(404).end();

  res.set('Content-Type', message.audio.contentType || 'audio/webm');
  res.set('Cache-Control', 'private, max-age=31536000, immutable');
  res.send(message.audio.data);
};
