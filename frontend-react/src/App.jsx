import { useState } from 'react';
import './index.css';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import { toast } from './utils/toast';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);

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
        <LoginPage onLogin={handleLogin} />
      ) : (
        <DashboardPage userRole={userRole} onLogout={handleLogout} />
      )}
    </>
  );
}

export default App;
