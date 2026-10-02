/**
 * seed.js  — Run from /server directory: node seed.js
 *
 * Creates:
 *  - 1 demo user (demo@boardsync.dev / Demo1234!)
 *  - 1 board "Demo Board"
 *  - 3 lists: To Do, In Progress, Done
 *  - 2–3 cards per list
 *
 * Prints login credentials when done.
 */
'use strict';

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Inline models (avoid circular deps from app.js)
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  refreshTokenHash: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});
const boardSchema = new mongoose.Schema({
  title: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ user: mongoose.Schema.Types.ObjectId, role: String }],
  createdAt: { type: Date, default: Date.now },
});
const listSchema = new mongoose.Schema({
  board: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true, index: true },
  title: { type: String, required: true },
  order: { type: Number, required: true },
});
const cardSchema = new mongoose.Schema({
  list: { type: mongoose.Schema.Types.ObjectId, ref: 'List', required: true, index: true },
  board: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true, index: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  order: { type: Number, required: true },
  version: { type: Number, default: 0 },
});

const User  = mongoose.model('User',  userSchema);
const Board = mongoose.model('Board', boardSchema);
const List  = mongoose.model('List',  listSchema);
const Card  = mongoose.model('Card',  cardSchema);

const DEMO_EMAIL    = 'demo@boardsync.dev';
const DEMO_PASSWORD = 'Demo1234!';

async function seed() {
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.error('❌  MONGO_URI not set in .env');
    process.exit(1);
  }

  console.log('🔗  Connecting to MongoDB…');
  await mongoose.connect(MONGO_URI);
  console.log('✅  Connected\n');

  // ── Clean up previous seed data ─────────────────────────────────────────────
  const existing = await User.findOne({ email: DEMO_EMAIL });
  if (existing) {
    const boards = await Board.find({ owner: existing._id });
    for (const b of boards) {
      await Card.deleteMany({ board: b._id });
      await List.deleteMany({ board: b._id });
    }
    await Board.deleteMany({ owner: existing._id });
    await User.deleteOne({ _id: existing._id });
    console.log('🗑  Cleaned up previous seed data\n');
  }

  // ── User ─────────────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const user = await User.create({ email: DEMO_EMAIL, passwordHash });
  console.log(`👤  Created user: ${DEMO_EMAIL}`);

  // ── Board ─────────────────────────────────────────────────────────────────────
  const board = await Board.create({
    title: 'Demo Board',
    owner: user._id,
    members: [{ user: user._id, role: 'owner' }],
  });
  console.log(`📋  Created board: "${board.title}"`);

  // ── Lists ─────────────────────────────────────────────────────────────────────
  const listDefs = [
    { title: 'To Do',       order: 0 },
    { title: 'In Progress', order: 1 },
    { title: 'Done',        order: 2 },
  ];
  const lists = await List.insertMany(
    listDefs.map((l) => ({ ...l, board: board._id }))
  );
  console.log(`📂  Created ${lists.length} lists`);

  // ── Cards ─────────────────────────────────────────────────────────────────────
  const cardDefs = [
    // To Do
    { list: lists[0]._id, board: board._id, title: 'Set up project repository',    description: 'Init git, add .gitignore', order: 0 },
    { list: lists[0]._id, board: board._id, title: 'Design database schema',       description: 'User, Board, List, Card',  order: 1 },
    { list: lists[0]._id, board: board._id, title: 'Write API design document',    description: 'REST + WebSocket events',  order: 2 },
    // In Progress
    { list: lists[1]._id, board: board._id, title: 'Implement auth endpoints',     description: 'Signup, login, refresh, logout', order: 0 },
    { list: lists[1]._id, board: board._id, title: 'Build Kanban frontend',        description: 'React + drag-and-drop',    order: 1 },
    // Done
    { list: lists[2]._id, board: board._id, title: 'Project idea & stack decision', description: '',                        order: 0 },
    { list: lists[2]._id, board: board._id, title: 'Scaffold monorepo',            description: 'server/ + client/ dirs',  order: 1 },
  ];
  const cardCount = await Card.insertMany(cardDefs);
  console.log(`🃏  Created ${cardCount.length} cards\n`);

  // ── Done ─────────────────────────────────────────────────────────────────────
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀  Seed complete! Demo credentials:');
  console.log(`    Email:    ${DEMO_EMAIL}`);
  console.log(`    Password: ${DEMO_PASSWORD}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌  Seed failed:', err);
  process.exit(1);
});
