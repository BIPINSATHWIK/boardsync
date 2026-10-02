const bcrypt = require('bcrypt');
const User = require('../models/User');
const { hashRefreshToken } = require('../models/User');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/tokens');

const signup = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      const err = new Error('Email already in use');
      err.statusCode = 409;
      err.code = 'EMAIL_TAKEN';
      return next(err);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ email, passwordHash });

    const accessToken = signAccessToken(user._id);
    const refreshToken = signRefreshToken(user._id);
    await User.findByIdAndUpdate(user._id, { refreshTokenHash: await hashRefreshToken(refreshToken) });

    res.status(201).json({
      accessToken,
      refreshToken,
      user: { id: user._id, email: user.email },
    });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      const err = new Error('Invalid email or password');
      err.statusCode = 401;
      err.code = 'INVALID_CREDENTIALS';
      return next(err);
    }

    const accessToken = signAccessToken(user._id);
    const refreshToken = signRefreshToken(user._id);
    await User.findByIdAndUpdate(user._id, { refreshTokenHash: await hashRefreshToken(refreshToken) });

    res.json({
      accessToken,
      refreshToken,
      user: { id: user._id, email: user.email },
    });
  } catch (err) {
    next(err);
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      const err = new Error('Invalid or expired refresh token');
      err.statusCode = 401;
      err.code = 'UNAUTHORIZED';
      return next(err);
    }

    const user = await User.findById(payload.sub);
    if (!user || !(await user.compareRefreshToken(refreshToken))) {
      const err = new Error('Refresh token has been rotated or revoked');
      err.statusCode = 401;
      err.code = 'UNAUTHORIZED';
      return next(err);
    }

    const newAccessToken = signAccessToken(user._id);
    const newRefreshToken = signRefreshToken(user._id);
    await User.findByIdAndUpdate(user._id, { refreshTokenHash: await hashRefreshToken(newRefreshToken) });

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { refreshTokenHash: null });
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { signup, login, refresh, logout };
