import './LoadingOverlay.css';

function LoadingOverlay({ message = 'Rewriting your text...', subtitle }) {
  return (
    <div className="loading-overlay">
      <div className="loading-orb-container">
        <div className="loading-orb" />
        <div className="loading-orb" />
        <div className="loading-orb" />
        <div className="loading-orb-center" />
      </div>
      <div className="loading-text">
        <p className="loading-title">{message}</p>
        {subtitle && <p className="loading-subtitle">{subtitle}</p>}
      </div>
      <div className="loading-dots">
        <span className="loading-dot" />
        <span className="loading-dot" />
        <span className="loading-dot" />
      </div>
    </div>
  );
}

export default LoadingOverlay;
