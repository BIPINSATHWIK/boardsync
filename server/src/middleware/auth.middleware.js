const { verifyAccessToken } = require('../utils/tokens');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const err = new Error('No token provided');
    err.statusCode = 401;
    err.code = 'UNAUTHORIZED';
    return next(err);
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub };
    next();
  } catch {
    const err = new Error('Invalid or expired token');
    err.statusCode = 401;
    err.code = 'UNAUTHORIZED';
    next(err);
  }
};

module.exports = { authenticate };
