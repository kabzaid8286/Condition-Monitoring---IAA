import { useState } from 'react';
import './index.css';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DashboardPage from './pages/DashboardPage';
import { toast } from './utils/toast';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const savedRole = localStorage.getItem('user_role');
    const savedToken = localStorage.getItem('auth_token');
    return Boolean(savedRole && savedToken);
  });
  const [userRole, setUserRole] = useState(() => {
    return localStorage.getItem('user_role') || null;
  });
  const [authView, setAuthView] = useState('login'); // 'login', 'register', 'forgot-password'

  const handleLogin = (role) => {
    setUserRole(role);
    setIsAuthenticated(true);
    localStorage.setItem('user_role', role);
    if (!localStorage.getItem('auth_token')) {
      localStorage.setItem('auth_token', `session-${Date.now()}`);
    }
    toast(`Successfully logged in as ${role === 'admin' ? 'Admin' : 'User'}.`);
  };

  const handleLogout = () => {
    setUserRole(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user_role');
    localStorage.removeItem('auth_token');
    toast('Signed out successfully.');
  };

  return (
    <>
      {!isAuthenticated ? (
        <>
          {authView === 'login' && <LoginPage onLogin={handleLogin} onNavigate={setAuthView} />}
          {authView === 'register' && <RegisterPage onNavigate={setAuthView} />}
          {authView === 'forgot-password' && <ForgotPasswordPage onNavigate={setAuthView} />}
        </>
      ) : (
        <DashboardPage userRole={userRole} onLogout={handleLogout} />
      )}
    </>
  );
}

export default App;
