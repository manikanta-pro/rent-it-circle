import React, { createContext, useContext, useMemo, useState } from 'react';
import { initialItems, initialRentals } from '../data/mockData';
import { useAuth } from './AuthContext';

const AppDataContext = createContext(null);
const ITEMS_KEY = 'rentitcircle-items';
const RENTALS_KEY = 'rentitcircle-rentals';
const FAVORITES_KEY = 'rentitcircle-favorites';

const readStorage = (key, fallback) => {
  const value = localStorage.getItem(key);
  return value ? JSON.parse(value) : fallback;
};

export const AppDataProvider = ({ children }) => {
  const { user } = useAuth();
  const [items, setItems] = useState(() => readStorage(ITEMS_KEY, initialItems));
  const [rentals, setRentals] = useState(() => readStorage(RENTALS_KEY, initialRentals));
  const [favorites, setFavorites] = useState(() => readStorage(FAVORITES_KEY, []));

  const persist = (key, value, setter) => {
    setter(value);
    localStorage.setItem(key, JSON.stringify(value));
  };

  const toggleFavorite = (itemId) => {
    const nextFavorites = favorites.includes(itemId)
      ? favorites.filter((id) => id !== itemId)
      : [...favorites, itemId];

    persist(FAVORITES_KEY, nextFavorites, setFavorites);
  };

  const createItem = (payload) => {
    const nextItem = {
      id: `item-${Date.now()}`,
      ownerId: user?.id || 'guest-owner',
      ownerName: user?.fullName || 'Rent-It Circle Host',
      ownerRating: user?.rating || 4.8,
      ownerReviewCount: user?.totalRatings || 24,
      ownerVerified: user?.isVerified || false,
      ownerLocation: user?.location || payload.location,
      createdAt: new Date().toISOString(),
      viewsCount: 0,
      availabilityStatus: 'available',
      ...payload,
    };

    const nextItems = [nextItem, ...items];
    persist(ITEMS_KEY, nextItems, setItems);
    return nextItem;
  };

  const requestRental = ({ itemId, startDate, endDate, message }) => {
    const item = items.find((entry) => entry.id === itemId);

    if (!item) {
      return null;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const dayCount = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));

    const nextRental = {
      id: `rental-${Date.now()}`,
      itemId,
      itemTitle: item.title,
      ownerId: item.ownerId,
      ownerName: item.ownerName,
      renterId: user?.id || 'guest-renter',
      renterName: user?.fullName || 'Guest User',
      startDate,
      endDate,
      days: dayCount,
      totalAmount: dayCount * item.dailyRate,
      depositAmount: item.depositAmount,
      status: 'pending',
      message,
      createdAt: new Date().toISOString(),
    };

    const nextRentals = [nextRental, ...rentals];
    persist(RENTALS_KEY, nextRentals, setRentals);
    return nextRental;
  };

  const updateRentalStatus = (rentalId, status) => {
    const nextRentals = rentals.map((rental) =>
      rental.id === rentalId ? { ...rental, status } : rental
    );
    persist(RENTALS_KEY, nextRentals, setRentals);
  };

  const marketplaceItems = useMemo(
    () => items.filter((item) => item.availabilityStatus !== 'archived'),
    [items]
  );

  const myListings = useMemo(
    () => marketplaceItems.filter((item) => item.ownerId === user?.id),
    [marketplaceItems, user]
  );

  const myRentals = useMemo(
    () =>
      rentals.filter(
        (rental) => rental.renterId === user?.id || rental.ownerId === user?.id
      ),
    [rentals, user]
  );

  const platformStats = useMemo(() => {
    const activeRentals = rentals.filter((rental) =>
      ['pending', 'approved', 'active'].includes(rental.status)
    ).length;

    return {
      items: marketplaceItems.length,
      activeRentals,
      savings: '42%',
      responseTime: '< 12 mins',
    };
  }, [marketplaceItems.length, rentals]);

  const value = useMemo(
    () => ({
      items: marketplaceItems,
      rentals,
      favorites,
      myListings,
      myRentals,
      platformStats,
      toggleFavorite,
      createItem,
      requestRental,
      updateRentalStatus,
    }),
    [favorites, marketplaceItems, myListings, myRentals, platformStats, rentals]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
};

export const useAppData = () => {
  const context = useContext(AppDataContext);

  if (!context) {
    throw new Error('useAppData must be used within AppDataProvider');
  }

  return context;
};
