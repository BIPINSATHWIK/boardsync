const List = require('../models/List');
const Card = require('../models/Card');
const { getIO } = require('../sockets');

// Emit to all board members EXCEPT the requester's socket to avoid duplicates
const emit = (req, event, payload) => {
  const io = getIO();
  if (!io) return;
  const room = `board:${req.board._id}`;
  const senderSocketId = req.headers['x-socket-id'];
  if (senderSocketId) {
    io.to(room).except(senderSocketId).emit(event, payload);
  } else {
    io.to(room).emit(event, payload);
  }
};

const createList = async (req, res, next) => {
  try {
    const list = await List.create({
      board: req.board._id,
      title: req.body.title,
      order: req.body.order,
    });
    emit(req, 'list:created', { list });
    res.status(201).json({ list });
  } catch (err) {
    next(err);
  }
};

const updateList = async (req, res, next) => {
  try {
    const list = await List.findById(req.params.listId);
    if (!list) {
      const err = new Error('List not found');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      return next(err);
    }
    if (req.body.title !== undefined) list.title = req.body.title;
    if (req.body.order !== undefined) list.order = req.body.order;
    await list.save();
    emit(req, 'list:updated', { list });
    res.json({ list });
  } catch (err) {
    next(err);
  }
};

const deleteList = async (req, res, next) => {
  try {
    const listId = req.params.listId;
    await Card.deleteMany({ list: listId });
    await List.findByIdAndDelete(listId);
    emit(req, 'list:deleted', { listId });
    res.json({ message: 'List deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { createList, updateList, deleteList };
