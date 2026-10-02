import { useState, useCallback, useEffect } from 'react';

let _addToast = null;

export function useToast() {
  return _addToast;
}

let idCounter = 0;

export default function Toast() {
  const [toasts, setToasts] = useState([]);

  const add = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++idCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => remove(id), duration);
    }
    return id;
  }, []);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    _addToast = add;
    return () => { _addToast = null; };
  }, [add]);

  const icons = { info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌' };

  return (
    <div className="toast-container" role="region" aria-label="Notifications">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`} role="alert">
          <span className="toast-icon">{icons[t.type] ?? 'ℹ️'}</span>
          <span>{t.message}</span>
          <button
            className="toast-close"
            onClick={() => remove(t.id)}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

// Helper to add toast from outside React
export const toast = {
  info: (msg, dur) => _addToast?.(msg, 'info', dur),
  success: (msg, dur) => _addToast?.(msg, 'success', dur),
  warning: (msg, dur) => _addToast?.(msg, 'warning', dur),
  error: (msg, dur) => _addToast?.(msg, 'error', dur),
};
