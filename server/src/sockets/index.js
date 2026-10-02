const { Server } = require('socket.io');
const { verifyAccessToken } = require('../utils/tokens');
const { CLIENT_ORIGIN } = require('../config/env');
const Board = require('../models/Board');

let _io = null;

const init = (server) => {
  _io = new Server(server, {
    cors: { origin: CLIENT_ORIGIN, credentials: true },
  });

  _io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('UNAUTHORIZED'));
    try {
      const payload = verifyAccessToken(token);
      socket.userId = payload.sub;
      next();
    } catch {
      next(new Error('UNAUTHORIZED'));
    }
  });

  _io.on('connection', (socket) => {
    socket.on('join:board', async ({ boardId }) => {
      try {
        const board = await Board.findById(boardId);
        if (!board) return socket.emit('error', { code: 'NOT_FOUND' });
        const isMember = board.members.some((m) => m.user.toString() === socket.userId);
        if (!isMember) return socket.emit('error', { code: 'FORBIDDEN' });
        socket.join(`board:${boardId}`);
      } catch {
        socket.emit('error', { code: 'INTERNAL_ERROR' });
      }
    });
  });

  return _io;
};

const getIO = () => _io;

module.exports = { init, getIO };
