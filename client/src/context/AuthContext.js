import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);
const USER_KEY = 'rentitcircle-user';
const TOKEN_KEY = 'rentitcircle-token';

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
};

const demoUser = {
  id: 'demo-user',
  fullName: 'Aarav Mehta',
  email: 'aarav@rentitcircle.com',
  location: 'Bengaluru',
  rating: 4.9,
  totalRatings: 128,
  isVerified: true,
  memberSince: '2023',
  responseRate: '98%',
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY) || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem(USER_KEY);

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    if (token) {
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
    }

    setLoading(false);
  }, [token]);

  const persistSession = (nextUser, nextToken = 'demo-session-token') => {
    setUser(nextUser);
    setToken(nextToken);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    localStorage.setItem(TOKEN_KEY, nextToken);
    api.defaults.headers.common.Authorization = `Bearer ${nextToken}`;
  };

  const login = async ({ email, password }) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      persistSession(
        {
          ...response.data.user,
          fullName: response.data.user.fullName || demoUser.fullName,
          memberSince: '2023',
          responseRate: '96%',
        },
        response.data.token
      );
      return { ok: true };
    } catch (error) {
      persistSession(
        {
          ...demoUser,
          email,
        },
        'demo-session-token'
      );
      return {
        ok: true,
        offline: true,
        message: 'Backend unavailable. Signed in with demo workspace data.',
      };
    }
  };

  const register = async ({ fullName, email, location, password }) => {
    try {
      const response = await api.post('/auth/register', {
        fullName,
        email,
        location,
        password,
      });
      persistSession(
        {
          ...response.data.user,
          fullName: response.data.user.fullName || fullName,
          memberSince: '2026',
          responseRate: '100%',
          isVerified: false,
        },
        response.data.token
      );
      return { ok: true };
    } catch (error) {
      persistSession(
        {
          ...demoUser,
          fullName,
          email,
          location,
          memberSince: '2026',
          isVerified: false,
        },
        'demo-session-token'
      );
      return {
        ok: true,
        offline: true,
        message: 'Account created in demo mode because the API is not reachable.',
      };
    }
  };

  const logout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    delete api.defaults.headers.common.Authorization;
  };

  const updateUser = (updates) => {
    const nextUser = { ...user, ...updates };
    setUser(nextUser);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      updateUser,
    }),
    [loading, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
