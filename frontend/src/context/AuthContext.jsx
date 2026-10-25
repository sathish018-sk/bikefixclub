import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('bikefix_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('bikefix_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifySession() {
      const storedToken = localStorage.getItem('bikefix_token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.data) {
            setUser(res.data);
            localStorage.setItem('bikefix_user', JSON.stringify(res.data));
          }
        } catch {
          // Token invalid or expired
          logout();
        }
      }
      setLoading(false);
    }

    verifySession();
  }, []);

  const login = async (loginIdentifier, password) => {
    const res = await api.post('/auth/login', {
      login: loginIdentifier,
      password,
    });

    const { token: jwtToken, user: userData } = res.data;
    localStorage.setItem('bikefix_token', jwtToken);
    localStorage.setItem('bikefix_user', JSON.stringify(userData));
    setToken(jwtToken);
    setUser(userData);
    return userData;
  };

  const register = async (formData) => {
    const res = await api.post('/auth/register', formData);
    const { token: jwtToken, user: userData } = res.data;
    localStorage.setItem('bikefix_token', jwtToken);
    localStorage.setItem('bikefix_user', JSON.stringify(userData));
    setToken(jwtToken);
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    try {
      if (token) {
        await api.post('/auth/logout');
      }
    } catch {
      // Ignore network failure on logout
    } finally {
      localStorage.removeItem('bikefix_token');
      localStorage.removeItem('bikefix_user');
      setToken(null);
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data) {
        setUser(res.data);
        localStorage.setItem('bikefix_user', JSON.stringify(res.data));
      }
    } catch (err) {
      console.error('Failed to refresh user profile:', err);
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    isAdmin: user?.role === 'admin',
    isCustomer: user?.role === 'customer',
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
