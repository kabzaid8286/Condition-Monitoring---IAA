import { useState } from 'react';
import './index.css';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DashboardPage from './pages/DashboardPage';
import { toast } from './utils/toast';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      // Clean up legacy localStorage persistence so login page always shows on fresh site visit
      localStorage.removeItem('is_authenticated');
      localStorage.removeItem('user_role');
      return sessionStorage.getItem('is_authenticated') === 'true';
    } catch {
      return false;
    }
  });
  const [userRole, setUserRole] = useState(() => {
    try {
      return sessionStorage.getItem('user_role') || null;
    } catch {
      return null;
    }
  });
  const [authView, setAuthView] = useState('login'); // 'login', 'register', 'forgot-password'

  const handleLogin = (role) => {
    setUserRole(role);
    setIsAuthenticated(true);
    try {
      sessionStorage.setItem('is_authenticated', 'true');
      sessionStorage.setItem('user_role', role);
      if (!sessionStorage.getItem('auth_token')) {
        sessionStorage.setItem('auth_token', `session-${Date.now()}`);
      }
    } catch (e) {
      // Ignore storage errors
    }
    toast(`Successfully logged in as ${role === 'admin' ? 'Admin' : 'User'}.`);
  };

  const handleLogout = () => {
    setUserRole(null);
    setIsAuthenticated(false);
    try {
      sessionStorage.removeItem('is_authenticated');
      sessionStorage.removeItem('user_role');
      sessionStorage.removeItem('auth_token');
      localStorage.removeItem('is_authenticated');
      localStorage.removeItem('user_role');
      localStorage.removeItem('auth_token');
    } catch (e) {
      // Ignore storage errors
    }
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
