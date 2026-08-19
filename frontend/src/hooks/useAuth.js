import useAuthStore from '../store/authStore';
import { useEffect } from 'react';
import api from '../config/api';

export const useAuth = () => {
  const { user, isAuthenticated, isLoading, login, register, logout, setUser } = useAuthStore();

  useEffect(() => {
    const checkAuth = async () => {
      if (isAuthenticated && !user) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
        } catch (error) {
          logout();
        }
      }
    };
    checkAuth();
  }, [isAuthenticated, user, setUser, logout]);

  return { user, isAuthenticated, isLoading, login, register, logout };
};

export default useAuth;
