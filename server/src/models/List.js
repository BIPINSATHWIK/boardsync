const mongoose = require('mongoose');

const listSchema = new mongoose.Schema({
  board: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true, index: true },
  title: { type: String, required: true, trim: true },
  order: { type: Number, required: true },
});

module.exports = mongoose.model('List', listSchema);
