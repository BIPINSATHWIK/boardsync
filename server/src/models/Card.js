const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
  list: { type: mongoose.Schema.Types.ObjectId, ref: 'List', required: true, index: true },
  board: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true, index: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  url: { type: String, default: '' },
  linkPreview: {
    title: String,
    description: String,
    image: String,
    siteName: String,
    favicon: String,
  },
  order: { type: Number, required: true },
  version: { type: Number, default: 0 },
});

module.exports = mongoose.model('Card', cardSchema);
