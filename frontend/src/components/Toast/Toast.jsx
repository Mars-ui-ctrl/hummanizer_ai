import './Toast.css';

const ICONS = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};

function Toast({ toasts, removeToast }) {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast--${toast.type}`}>
          <span className="toast-icon">{ICONS[toast.type]}</span>
          <span className="toast-message">{toast.message}</span>
          <button
            className="toast-close"
            onClick={() => removeToast(toast.id)}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

export default Toast;
