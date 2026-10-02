const Board = require('../models/Board');
const List = require('../models/List');
const Card = require('../models/Card');

const ROLE_RANK = { viewer: 0, editor: 1, owner: 2 };

const requireBoardMembership = (minRole = 'viewer') => async (req, res, next) => {
  try {
    let board;

    if (req.params.boardId) {
      board = await Board.findById(req.params.boardId);
    } else if (req.params.listId) {
      const list = await List.findById(req.params.listId);
      if (!list) {
        const err = new Error('List not found');
        err.statusCode = 404;
        err.code = 'NOT_FOUND';
        return next(err);
      }
      board = await Board.findById(list.board);
    } else if (req.params.cardId) {
      const card = await Card.findById(req.params.cardId);
      if (!card) {
        const err = new Error('Card not found');
        err.statusCode = 404;
        err.code = 'NOT_FOUND';
        return next(err);
      }
      board = await Board.findById(card.board);
    }

    if (!board) {
      const err = new Error('Board not found');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      return next(err);
    }

    const member = board.members.find(
      (m) => m.user.toString() === req.user.id
    );

    if (!member) {
      const err = new Error('You are not a member of this board');
      err.statusCode = 403;
      err.code = 'FORBIDDEN';
      return next(err);
    }

    if (ROLE_RANK[member.role] < ROLE_RANK[minRole]) {
      const err = new Error(`Required role: ${minRole}. Your role: ${member.role}`);
      err.statusCode = 403;
      err.code = 'FORBIDDEN';
      return next(err);
    }

    req.board = board;
    req.memberRole = member.role;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { requireBoardMembership };
