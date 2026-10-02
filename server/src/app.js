const express = require('express');
const cors = require('cors');
const { CLIENT_ORIGIN } = require('./config/env');
const { getStatus } = require('./config/db');
const errorHandler = require('./middleware/error.middleware');
const authRoutes = require('./routes/auth.routes');
const boardRoutes = require('./routes/board.routes');
const listRoutes = require('./routes/list.routes');
const cardRoutes = require('./routes/card.routes');
const linkPreviewRoutes = require('./routes/linkPreview.routes');

const app = express();

app.use(cors({
  origin: CLIENT_ORIGIN,
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Socket-Id'],
}));
app.use(express.json({ limit: '2mb' }));

// Basic security headers
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use((req, _res, next) => {
  console.log(`→ ${req.method} ${req.path}`);
  next();
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', db: getStatus() });
});

app.use('/auth', authRoutes);
app.use('/boards', boardRoutes);
app.use('/link-preview', linkPreviewRoutes);

// Nested routes — must be mounted at root so params are visible
app.use('/', listRoutes);
app.use('/', cardRoutes);

app.use((req, _res, next) => {
  const err = new Error(`Route not found: ${req.method} ${req.path}`);
  err.statusCode = 404;
  err.code = 'NOT_FOUND';
  next(err);
});

app.use(errorHandler);

module.exports = app;
