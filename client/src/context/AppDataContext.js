import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const AppDataContext = createContext(null);

const mapItem = (item) => {
  const images = Array.isArray(item.images) ? item.images : [];
  const fallbackImage = images[0] || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80';

  return {
    id: item.id,
    title: item.title,
    category: item.category,
    description: item.description,
    brand: item.brand || '',
    condition: item.condition,
    dailyRate: Number(item.daily_rate || 0),
    depositAmount: Number(item.deposit_amount || 0),
    damagePolicy: item.damage_policy || '',
    location: item.location,
    neighborhood: item.neighborhood || '',
    postalCode: item.postal_code || '',
    latitude: item.latitude !== undefined && item.latitude !== null ? Number(item.latitude) : null,
    longitude: item.longitude !== undefined && item.longitude !== null ? Number(item.longitude) : null,
    image: fallbackImage,
    gallery: images.length ? images : [fallbackImage],
    tags: Array.isArray(item.tags) && item.tags.length ? item.tags : ['Trusted local pickup'],
    ownerId: item.owner_id,
    ownerName: item.owner_name,
    ownerRating: Number(item.owner_rating || 0),
    ownerReviewCount: Number(item.owner_review_count || 0),
    ownerVerified: Boolean(item.owner_verified),
    ownerLocation: [item.owner_neighborhood, item.owner_city].filter(Boolean).join(', ') || item.location,
    leadTime: item.pickup_window || 'Pickup arranged with host',
    handoffType: item.handoff_type || 'pickup',
    localOnly: Boolean(item.local_only),
    serviceRadiusKm: Number(item.service_radius_km || 10),
    minRentalDays: Number(item.min_rental_days || 1),
    maxRentalDays: Number(item.max_rental_days || 14),
    rentalTerms: item.rental_terms || '',
    availabilityStatus: item.availability_status,
    viewsCount: Number(item.views_count || 0),
    createdAt: item.created_at,
    distanceKm: item.distance_km !== undefined && item.distance_km !== null ? Number(item.distance_km) : null,
    isLocalMatch: Boolean(item.is_local_match),
  };
};

const mapRental = (rental, role) => ({
  id: rental.id,
  itemId: rental.item_id,
  itemTitle: rental.item_title,
  ownerId: rental.owner_id,
  renterId: rental.renter_id,
  ownerName: rental.owner_name,
  renterName: rental.renter_name,
  ownerEmail: rental.owner_email,
  renterEmail: rental.renter_email,
  location: rental.location,
  startDate: rental.start_date,
  endDate: rental.end_date,
  totalAmount: Number(rental.total_amount || 0),
  depositAmount: Number(rental.deposit_amount || 0),
  status: rental.status,
  createdAt: rental.created_at,
  completedAt: rental.completed_at,
  message: rental.renter_message || '',
  pickupNotes: rental.pickup_notes || '',
  depositStatus: rental.deposit_status || 'held',
  image: Array.isArray(rental.images) && rental.images.length ? rental.images[0] : '',
  role,
});

export const AppDataProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');

  const loadMarketplace = async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '' || value === false) {
        return;
      }
      params.set(key, String(value));
    });

    const response = await api.get(`/items${params.toString() ? `?${params.toString()}` : ''}`);
    setItems(response.data.map(mapItem));
  };

  const loadPrivateData = async () => {
    if (!isAuthenticated) {
      setRentals([]);
      setFavorites([]);
      return;
    }

    const [rentalsResponse, favoritesResponse] = await Promise.all([
      api.get('/rentals/my-rentals'),
      api.get('/users/favorites'),
    ]);

    const nextRentals = [
      ...rentalsResponse.data.asOwner.map((rental) => mapRental(rental, 'owner')),
      ...rentalsResponse.data.asRenter.map((rental) => mapRental(rental, 'renter')),
    ].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));

    setRentals(nextRentals);
    setFavorites(favoritesResponse.data.map((item) => item.id));
  };

  useEffect(() => {
    let ignore = false;

    const bootstrap = async () => {
      setLoading(true);

      try {
        const response = await api.get('/items');
        if (!ignore) {
          setItems(response.data.map(mapItem));
        }

        if (isAuthenticated) {
          const [rentalsResponse, favoritesResponse] = await Promise.all([
            api.get('/rentals/my-rentals'),
            api.get('/users/favorites'),
          ]);

          if (!ignore) {
            const nextRentals = [
              ...rentalsResponse.data.asOwner.map((rental) => mapRental(rental, 'owner')),
              ...rentalsResponse.data.asRenter.map((rental) => mapRental(rental, 'renter')),
            ].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));

            setRentals(nextRentals);
            setFavorites(favoritesResponse.data.map((item) => item.id));
          }
        } else if (!ignore) {
          setRentals([]);
          setFavorites([]);
        }

        if (!ignore) {
          setNotice('');
        }
      } catch (error) {
        if (!ignore) {
          setNotice(error?.response?.data?.error || 'Unable to load live marketplace data right now.');
          setItems([]);
          setRentals([]);
          setFavorites([]);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    bootstrap();

    return () => {
      ignore = true;
    };
  }, [isAuthenticated, user?.id]);

  const toggleFavorite = async (itemId) => {
    const isSaved = favorites.includes(itemId);

    if (isSaved) {
      await api.delete(`/users/favorites/${itemId}`);
      setFavorites((prev) => prev.filter((id) => id !== itemId));
      return;
    }

    await api.post(`/users/favorites/${itemId}`);
    setFavorites((prev) => [...prev, itemId]);
  };

  const createItem = async (payload) => {
    const response = await api.post('/items', payload);
    const nextItem = mapItem(response.data);
    setItems((prev) => [nextItem, ...prev]);
    return nextItem;
  };

  const requestRental = async ({ itemId, startDate, endDate, message, pickupNotes }) => {
    const response = await api.post('/rentals', {
      itemId,
      startDate,
      endDate,
      message,
      pickupNotes,
    });

    const nextRental = mapRental(response.data, 'renter');
    setRentals((prev) => [nextRental, ...prev]);
    await loadMarketplace();
    return nextRental;
  };

  const updateRentalStatus = async (rentalId, status) => {
    const response = await api.patch(`/rentals/${rentalId}/status`, { status });
    const updated = mapRental(
      response.data,
      response.data.owner_id === user?.id ? 'owner' : 'renter'
    );

    setRentals((prev) => prev.map((rental) => (rental.id === rentalId ? { ...rental, ...updated } : rental)));
    await loadMarketplace();
    return updated;
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
    () => rentals.filter((rental) => rental.renterId === user?.id || rental.ownerId === user?.id),
    [rentals, user]
  );

  const platformStats = useMemo(() => {
    const activeRentals = rentals.filter((rental) => ['pending', 'active'].includes(rental.status)).length;

    return {
      items: marketplaceItems.length,
      activeRentals,
      savings: '42%',
      responseTime: user?.responseTimeMinutes ? `${user.responseTimeMinutes} mins` : '< 2 hrs',
    };
  }, [marketplaceItems.length, rentals, user?.responseTimeMinutes]);

  const value = useMemo(
    () => ({
      items: marketplaceItems,
      rentals,
      favorites,
      myListings,
      myRentals,
      platformStats,
      loading,
      notice,
      refreshData: async () => {
        await loadMarketplace();
        await loadPrivateData();
      },
      fetchMarketplaceItems: loadMarketplace,
      toggleFavorite,
      createItem,
      requestRental,
      updateRentalStatus,
    }),
    [favorites, loading, marketplaceItems, myListings, myRentals, notice, platformStats, rentals]
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
