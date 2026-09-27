require('dotenv').config();

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

const connectDB = require('./src/config/db');

const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const matchRoutes = require('./src/routes/matchRoutes');
const messageRoutes = require('./src/routes/messageRoutes');
const feedRoutes = require('./src/routes/feedRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const safetyRoutes = require('./src/routes/safetyRoutes');
const profileShareRoutes = require('./src/routes/profileShareRoutes');

const app = express();

app.set('trust proxy', 1); // needed behind Render/Railway/Heroku-style reverse proxies

// Helmet's default CSP is built for pages with no inline scripts/styles. Ours has
// both (see public/*.html), so we relax just those two directives rather than
// turning CSP off entirely. Loosen further only if you add more external assets.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'script-src': ["'self'", "'unsafe-inline'"],
        'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        'font-src': ["'self'", 'https://fonts.gstatic.com'],
        'img-src': ["'self'", 'data:']
      }
    }
  })
);
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

const allowedOrigin = process.env.ALLOWED_ORIGIN || 'http://localhost:3000';
app.use(cors({ origin: allowedOrigin, credentials: true }));

app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ---- API routes ----
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/match', matchRoutes);
app.use('/api', messageRoutes); // exposes /api/matches/:id/messages* and /api/messages/:id/audio
app.use('/api/feed', feedRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/safety', safetyRoutes);
app.use('/api/profile', profileShareRoutes);

// ---- Static frontend ----
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));

// Pretty shareable-profile URLs: /p/<code> serves the SPA-ish viewer page,
// which reads the code from the URL itself and calls the API.
app.get('/p/:code', (req, res) => {
  res.sendFile(path.join(publicDir, 'profile-view.html'));
});

// ---- 404s ----
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found.' });
});
app.use((req, res) => {
  res.status(404).sendFile(path.join(publicDir, 'index.html'));
});

// ---- Central error handler ----
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  if (err && err.name === 'MulterError' && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'That voice message is too long.' });
  }
  const status = err.status || 500;
  res.status(status).json({
    error: process.env.NODE_ENV === 'production' ? 'Something went wrong.' : err.message
  });
});

const PORT = process.env.PORT || 3000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Veilo is running on port ${PORT}`);
      console.log(`Public URL: ${process.env.PUBLIC_BASE_URL || `http://localhost:${PORT}`}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  });
