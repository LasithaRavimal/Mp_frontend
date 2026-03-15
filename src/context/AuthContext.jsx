import { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/apiClient';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /* =========================
     INITIAL AUTH CHECK
  ========================= */

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');

        if (token && savedUser) {
          // restore user from localStorage
          setUser(JSON.parse(savedUser));

          // verify token with backend
          await checkAuth();
        }
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  /* =========================
     VERIFY TOKEN
  ========================= */

  const checkAuth = async () => {
    try {
      const response = await apiClient.get('/auth/me');

      const userData = response.data;

      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));

      return userData;
    } catch (error) {
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return null;
    }
  };

  /* =========================
     LOGIN
  ========================= */

  const login = async (email, password) => {
    try {
      const response = await apiClient.post('/auth/login', {
        email,
        password
      });

      const { access_token, user: userData } = response.data;

      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));

      setUser(userData);

      return { success: true, user: userData };

    } catch (error) {

      return {
        success: false,
        error: error.response?.data?.detail || 'Login failed'
      };

    }
  };

  /* =========================
     REGISTER
  ========================= */

  const register = async (email, password) => {
    try {
      const response = await apiClient.post('/auth/register', {
        email,
        password,
        role: 'user'
      });

      const { access_token, user: userData } = response.data;

      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));

      setUser(userData);

      return { success: true, user: userData };

    } catch (error) {

      return {
        success: false,
        error: error.response?.data?.detail || 'Registration failed'
      };

    }
  };

  /* =========================
     GOOGLE LOGIN
  ========================= */

  const googleLogin = async (token) => {
    try {
      const response = await apiClient.post('/auth/google', { token });

      const { access_token, user: userData } = response.data;

      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));

      setUser(userData);

      return { success: true, user: userData };

    } catch (error) {

      return {
        success: false,
        error: error.response?.data?.detail || 'Google sign in failed'
      };

    }
  };

  /* =========================
     LOGOUT
  ========================= */

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout').catch(() => {});
    } catch (error) {
      // ignore logout errors
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  /* =========================
     CONTEXT VALUE
  ========================= */

  const value = {
    user,
    loading,
    login,
    register,
    googleLogin,
    logout,
    checkAuth,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};