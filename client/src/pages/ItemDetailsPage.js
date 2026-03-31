import React, { useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Grid,
  Rating,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import VerifiedRounded from '@mui/icons-material/VerifiedRounded';
import EventRounded from '@mui/icons-material/EventRounded';
import LocalOfferRounded from '@mui/icons-material/LocalOfferRounded';
import WorkspacePremiumRounded from '@mui/icons-material/WorkspacePremiumRounded';
import { Navigate, useParams } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { formatGBP } from '../utils/currency';

function ItemDetailsPage() {
  const { itemId } = useParams();
  const { items, requestRental } = useAppData();
  const { isAuthenticated } = useAuth();
  const [form, setForm] = useState({
    startDate: '2026-04-04',
    endDate: '2026-04-06',
    message: 'Hi, I would like to reserve this item for a short project.',
  });
  const [notice, setNotice] = useState('');

  const item = useMemo(() => items.find((entry) => entry.id === itemId), [itemId, items]);

  if (!item) {
    return <Navigate to="/marketplace" replace />;
  }

  const start = new Date(form.startDate);
  const end = new Date(form.endDate);
  const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
  const total = days * item.dailyRate;

  const handleSubmit = () => {
    if (!isAuthenticated) {
      setNotice('Sign in to submit a rental request.');
      return;
    }

    requestRental({ itemId: item.id, ...form });
    setNotice('Rental request submitted. You can track it from your dashboard.');
  };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 5, md: 7 } }}>
      <Grid container spacing={4}>
        <Grid item xs={12} lg={8}>
          <Stack spacing={3}>
            <Card sx={{ overflow: 'hidden' }}>
              <Grid container spacing={0}>
                <Grid item xs={12} md={8}>
                  <Box component="img" src={item.gallery[0]} alt={item.title} sx={{ width: '100%', height: '100%', minHeight: 420, objectFit: 'cover' }} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Grid container spacing={0}>
                    {item.gallery.slice(1).map((image) => (
                      <Grid item xs={6} md={12} key={image}>
                        <Box component="img" src={image} alt={item.title} sx={{ width: '100%', height: 210, objectFit: 'cover' }} />
                      </Grid>
                    ))}
                  </Grid>
                </Grid>
              </Grid>
            </Card>

            <Card>
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Stack spacing={3}>
                  <Stack spacing={1.5}>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      <Chip label={item.category} color="primary" />
                      <Chip label={item.condition} variant="outlined" />
                      <Chip label={item.leadTime} color="secondary" />
                    </Stack>
                    <Typography variant="h2" sx={{ fontSize: { xs: '2.1rem', md: '3.25rem' } }}>
                      {item.title}
                    </Typography>
                    <Typography color="text.secondary" sx={{ fontSize: '1.05rem' }}>
                      {item.description}
                    </Typography>
                  </Stack>

                  <Grid container spacing={2}>
                    {[
                      ['Daily rate', formatGBP(item.dailyRate)],
                      ['Security deposit', formatGBP(item.depositAmount)],
                      ['Location', item.location],
                      ['Views', `${item.viewsCount}+ interest signals`],
                    ].map(([label, value]) => (
                      <Grid item xs={12} sm={6} key={label}>
                        <Box sx={{ p: 2.5, borderRadius: 4, bgcolor: 'rgba(148,163,184,0.08)' }}>
                          <Typography color="text.secondary">{label}</Typography>
                          <Typography variant="h5" sx={{ mt: 0.75 }}>
                            {value}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>

                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {item.tags.map((tag) => (
                      <Chip key={tag} label={tag} />
                    ))}
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Stack spacing={3}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Stack spacing={2.5}>
                  <Typography variant="h5">Request this item</Typography>
                  {notice ? <Alert severity="info">{notice}</Alert> : null}
                  <TextField
                    type="date"
                    label="Start date"
                    InputLabelProps={{ shrink: true }}
                    value={form.startDate}
                    onChange={(event) => setForm((prev) => ({ ...prev, startDate: event.target.value }))}
                  />
                  <TextField
                    type="date"
                    label="End date"
                    InputLabelProps={{ shrink: true }}
                    value={form.endDate}
                    onChange={(event) => setForm((prev) => ({ ...prev, endDate: event.target.value }))}
                  />
                  <TextField
                    multiline
                    minRows={4}
                    label="Message to host"
                    value={form.message}
                    onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
                  />
                  <Divider />
                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography color="text.secondary">Rental duration</Typography>
                      <Typography>{days} days</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography color="text.secondary">Rental total</Typography>
                      <Typography>{formatGBP(total)}</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography color="text.secondary">Refundable deposit</Typography>
                      <Typography>{formatGBP(item.depositAmount)}</Typography>
                    </Stack>
                  </Stack>
                  <Button variant="contained" size="large" onClick={handleSubmit}>
                    Submit request
                  </Button>
                </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardContent sx={{ p: 3 }}>
                <Stack spacing={2}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                      {item.ownerName.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="h6">{item.ownerName}</Typography>
                      <Stack direction="row" spacing={0.75} alignItems="center">
                        <Rating value={item.ownerRating} precision={0.1} readOnly size="small" />
                        <Typography variant="body2" color="text.secondary">
                          {item.ownerReviewCount} reviews
                        </Typography>
                      </Stack>
                    </Box>
                  </Stack>
                  <Stack spacing={1.5}>
                    <Stack direction="row" spacing={1.25} alignItems="center">
                      <VerifiedRounded color={item.ownerVerified ? 'primary' : 'disabled'} />
                      <Typography>{item.ownerVerified ? 'Verified host' : 'Verification pending'}</Typography>
                    </Stack>
                    <Stack direction="row" spacing={1.25} alignItems="center">
                      <EventRounded color="action" />
                      <Typography>{item.leadTime}</Typography>
                    </Stack>
                    <Stack direction="row" spacing={1.25} alignItems="center">
                      <LocalOfferRounded color="action" />
                      <Typography>{item.ownerLocation}</Typography>
                    </Stack>
                    <Stack direction="row" spacing={1.25} alignItems="center">
                      <WorkspacePremiumRounded color="secondary" />
                      <Typography>High-trust host profile</Typography>
                    </Stack>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Container>
  );
}

export default ItemDetailsPage;
