import { useState } from 'react';
import './index.css';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DashboardPage from './pages/DashboardPage';
import { toast } from './utils/toast';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [authView, setAuthView] = useState('login'); // 'login', 'register', 'forgot-password'

  const handleLogin = (role) => {
    setUserRole(role);
    setIsAuthenticated(true);
    toast(`Successfully logged in as ${role === 'admin' ? 'Admin' : 'User'}.`);
  };

  const handleLogout = () => {
    setUserRole(null);
    setIsAuthenticated(false);
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
