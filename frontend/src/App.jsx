import { useState, useCallback } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar/Sidebar';
import Toast from './components/Toast/Toast';
import Home from './pages/Home/Home';
import MethodPage from './pages/MethodPage/MethodPage';
import { useToast } from './hooks/useToast';
import methods from './config/methods';
import './App.css';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { toasts, removeToast, success, error, info, warning } = useToast();

  const handleToast = useCallback(
    (message, type) => {
      switch (type) {
        case 'success':
          success(message);
          break;
        case 'error':
          error(message);
          break;
        case 'warning':
          warning(message);
          break;
        default:
          info(message);
      }
    },
    [success, error, info, warning]
  );

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={toggleSidebar} />

      <main className="app-main">
        <div className="app-main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            {methods.map((method) => (
              <Route
                key={method.id}
                path={method.path}
                element={
                  <MethodPage method={method} onToast={handleToast} />
                }
              />
            ))}
          </Routes>
        </div>
      </main>

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

export default App;
