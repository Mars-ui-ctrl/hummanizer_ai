import { useState, useCallback } from 'react';

/**
 * Toast notification hook.
 * Manages a queue of toast messages with auto-dismiss.
 */
export function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback(
    (message) => addToast(message, 'success'),
    [addToast]
  );
  const error = useCallback(
    (message) => addToast(message, 'error', 6000),
    [addToast]
  );
  const info = useCallback(
    (message) => addToast(message, 'info'),
    [addToast]
  );
  const warning = useCallback(
    (message) => addToast(message, 'warning'),
    [addToast]
  );

  return { toasts, addToast, removeToast, success, error, info, warning };
}
