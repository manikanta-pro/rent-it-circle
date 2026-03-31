import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);
const USER_KEY = 'rentitcircle-user';
const TOKEN_KEY = 'rentitcircle-token';

const normalizeUser = (user) => ({
  ...user,
  memberSince: user.memberSince || (user.joinDate ? new Date(user.joinDate).getFullYear().toString() : '2026'),
  responseRate: user.responseRate || '95%',
});

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY) || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrapAuth = async () => {
      const storedUser = localStorage.getItem(USER_KEY);

      if (!token) {
        if (storedUser) {
          localStorage.removeItem(USER_KEY);
        }
        setLoading(false);
        return;
      }

      api.defaults.headers.common.Authorization = `Bearer ${token}`;

      try {
        const response = await api.get('/users/profile');
        const nextUser = normalizeUser({
          id: response.data.profile.id,
          email: response.data.profile.email,
          fullName: response.data.profile.full_name,
          location: response.data.profile.location,
          avatarUrl: response.data.profile.avatar_url,
          rating: Number(response.data.profile.rating || 0),
          totalRatings: Number(response.data.profile.total_ratings || 0),
          isVerified: Boolean(response.data.profile.is_verified),
          joinDate: response.data.profile.join_date,
        });
        setUser(nextUser);
        localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
      } catch (error) {
        setUser(null);
        setToken('');
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(TOKEN_KEY);
        delete api.defaults.headers.common.Authorization;
      } finally {
        setLoading(false);
      }
    };

    bootstrapAuth();
  }, [token]);

  const persistSession = (nextUser, nextToken) => {
    const normalizedUser = normalizeUser(nextUser);
    setUser(normalizedUser);
    setToken(nextToken);
    localStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));
    localStorage.setItem(TOKEN_KEY, nextToken);
    api.defaults.headers.common.Authorization = `Bearer ${nextToken}`;
  };

  const getErrorMessage = (error, fallback) =>
    error?.response?.data?.error ||
    error?.response?.data?.errors?.[0]?.msg ||
    fallback;

  const login = async ({ email, password }) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      persistSession(response.data.user, response.data.token);
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        message: getErrorMessage(error, 'Login failed'),
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
      persistSession(response.data.user, response.data.token);
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        message: getErrorMessage(error, 'Registration failed'),
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
    const nextUser = normalizeUser({ ...user, ...updates });
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
