const Board = require('../models/Board');
const List = require('../models/List');
const Card = require('../models/Card');
const { getIO } = require('../sockets');

const createBoard = async (req, res, next) => {
  try {
    const board = await Board.create({
      title: req.body.title,
      owner: req.user.id,
      members: [{ user: req.user.id, role: 'owner' }],
    });
    res.status(201).json({ board });
  } catch (err) {
    next(err);
  }
};

const getBoards = async (req, res, next) => {
  try {
    const boards = await Board.find({ 'members.user': req.user.id });
    res.json({ boards });
  } catch (err) {
    next(err);
  }
};

const getBoard = async (req, res, next) => {
  try {
    const lists = await List.find({ board: req.board._id }).sort({ order: 1 });
    const cards = await Card.find({ board: req.board._id }).sort({ order: 1 });
    res.json({ board: req.board, lists, cards });
  } catch (err) {
    next(err);
  }
};

const updateBoard = async (req, res, next) => {
  try {
    req.board.title = req.body.title;
    await req.board.save();
    res.json({ board: req.board });
  } catch (err) {
    next(err);
  }
};

const deleteBoard = async (req, res, next) => {
  try {
    const boardId = req.board._id;
    await Card.deleteMany({ board: boardId });
    await List.deleteMany({ board: boardId });
    await Board.findByIdAndDelete(boardId);
    res.json({ message: 'Board deleted' });
  } catch (err) {
    next(err);
  }
};

const addMember = async (req, res, next) => {
  try {
    const User = require('../models/User');
    const { email, role } = req.body;

    const userToAdd = await User.findOne({ email });
    if (!userToAdd) {
      const err = new Error('User not found');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      return next(err);
    }

    const alreadyMember = req.board.members.find(
      (m) => m.user.toString() === userToAdd._id.toString()
    );
    if (alreadyMember) {
      const err = new Error('User is already a member of this board');
      err.statusCode = 409;
      err.code = 'ALREADY_MEMBER';
      return next(err);
    }

    req.board.members.push({ user: userToAdd._id, role });
    await req.board.save();
    res.status(201).json({ board: req.board });
  } catch (err) {
    next(err);
  }
};

module.exports = { createBoard, getBoards, getBoard, updateBoard, deleteBoard, addMember };
