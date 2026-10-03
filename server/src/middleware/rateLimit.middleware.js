const rateLimit = require('express-rate-limit');

const isDev = process.env.NODE_ENV !== 'production';

// Rate limiter for login: in dev generous (200), in prod 10 failed attempts per 15m.
// skipSuccessfulRequests ensures successful logins don't penalize the user.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 200 : 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      message: 'Too many login attempts. Try again in 15 minutes.',
      code: 'RATE_LIMITED',
    },
  },
});

// Max signups per IP per hour — prevents account creation spam
const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isDev ? 200 : 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      message: 'Too many accounts created from this IP. Try again later.',
      code: 'RATE_LIMITED',
    },
  },
});

module.exports = { loginLimiter, signupLimiter };
