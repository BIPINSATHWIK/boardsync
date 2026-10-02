const Card = require('../models/Card');
const { getIO } = require('../sockets');

// Emit to all board members EXCEPT the requester's own socket (they already have
// the update from the HTTP response, so sending via socket would duplicate it).
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

const createCard = async (req, res, next) => {
  try {
    const card = await Card.create({
      list: req.params.listId,
      board: req.board._id,
      title: req.body.title,
      description: req.body.description || '',
      url: req.body.url || '',
      linkPreview: req.body.linkPreview || undefined,
      order: req.body.order,
    });
    emit(req, 'card:created', { card });
    res.status(201).json({ card });
  } catch (err) {
    next(err);
  }
};

const updateCard = async (req, res, next) => {
  try {
    const { version, title, description, order, list, url, linkPreview } = req.body;

    const card = await Card.findOneAndUpdate(
      { _id: req.params.cardId, version },
      {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(order !== undefined && { order }),
        ...(list !== undefined && { list }),
        ...(url !== undefined && { url }),
        ...(linkPreview !== undefined && { linkPreview }),
        $inc: { version: 1 },
      },
      { new: true }
    );

    if (!card) {
      const current = await Card.findById(req.params.cardId);
      if (!current) {
        const err = new Error('Card not found');
        err.statusCode = 404;
        err.code = 'NOT_FOUND';
        return next(err);
      }
      return res.status(409).json({
        error: { message: 'Card was modified by someone else', code: 'CONFLICT' },
        current,
      });
    }

    emit(req, 'card:updated', { card });
    res.json({ card });
  } catch (err) {
    next(err);
  }
};

const deleteCard = async (req, res, next) => {
  try {
    const cardId = req.params.cardId;
    await Card.findByIdAndDelete(cardId);
    emit(req, 'card:deleted', { cardId });
    res.json({ message: 'Card deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { createCard, updateCard, deleteCard };
