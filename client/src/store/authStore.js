import { create } from 'zustand';
import { post, setTokens, clearTokens, setOnUnauthorized } from '../api/client';

const useAuthStore = create((set) => {
  // Listen for unauthorized/session expired events from the API client
  setOnUnauthorized(() => {
    set({ user: null, error: null, fieldErrors: {} });
  });

  return {
    user: (() => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          localStorage.removeItem('user');
          return null;
        }
        return JSON.parse(localStorage.getItem('user'));
      } catch {
        localStorage.removeItem('user');
        return null;
      }
    })(),
  isLoading: false,
  error: null,
  // Field-level errors from server validation (e.g. { email: '...', password: '...' })
  fieldErrors: {},

  signup: async (email, password) => {
    set({ isLoading: true, error: null, fieldErrors: {} });
    try {
      const data = await post('/auth/signup', { email, password });
      setTokens(data.accessToken, data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      set({ user: data.user, isLoading: false });
      return true;
    } catch (err) {
      // Map email-taken → inline field error instead of generic banner
      const fieldErrors =
        err.code === 'EMAIL_TAKEN'
          ? { email: 'This email is already registered. Try signing in.' }
          : err.fields || {};
      // Show a banner message only when there are no field-level errors
      const bannerError = Object.keys(fieldErrors).length === 0 ? err.message : null;
      set({ error: bannerError, fieldErrors, isLoading: false });
      return false;
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null, fieldErrors: {} });
    try {
      const data = await post('/auth/login', { email, password });
      setTokens(data.accessToken, data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      set({ user: data.user, isLoading: false });
      return true;
    } catch (err) {
      set({ error: err.message, fieldErrors: err.fields || {}, isLoading: false });
      return false;
    }
  },

  logout: async () => {
    try { await post('/auth/logout', {}); } catch { /* best effort */ }
    clearTokens();
    localStorage.removeItem('user');
    set({ user: null, error: null, fieldErrors: {} });
  },

  clearError: () => set({ error: null, fieldErrors: {} }),
  };
});

export default useAuthStore;
