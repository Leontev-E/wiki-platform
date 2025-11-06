import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/api/api';
import { toast } from 'react-toastify';
import Loader from '@/components/Loader';

/**
 * AuthContext provides:
 *  - user: текущий пользователь или null
 *  - loading: индикатор инициализации
 *  - isLoggingIn: индикатор процесса входа
 *  - login: async(email, password) => boolean
 *  - logout: () => void
 */
export const AuthContext = createContext({
  user: null,
  loading: true,
  isLoggingIn: false,
  login: async () => false,
  logout: () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const navigate = useNavigate();

  // При старте проверяем сохраненного пользователя
  useEffect(() => {
    const storedUser = localStorage.getItem('userData');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('userData');
      }
    }
    setLoading(false);
  }, []);

  // Вход
  const login = async (email, password) => {
    if (isLoggingIn) return false; // Защита от повторных вызовов
    setIsLoggingIn(true);
    try {
      const { data } = await api.post('/users/login', { email, password });
      localStorage.setItem('userData', JSON.stringify(data));
      setUser(data);
      toast.success('Вы успешно вошли!');
      navigate('/');
      return true;
    } catch (error) {
      console.error('Ошибка входа:', error);
      toast.error(error.response?.data?.message || 'Неверный email или пароль');
      return false;
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Выход
  const logout = () => {
    setUser(null);
    localStorage.removeItem('userData');
    toast.info('Вы вышли из аккаунта');
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, isLoggingIn, login, logout }}>
      {loading ? <Loader /> : children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;