const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');
const { JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, JWT_ACCESS_EXPIRY, JWT_REFRESH_EXPIRY } = require('../config/env');

const signAccessToken = (userId) =>
  jwt.sign({ sub: userId }, JWT_ACCESS_SECRET, { expiresIn: JWT_ACCESS_EXPIRY });

const signRefreshToken = (userId) =>
  jwt.sign({ sub: userId, jti: randomUUID() }, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRY });

const verifyAccessToken = (token) =>
  jwt.verify(token, JWT_ACCESS_SECRET);

const verifyRefreshToken = (token) =>
  jwt.verify(token, JWT_REFRESH_SECRET);

module.exports = { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken };
