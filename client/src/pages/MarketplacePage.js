import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import SearchRounded from '@mui/icons-material/SearchRounded';
import FavoriteRounded from '@mui/icons-material/FavoriteRounded';
import FavoriteBorderRounded from '@mui/icons-material/FavoriteBorderRounded';
import PlaceRounded from '@mui/icons-material/PlaceRounded';
import StarRounded from '@mui/icons-material/StarRounded';
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { categories, cityHighlights } from '../data/mockData';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { formatGBP } from '../utils/currency';

function MarketplacePage() {
  const { items, favorites, toggleFavorite, loading, notice, fetchMarketplaceItems } = useAppData();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const locationParam = searchParams.get('location');
  const [filters, setFilters] = useState({
    search: '',
    category: 'All',
    location: locationParam && cityHighlights.includes(locationParam) ? locationParam : 'All cities',
    nearbyOnly: false,
  });

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      location: locationParam && cityHighlights.includes(locationParam) ? locationParam : 'All cities',
    }));
  }, [locationParam]);

  useEffect(() => {
    fetchMarketplaceItems({
      search: filters.search || undefined,
      category: filters.category === 'All' ? undefined : filters.category,
      city: filters.location === 'All cities' ? undefined : filters.location,
      nearby: filters.nearbyOnly ? true : undefined,
      neighborhood: filters.nearbyOnly ? user?.neighborhood : undefined,
      postalCode: filters.nearbyOnly ? user?.postalCode : undefined,
      latitude: filters.nearbyOnly ? user?.latitude : undefined,
      longitude: filters.nearbyOnly ? user?.longitude : undefined,
      radiusKm: filters.nearbyOnly ? user?.searchRadiusKm : undefined,
      localOnly: filters.nearbyOnly ? true : undefined,
    });
  }, [
    fetchMarketplaceItems,
    filters.category,
    filters.location,
    filters.nearbyOnly,
    filters.search,
    user?.latitude,
    user?.longitude,
    user?.neighborhood,
    user?.postalCode,
    user?.searchRadiusKm,
  ]);

  const filteredItems = useMemo(() => items, [items]);

  const handleFavoriteToggle = async (itemId) => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    await toggleFavorite(itemId);
  };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 5, md: 7 } }}>
      <Stack spacing={4}>
        <Card
          sx={{
            background: 'linear-gradient(135deg, rgba(15,118,110,0.12), rgba(255,255,255,1) 45%, rgba(249,115,22,0.1))',
          }}
        >
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Stack spacing={3}>
              <Box>
                <Typography variant="h2" sx={{ fontSize: { xs: '2.25rem', md: '3.5rem' } }}>
                  Marketplace
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 720 }}>
                  Refined search, transparent pricing and enough host context to make local rentals feel reliable.
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    value={filters.search}
                    onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
                    placeholder="Search by item, use case or brand"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchRounded />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <TextField
                      select
                      value={filters.category}
                      onChange={(event) => setFilters((prev) => ({ ...prev, category: event.target.value }))}
                    >
                      {['All', ...categories].map((category) => (
                        <MenuItem key={category} value={category}>
                          {category}
                        </MenuItem>
                      ))}
                    </TextField>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    select
                    fullWidth
                    value={filters.location}
                    onChange={(event) => setFilters((prev) => ({ ...prev, location: event.target.value }))}
                  >
                    {['All cities', ...cityHighlights].map((city) => (
                      <MenuItem key={city} value={city}>
                        {city}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={filters.nearbyOnly}
                        onChange={(event) => setFilters((prev) => ({ ...prev, nearbyOnly: event.target.checked }))}
                      />
                    }
                    label={
                      user?.city
                        ? `Show only nearby listings around ${user.neighborhood || user.city}`
                        : 'Show only nearby listings'
                    }
                  />
                </Grid>
              </Grid>
            </Stack>
          </CardContent>
        </Card>

        <Grid container spacing={3}>
          {notice ? (
            <Grid item xs={12}>
              <Alert severity="warning">{notice}</Alert>
            </Grid>
          ) : null}

          {!loading && filteredItems.length === 0 ? (
            <Grid item xs={12}>
              <Card>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h5">No listings match these filters</Typography>
                  <Typography color="text.secondary" sx={{ mt: 1 }}>
                    Try a wider search, another city, or publish the first listing in this category.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ) : null}

          {filteredItems.map((item) => (
            <Grid item xs={12} sm={6} lg={4} key={item.id}>
              <Card sx={{ overflow: 'hidden', height: '100%' }}>
                <Box sx={{ position: 'relative' }}>
                  <Box
                    component="img"
                    src={item.image}
                    alt={item.title}
                    sx={{ width: '100%', height: 260, objectFit: 'cover' }}
                  />
                  <IconButton
                    onClick={() => handleFavoriteToggle(item.id)}
                    sx={{
                      position: 'absolute',
                      top: 16,
                      right: 16,
                      bgcolor: 'rgba(255,255,255,0.9)',
                      '&:hover': { bgcolor: 'rgba(255,255,255,1)' },
                    }}
                  >
                    {favorites.includes(item.id) ? <FavoriteRounded color="error" /> : <FavoriteBorderRounded />}
                  </IconButton>
                </Box>
                <CardContent sx={{ p: 3 }}>
                  <Stack spacing={2}>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      <Chip label={item.category} color="primary" />
                      <Chip label={item.leadTime} variant="outlined" />
                    </Stack>

                    <Box>
                      <Typography variant="h5" gutterBottom>
                        {item.title}
                      </Typography>
                      <Typography color="text.secondary">{item.description}</Typography>
                    </Box>

                    <Stack direction="row" spacing={2} color="text.secondary">
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <PlaceRounded sx={{ fontSize: 18 }} />
                        <Typography variant="body2">
                          {item.neighborhood ? `${item.neighborhood}, ${item.location}` : item.location}
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <StarRounded sx={{ fontSize: 18, color: '#f59e0b' }} />
                        <Typography variant="body2">
                          {item.ownerRating} ({item.ownerReviewCount})
                        </Typography>
                      </Stack>
                    </Stack>

                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="h5" color="primary.main">
                          {formatGBP(item.dailyRate)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          deposit {formatGBP(item.depositAmount)}
                        </Typography>
                        {item.distanceKm !== null ? (
                          <Typography variant="body2" color="text.secondary">
                            {item.distanceKm} km away
                          </Typography>
                        ) : null}
                      </Box>
                      <Button
                        component={Link}
                        to={`/marketplace/${item.id}`}
                        variant="contained"
                        endIcon={<ArrowForwardRounded />}
                      >
                        View
                      </Button>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Stack>
    </Container>
  );
}

export default MarketplacePage;
