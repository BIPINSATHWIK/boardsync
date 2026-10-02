const rateLimit = require('express-rate-limit');

// 5 failed login attempts per IP per 15 min
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      message: 'Too many login attempts. Try again in 15 minutes.',
      code: 'RATE_LIMITED',
    },
  },
});

// Max 5 signups per IP per hour — prevents account creation spam
const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
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
