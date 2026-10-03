const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getAccessToken = () => localStorage.getItem('accessToken');
const getRefreshToken = () => localStorage.getItem('refreshToken');

// Tracks the current socket ID so API calls can tell the server not to echo
// events back to this socket (prevents duplicate card/list creation in UI).
let _socketId = null;
export const setSocketId = (id) => { _socketId = id; };
export const getSocketId = () => _socketId;

let _onUnauthorized = null;
export const setOnUnauthorized = (cb) => { _onUnauthorized = cb; };

export const setTokens = (at, rt) => {
  if (at) localStorage.setItem('accessToken', at);
  if (rt) localStorage.setItem('refreshToken', rt);
};

export const clearTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};

const handleAuthFailure = () => {
  clearTokens();
  if (_onUnauthorized) {
    _onUnauthorized();
  }
  if (
    typeof window !== 'undefined' &&
    window.location.pathname !== '/login' &&
    window.location.pathname !== '/signup'
  ) {
    window.location.href = '/login';
  }
};

const rawFetch = async (method, path, body, token) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (_socketId) headers['X-Socket-Id'] = _socketId;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
};

let _refreshPromise = null;

const doRefreshToken = async () => {
  if (!_refreshPromise) {
    _refreshPromise = (async () => {
      const rt = getRefreshToken();
      if (!rt) return null;
      try {
        const refresh = await rawFetch('POST', '/auth/refresh', { refreshToken: rt });
        if (refresh.status === 200 && refresh.data?.accessToken) {
          setTokens(refresh.data.accessToken, refresh.data.refreshToken);
          return refresh.data.accessToken;
        }
      } catch {
        // network or server error
      }
      return null;
    })().finally(() => {
      _refreshPromise = null;
    });
  }
  return _refreshPromise;
};

const request = async (method, path, body) => {
  let token = getAccessToken();
  let { status, data } = await rawFetch(method, path, body, token);

  const isAuthEndpoint = path.startsWith('/auth/');

  if (status === 401 && !isAuthEndpoint) {
    const newToken = await doRefreshToken();
    if (newToken) {
      token = newToken;
      const retry = await rawFetch(method, path, body, token);
      status = retry.status;
      data = retry.data;
    } else {
      handleAuthFailure();
      throw new Error('Session expired');
    }
  }

  if (status >= 400) {
    const fields = data?.error?.fields;
    // Surface the first field-level error as the main message so the UI can show it
    const firstFieldMsg = fields ? Object.values(fields)[0] : null;
    const err = new Error(firstFieldMsg || data?.error?.message || 'Request failed');
    err.status = status;
    err.code = data?.error?.code;
    err.fields = fields;
    err.current = data?.current;
    throw err;
  }

  return data;
};

export const get = (path) => request('GET', path, undefined);
export const post = (path, body) => request('POST', path, body);
export const patch = (path, body) => request('PATCH', path, body);
export const del = (path) => request('DELETE', path, undefined);
