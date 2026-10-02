import { create } from 'zustand';
import { get, post, patch, del } from '../api/client';

const useBoardStore = create((set, getState) => ({
  boards: [],
  currentBoard: null,
  lists: [],
  cards: [],
  isLoadingBoards: false,
  isLoadingBoard: false,
  error: null,
  conflictCard: null, // { cardId, message } – shown as toast

  // ── Boards list ──────────────────────────────────────────────────────────────
  fetchBoards: async () => {
    set({ isLoadingBoards: true, error: null });
    try {
      const data = await get('/boards');
      set({ boards: data.boards, isLoadingBoards: false });
    } catch (err) {
      set({ error: err.message, isLoadingBoards: false });
    }
  },

  createBoard: async (title) => {
    try {
      const data = await post('/boards', { title });
      set((s) => ({ boards: [...s.boards, data.board] }));
      return data.board;
    } catch (err) {
      set({ error: err.message });
      return null;
    }
  },

  deleteBoard: async (boardId) => {
    try {
      await del(`/boards/${boardId}`);
      set((s) => ({ boards: s.boards.filter((b) => b._id !== boardId) }));
    } catch (err) {
      set({ error: err.message });
    }
  },

  // ── Board detail ─────────────────────────────────────────────────────────────
  fetchBoard: async (boardId) => {
    set({ isLoadingBoard: true, error: null, currentBoard: null, lists: [], cards: [] });
    try {
      const data = await get(`/boards/${boardId}`);
      set({ currentBoard: data.board, lists: data.lists, cards: data.cards, isLoadingBoard: false });
    } catch (err) {
      set({ error: err.message, isLoadingBoard: false });
    }
  },

  addMember: async (boardId, email, role) => {
    try {
      const data = await post(`/boards/${boardId}/members`, { email, role });
      set({ currentBoard: data.board });
      return { ok: true };
    } catch (err) {
      return { ok: false, message: err.message };
    }
  },

  // ── Lists ────────────────────────────────────────────────────────────────────
  createList: async (boardId, title) => {
    const { lists } = getState();
    const order = lists.length;
    try {
      const data = await post(`/boards/${boardId}/lists`, { title, order });
      set((s) => ({ lists: [...s.lists, data.list] }));
      return data.list;
    } catch (err) {
      set({ error: err.message });
      return null;
    }
  },

  updateList: async (listId, payload) => {
    try {
      const data = await patch(`/lists/${listId}`, payload);
      set((s) => ({ lists: s.lists.map((l) => l._id === listId ? data.list : l) }));
    } catch (err) {
      set({ error: err.message });
    }
  },

  deleteList: async (listId) => {
    try {
      await del(`/lists/${listId}`);
      set((s) => ({
        lists: s.lists.filter((l) => l._id !== listId),
        cards: s.cards.filter((c) => c.list !== listId),
      }));
    } catch (err) {
      set({ error: err.message });
    }
  },

  // ── Cards ────────────────────────────────────────────────────────────────────
  createCard: async (listId, title, description = '', url = '') => {
    const { cards } = getState();
    const order = cards.filter((c) => c.list === listId).length;
    try {
      const data = await post(`/lists/${listId}/cards`, { title, description, order, url });
      set((s) => ({ cards: [...s.cards, data.card] }));
      return data.card;
    } catch (err) {
      set({ error: err.message });
      return null;
    }
  },

  // Optimistic drag-and-drop move; rolls back on 409
  moveCard: async (cardId, destinationListId, newOrder, currentVersion) => {
    const { cards } = getState();
    const original = cards.find((c) => c._id === cardId);
    if (!original) return;

    // Optimistic update
    set((s) => ({
      cards: s.cards.map((c) =>
        c._id === cardId ? { ...c, list: destinationListId, order: newOrder } : c
      ),
    }));

    try {
      const data = await patch(`/cards/${cardId}`, {
        version: currentVersion,
        list: destinationListId,
        order: newOrder,
      });
      // Reconcile with server version (version incremented)
      set((s) => ({
        cards: s.cards.map((c) => c._id === cardId ? data.card : c),
      }));
    } catch (err) {
      if (err.status === 409 && err.current) {
        // Roll back to server's authoritative state
        set((s) => ({
          cards: s.cards.map((c) => c._id === cardId ? err.current : c),
          conflictCard: { cardId, message: 'Someone else moved this card — rolled back.' },
        }));
      } else {
        // Roll back optimistic update
        set((s) => ({
          cards: s.cards.map((c) => c._id === cardId ? original : c),
          error: err.message,
        }));
      }
    }
  },

  updateCard: async (cardId, payload) => {
    try {
      // Strip undefined values — JSON.stringify drops them anyway, but this makes
      // intent explicit and prevents accidental Zod refine failures
      const cleanPayload = Object.fromEntries(
        Object.entries(payload).filter(([, v]) => v !== undefined)
      );
      const data = await patch(`/cards/${cardId}`, cleanPayload);
      set((s) => ({ cards: s.cards.map((c) => c._id === cardId ? data.card : c) }));
      return { ok: true };
    } catch (err) {
      if (err.status === 409 && err.current) {
        set((s) => ({
          cards: s.cards.map((c) => c._id === cardId ? err.current : c),
          conflictCard: { cardId, message: 'Card was modified by someone else — rolled back.' },
        }));
      }
      return { ok: false, message: err.message };
    }
  },

  deleteCard: async (cardId) => {
    try {
      await del(`/cards/${cardId}`);
      set((s) => ({ cards: s.cards.filter((c) => c._id !== cardId) }));
    } catch (err) {
      set({ error: err.message });
    }
  },

  // ── Socket-driven state updates (called by socketStore) ─────────────────────
  applySocketEvent: (event, payload) => {
    set((s) => {
      switch (event) {
        case 'card:created':
          // Avoid duplicate if this client already added it
          if (s.cards.find((c) => c._id === payload.card._id)) return {};
          return { cards: [...s.cards, payload.card] };

        case 'card:updated':
          return { cards: s.cards.map((c) => c._id === payload.card._id ? payload.card : c) };

        case 'card:deleted':
          return { cards: s.cards.filter((c) => c._id !== payload.cardId) };

        case 'list:created':
          if (s.lists.find((l) => l._id === payload.list._id)) return {};
          return { lists: [...s.lists, payload.list] };

        case 'list:updated':
          return { lists: s.lists.map((l) => l._id === payload.list._id ? payload.list : l) };

        case 'list:deleted':
          return {
            lists: s.lists.filter((l) => l._id !== payload.listId),
            cards: s.cards.filter((c) => c.list !== payload.listId),
          };

        default:
          return {};
      }
    });
  },

  clearConflict: () => set({ conflictCard: null }),
  clearError: () => set({ error: null }),
  clearBoard: () => set({ currentBoard: null, lists: [], cards: [] }),
}));

export default useBoardStore;
