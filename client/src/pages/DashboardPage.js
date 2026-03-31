import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import AddRounded from '@mui/icons-material/AddRounded';
import { Link } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';

function DashboardPage() {
  const { myListings, myRentals, platformStats, updateRentalStatus } = useAppData();

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 5, md: 7 } }}>
      <Stack spacing={4}>
        <Card
          sx={{
            background: 'linear-gradient(135deg, rgba(15,118,110,1), rgba(8,47,73,1))',
            color: 'common.white',
          }}
        >
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Typography variant="h2" sx={{ fontSize: { xs: '2.1rem', md: '3.25rem' } }}>
                  Host and renter command center
                </Typography>
                <Typography sx={{ mt: 1.5, opacity: 0.84, maxWidth: 680 }}>
                  Monitor requests, spot listing performance and keep rental turnover efficient without leaving the app.
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Stack spacing={1.5}>
                  <Button component={Link} to="/list-your-item" variant="contained" color="secondary" startIcon={<AddRounded />}>
                    Add new listing
                  </Button>
                  <Typography sx={{ opacity: 0.8 }}>
                    {platformStats.items} active marketplace items and {platformStats.activeRentals} ongoing requests.
                  </Typography>
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Grid container spacing={3}>
          {[
            ['Your listings', myListings.length],
            ['Rental activity', myRentals.length],
            ['Platform savings trend', platformStats.savings],
            ['Median response', platformStats.responseTime],
          ].map(([label, value]) => (
            <Grid item xs={12} sm={6} lg={3} key={label}>
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Typography color="text.secondary">{label}</Typography>
                  <Typography variant="h3" sx={{ mt: 1 }}>
                    {value}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3}>
          <Grid item xs={12} lg={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 3.5 }}>
                <Typography variant="h5">Your listings</Typography>
                <Stack spacing={2.5} sx={{ mt: 3 }}>
                  {myListings.length ? (
                    myListings.map((item) => (
                      <Box key={item.id} sx={{ p: 2.5, borderRadius: 4, bgcolor: 'rgba(148,163,184,0.08)' }}>
                        <Stack direction="row" justifyContent="space-between" spacing={2}>
                          <Box>
                            <Typography fontWeight={800}>{item.title}</Typography>
                            <Typography color="text.secondary">{item.location}</Typography>
                          </Box>
                          <Typography color="primary.main" fontWeight={800}>
                            Rs. {item.dailyRate.toLocaleString()}
                          </Typography>
                        </Stack>
                      </Box>
                    ))
                  ) : (
                    <Typography color="text.secondary">No listings yet. Publish one to start earning.</Typography>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 3.5 }}>
                <Typography variant="h5">Rental requests</Typography>
                <Stack spacing={2.5} sx={{ mt: 3 }}>
                  {myRentals.length ? (
                    myRentals.map((rental) => (
                      <Box key={rental.id}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2}>
                          <Box>
                            <Typography fontWeight={800}>{rental.itemTitle}</Typography>
                            <Typography color="text.secondary">
                              {rental.startDate} to {rental.endDate}
                            </Typography>
                          </Box>
                          <Chip label={rental.status} color={rental.status === 'pending' ? 'secondary' : 'primary'} />
                        </Stack>
                        <Typography sx={{ mt: 1.25 }} color="text.secondary">
                          {rental.message}
                        </Typography>
                        {rental.status === 'pending' ? (
                          <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
                            <Button variant="contained" size="small" onClick={() => updateRentalStatus(rental.id, 'approved')}>
                              Approve
                            </Button>
                            <Button variant="outlined" size="small" onClick={() => updateRentalStatus(rental.id, 'cancelled')}>
                              Decline
                            </Button>
                          </Stack>
                        ) : null}
                        <Divider sx={{ mt: 2.5 }} />
                      </Box>
                    ))
                  ) : (
                    <Typography color="text.secondary">No rental activity yet.</Typography>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Stack>
    </Container>
  );
}

export default DashboardPage;
