import React from 'react';
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  Rating,
  Stack,
  Typography,
} from '@mui/material';
import VerifiedRounded from '@mui/icons-material/VerifiedRounded';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';

function ProfilePage() {
  const { user } = useAuth();
  const { myListings, myRentals } = useAppData();

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 5, md: 7 } }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 4 }}>
              <Stack spacing={3} alignItems="flex-start">
                <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontSize: 32 }}>
                  {user?.fullName?.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h4">{user?.fullName}</Typography>
                  <Typography color="text.secondary">{user?.email}</Typography>
                </Box>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip icon={<VerifiedRounded />} label={user?.isVerified ? 'Verified account' : 'Verification pending'} />
                  <Chip label={user?.location} color="primary" />
                </Stack>
                <Box>
                  <Rating value={user?.rating || 4.8} precision={0.1} readOnly />
                  <Typography color="text.secondary" sx={{ mt: 1 }}>
                    {user?.totalRatings || 0} ratings • Member since {user?.memberSince}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={7}>
          <Stack spacing={3}>
            <Card>
              <CardContent sx={{ p: 3.5 }}>
                <Typography variant="h5">Marketplace footprint</Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  {[
                    ['Active listings', myListings.length],
                    ['Rental activity', myRentals.length],
                    ['Response rate', user?.responseRate || '95%'],
                    ['Trust score', 'High'],
                  ].map(([label, value]) => (
                    <Grid item xs={6} key={label}>
                      <Box sx={{ p: 2.5, borderRadius: 4, bgcolor: 'rgba(148,163,184,0.08)' }}>
                        <Typography color="text.secondary">{label}</Typography>
                        <Typography variant="h5" sx={{ mt: 0.75 }}>
                          {value}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>

            <Card>
              <CardContent sx={{ p: 3.5 }}>
                <Typography variant="h5">Profile summary</Typography>
                <Typography color="text.secondary" sx={{ mt: 2, lineHeight: 1.8 }}>
                  Rent-It Circle profiles are designed to make peer-to-peer interactions more credible. This page brings
                  together your account reputation, listing activity and response quality in one place.
                </Typography>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Container>
  );
}

export default ProfilePage;
