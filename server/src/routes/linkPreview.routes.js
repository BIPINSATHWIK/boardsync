const { Router } = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { getLinkPreview } = require('../controllers/linkPreview.controller');
const rateLimit = require('express-rate-limit');

const router = Router();

// Rate-limit preview fetches to prevent abuse
const previewLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Too many preview requests. Slow down.', code: 'RATE_LIMITED' } },
});

router.get('/', authenticate, previewLimiter, getLinkPreview);

module.exports = router;
