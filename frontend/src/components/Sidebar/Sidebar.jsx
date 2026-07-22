import { NavLink, useLocation } from 'react-router-dom';
import methods from '../../config/methods';
import './Sidebar.css';

function Sidebar({ isOpen, onClose }) {
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay ${isOpen ? 'visible' : ''}`}
        onClick={onClose}
      />

      {/* Hamburger button */}
      <button
        className={`sidebar-hamburger ${isOpen ? 'open' : ''}`}
        onClick={onClose}
        aria-label="Toggle sidebar"
      >
        <span className="sidebar-hamburger-line" />
        <span className="sidebar-hamburger-line" />
        <span className="sidebar-hamburger-line" />
      </button>

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">✦</div>
            <span className="sidebar-logo-text">Humanizer</span>
            <span className="sidebar-logo-badge">AI</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
            onClick={onClose}
          >
            <span className="sidebar-link-icon">🏠</span>
            <div className="sidebar-link-content">
              <span className="sidebar-link-title">Home</span>
            </div>
          </NavLink>

          <div className="sidebar-section-label">Rewrite Methods</div>

          {methods.map((method) => (
            <NavLink
              key={method.id}
              to={method.path}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
              onClick={onClose}
            >
              <span className="sidebar-link-icon">{method.icon}</span>
              <div className="sidebar-link-content">
                <span className="sidebar-link-title">{method.name}</span>
                <span className="sidebar-link-subtitle">
                  {method.subtitle}
                </span>
              </div>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <p className="sidebar-footer-text">v1.0.0 — Testing Build</p>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
