import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);
const USER_KEY = 'rentitcircle-user';
const TOKEN_KEY = 'rentitcircle-token';

const normalizeUser = (user) => ({
  ...user,
  city: user.city || user.location || '',
  location: user.location || user.city || '',
  latitude: user.latitude !== undefined && user.latitude !== null ? Number(user.latitude) : null,
  longitude: user.longitude !== undefined && user.longitude !== null ? Number(user.longitude) : null,
  searchRadiusKm: Number(user.searchRadiusKm || 15),
  localVisibility: user.localVisibility || 'neighborhood',
  memberSince: user.memberSince || (user.joinDate ? new Date(user.joinDate).getFullYear().toString() : '2026'),
  responseRate:
    typeof user.responseRate === 'number' ? `${user.responseRate}%` : user.responseRate || '90%',
  responseTimeMinutes: Number(user.responseTimeMinutes || 0),
  completedRentals: Number(user.completedRentals || 0),
  totalRatings: Number(user.totalRatings || 0),
  rating: Number(user.rating || 0),
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
  const [profileStats, setProfileStats] = useState({
    savedItems: 0,
    ownerRentals: 0,
    renterRentals: 0,
    openRequests: 0,
  });
  const [verifications, setVerifications] = useState([]);

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

      try {
        const response = await api.get('/users/profile');
        const nextUser = normalizeUser({
          id: response.data.profile.id,
          email: response.data.profile.email,
          fullName: response.data.profile.full_name,
          phone: response.data.profile.phone,
          city: response.data.profile.city,
          location: response.data.profile.city,
          neighborhood: response.data.profile.neighborhood,
          postalCode: response.data.profile.postal_code,
          latitude: response.data.profile.latitude,
          longitude: response.data.profile.longitude,
          searchRadiusKm: response.data.profile.search_radius_km,
          localVisibility: response.data.profile.local_visibility,
          accountType: response.data.profile.account_type,
          preferredContactMethod: response.data.profile.preferred_contact_method,
          bio: response.data.profile.bio,
          avatarUrl: response.data.profile.avatar_url,
          rating: response.data.profile.rating,
          totalRatings: response.data.profile.total_ratings,
          isVerified: Boolean(response.data.profile.is_verified),
          joinDate: response.data.profile.join_date,
          lastActiveAt: response.data.profile.last_active_at,
          responseRate: response.data.profile.response_rate,
          responseTimeMinutes: response.data.profile.response_time_minutes,
          completedRentals: response.data.profile.completed_rentals,
        });
        setUser(nextUser);
        setProfileStats(response.data.stats || {});
        setVerifications(response.data.verifications || []);
        localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
      } catch (error) {
        setUser(null);
        setToken('');
        setProfileStats({
          savedItems: 0,
          ownerRentals: 0,
          renterRentals: 0,
          openRequests: 0,
        });
        setVerifications([]);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(TOKEN_KEY);
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

  const register = async (payload) => {
    try {
      const response = await api.post('/auth/register', payload);
      persistSession(response.data.user, response.data.token);
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        message: getErrorMessage(error, 'Registration failed'),
      };
    }
  };

  const refreshProfile = async () => {
    const response = await api.get('/users/profile');
    const nextUser = normalizeUser({
      id: response.data.profile.id,
      email: response.data.profile.email,
      fullName: response.data.profile.full_name,
      phone: response.data.profile.phone,
      city: response.data.profile.city,
      location: response.data.profile.city,
      neighborhood: response.data.profile.neighborhood,
      postalCode: response.data.profile.postal_code,
      latitude: response.data.profile.latitude,
      longitude: response.data.profile.longitude,
      searchRadiusKm: response.data.profile.search_radius_km,
      localVisibility: response.data.profile.local_visibility,
      accountType: response.data.profile.account_type,
      preferredContactMethod: response.data.profile.preferred_contact_method,
      bio: response.data.profile.bio,
      avatarUrl: response.data.profile.avatar_url,
      rating: response.data.profile.rating,
      totalRatings: response.data.profile.total_ratings,
      isVerified: Boolean(response.data.profile.is_verified),
      joinDate: response.data.profile.join_date,
      lastActiveAt: response.data.profile.last_active_at,
      responseRate: response.data.profile.response_rate,
      responseTimeMinutes: response.data.profile.response_time_minutes,
      completedRentals: response.data.profile.completed_rentals,
    });
    setUser(nextUser);
    setProfileStats(response.data.stats || {});
    setVerifications(response.data.verifications || []);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    return response.data;
  };

  const logout = () => {
    setUser(null);
    setToken('');
    setProfileStats({
      savedItems: 0,
      ownerRentals: 0,
      renterRentals: 0,
      openRequests: 0,
    });
    setVerifications([]);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
  };

  const updateUser = async (updates) => {
    const response = await api.put('/users/profile', updates);
    const nextUser = normalizeUser({
      ...user,
      fullName: response.data.full_name,
      phone: response.data.phone,
      city: response.data.city,
      location: response.data.city,
      neighborhood: response.data.neighborhood,
      postalCode: response.data.postal_code,
      latitude: response.data.latitude,
      longitude: response.data.longitude,
      searchRadiusKm: response.data.search_radius_km,
      localVisibility: response.data.local_visibility,
      accountType: response.data.account_type,
      preferredContactMethod: response.data.preferred_contact_method,
      bio: response.data.bio,
      avatarUrl: response.data.avatar_url,
      rating: response.data.rating,
      totalRatings: response.data.total_ratings,
      isVerified: Boolean(response.data.is_verified),
      joinDate: response.data.join_date || user?.joinDate,
      lastActiveAt: response.data.last_active_at,
      responseRate: response.data.response_rate,
      responseTimeMinutes: response.data.response_time_minutes,
      completedRentals: response.data.completed_rentals,
    });
    setUser(nextUser);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    return nextUser;
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      profileStats,
      verifications,
      isAuthenticated: Boolean(user),
      login,
      register,
      refreshProfile,
      logout,
      updateUser,
    }),
    [loading, profileStats, token, user, verifications]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
