const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { createHash } = require('crypto');

const sha256 = (str) => createHash('sha256').update(str).digest('hex');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  refreshTokenHash: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});

userSchema.methods.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

userSchema.methods.compareRefreshToken = async function (token) {
  if (!this.refreshTokenHash) return false;
  return bcrypt.compare(sha256(token), this.refreshTokenHash);
};

module.exports = mongoose.model('User', userSchema);
module.exports.hashRefreshToken = async (token) => bcrypt.hash(sha256(token), 10);
