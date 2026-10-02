import { io } from 'socket.io-client';
import useBoardStore from './boardStore';
import { setSocketId } from '../api/client';

const SOCKET_URL = 'http://localhost:5000';

let socket = null;
let currentBoardId = null;

export const connectSocket = (accessToken) => {
  if (socket && socket.connected) return;

  socket = io(SOCKET_URL, {
    auth: { token: accessToken },
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('[Socket] connected', socket.id);
    // Register socket ID with the API client so we can exclude self from broadcasts
    setSocketId(socket.id);
    // Rejoin board room after reconnect
    if (currentBoardId) {
      socket.emit('join:board', { boardId: currentBoardId });
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] disconnected', reason);
    setSocketId(null);
  });

  // Card events
  socket.on('card:created', (payload) => {
    useBoardStore.getState().applySocketEvent('card:created', payload);
  });
  socket.on('card:updated', (payload) => {
    useBoardStore.getState().applySocketEvent('card:updated', payload);
  });
  socket.on('card:deleted', (payload) => {
    useBoardStore.getState().applySocketEvent('card:deleted', payload);
  });

  // List events
  socket.on('list:created', (payload) => {
    useBoardStore.getState().applySocketEvent('list:created', payload);
  });
  socket.on('list:updated', (payload) => {
    useBoardStore.getState().applySocketEvent('list:updated', payload);
  });
  socket.on('list:deleted', (payload) => {
    useBoardStore.getState().applySocketEvent('list:deleted', payload);
  });

  socket.on('error', (data) => {
    console.warn('[Socket] error', data);
  });
};

export const joinBoard = (boardId) => {
  currentBoardId = boardId;
  if (socket && socket.connected) {
    socket.emit('join:board', { boardId });
  }
};

export const leaveBoard = () => {
  currentBoardId = null;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  currentBoardId = null;
  setSocketId(null);
};
