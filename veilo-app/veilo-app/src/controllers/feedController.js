const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');

function serializePost(p, viewerId) {
  return {
    id: p._id,
    author: { id: p.author._id, nickname: p.author.nickname, auraId: p.author.auraId },
    text: p.text,
    resonateCount: p.resonatedBy.length,
    resonatedByMe: p.resonatedBy.some((id) => id.toString() === viewerId.toString()),
    createdAt: p.createdAt
  };
}

exports.list = async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = 20;

  const posts = await Post.find({})
    .populate('author', 'nickname auraId')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const counts = await Comment.aggregate([
    { $match: { post: { $in: posts.map((p) => p._id) } } },
    { $group: { _id: '$post', count: { $sum: 1 } } }
  ]);
  const countMap = new Map(counts.map((c) => [c._id.toString(), c.count]));

  res.json({
    posts: posts.map((p) => ({
      ...serializePost(p, req.user._id),
      commentCount: countMap.get(p._id.toString()) || 0
    }))
  });
};

exports.create = async (req, res) => {
  const text = String(req.body.text || '').trim();
  if (!text) return res.status(400).json({ error: 'Post cannot be empty.' });
  if (text.length > 280) return res.status(400).json({ error: 'Posts are limited to 280 characters.' });

  const post = await Post.create({ author: req.user._id, text, resonatedBy: [] });
  await post.populate('author', 'nickname auraId');

  res.status(201).json({ ...serializePost(post, req.user._id), commentCount: 0 });
};

exports.resonate = async (req, res) => {
  const post = await Post.findById(req.params.postId);
  if (!post) return res.status(404).json({ error: 'Post not found.' });

  const already = post.resonatedBy.some((id) => id.toString() === req.user._id.toString());
  if (already) {
    post.resonatedBy = post.resonatedBy.filter((id) => id.toString() !== req.user._id.toString());
  } else {
    post.resonatedBy.push(req.user._id);
    if (post.author.toString() !== req.user._id.toString()) {
      await Notification.create({
        user: post.author,
        type: 'resonate',
        text: `${req.user.nickname} resonated with your post`,
        link: '/feed.html'
      });
    }
  }
  await post.save();

  res.json({ resonateCount: post.resonatedBy.length, resonatedByMe: !already });
};

exports.listComments = async (req, res) => {
  const comments = await Comment.find({ post: req.params.postId })
    .populate('author', 'nickname auraId')
    .sort({ createdAt: 1 });

  res.json({
    comments: comments.map((c) => ({
      id: c._id,
      author: { id: c.author._id, nickname: c.author.nickname, auraId: c.author.auraId },
      text: c.text,
      createdAt: c.createdAt
    }))
  });
};

exports.addComment = async (req, res) => {
  const post = await Post.findById(req.params.postId);
  if (!post) return res.status(404).json({ error: 'Post not found.' });

  const text = String(req.body.text || '').trim();
  if (!text) return res.status(400).json({ error: 'Comment cannot be empty.' });
  if (text.length > 300) return res.status(400).json({ error: 'Comment is too long.' });

  const comment = await Comment.create({ post: post._id, author: req.user._id, text });
  await comment.populate('author', 'nickname auraId');

  if (post.author.toString() !== req.user._id.toString()) {
    await Notification.create({
      user: post.author,
      type: 'comment',
      text: `${req.user.nickname} commented on your post`,
      link: '/feed.html'
    });
  }

  res.status(201).json({
    id: comment._id,
    author: { id: comment.author._id, nickname: comment.author.nickname, auraId: comment.author.auraId },
    text: comment.text,
    createdAt: comment.createdAt
  });
};
