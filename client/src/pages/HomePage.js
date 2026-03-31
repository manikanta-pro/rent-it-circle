import React from 'react';
import {
  Avatar,
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
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import VerifiedRounded from '@mui/icons-material/VerifiedRounded';
import PlaceRounded from '@mui/icons-material/PlaceRounded';
import BoltRounded from '@mui/icons-material/BoltRounded';
import { Link } from 'react-router-dom';
import { categories, initialItems, testimonials, trustSignals } from '../data/mockData';

function HomePage() {
  return (
    <Box>
      <Container maxWidth="xl" sx={{ pt: { xs: 6, md: 9 } }}>
        <Grid container spacing={4} alignItems="stretch">
          <Grid item xs={12} lg={7}>
            <Card
              sx={{
                minHeight: '100%',
                overflow: 'hidden',
                background:
                  'linear-gradient(135deg, rgba(15,118,110,1) 0%, rgba(8,47,73,1) 55%, rgba(249,115,22,0.95) 100%)',
                color: 'common.white',
                position: 'relative',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.18), transparent 25%), radial-gradient(circle at 80% 30%, rgba(255,255,255,0.22), transparent 18%), linear-gradient(to top, rgba(255,255,255,0.06), rgba(255,255,255,0))',
                }}
              />
              <CardContent sx={{ position: 'relative', p: { xs: 3.5, md: 5 } }}>
                <Stack spacing={3}>
                  <Chip
                    label="Community-first rental platform"
                    sx={{ bgcolor: 'rgba(255,255,255,0.14)', color: 'common.white', width: 'fit-content' }}
                  />
                  <Typography variant="h1" sx={{ fontSize: { xs: '3rem', md: '5rem' }, lineHeight: 0.95 }}>
                    Rent what you need. List what you already own.
                  </Typography>
                  <Typography sx={{ fontSize: { xs: '1rem', md: '1.15rem' }, maxWidth: 620, opacity: 0.88 }}>
                    A premium local marketplace for everyday gear, creative equipment, event setups and specialist tools.
                    Faster than buying. Smarter than storing.
                  </Typography>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <Button
                      component={Link}
                      to="/marketplace"
                      variant="contained"
                      color="secondary"
                      size="large"
                      endIcon={<ArrowForwardRounded />}
                    >
                      Explore marketplace
                    </Button>
                    <Button
                      component={Link}
                      to="/list-your-item"
                      variant="outlined"
                      size="large"
                      sx={{ color: 'common.white', borderColor: 'rgba(255,255,255,0.4)' }}
                    >
                      Start earning from idle items
                    </Button>
                  </Stack>
                  <Grid container spacing={2} sx={{ pt: 2 }}>
                    {trustSignals.map((signal) => (
                      <Grid item xs={6} md={3} key={signal.label}>
                        <Typography variant="h4">{signal.value}</Typography>
                        <Typography sx={{ opacity: 0.8 }}>{signal.label}</Typography>
                      </Grid>
                    ))}
                  </Grid>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={5}>
            <Stack spacing={3} sx={{ height: '100%' }}>
              <Card sx={{ flex: 1, background: 'linear-gradient(180deg, #ffffff, #effdf8)' }}>
                <CardContent sx={{ p: 3.5 }}>
                  <Stack spacing={2.5}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="h5">Today&apos;s high-intent listings</Typography>
                      <Chip label="Updated live" color="primary" />
                    </Stack>
                    {initialItems.slice(0, 3).map((item) => (
                      <Stack
                        key={item.id}
                        direction="row"
                        spacing={2}
                        alignItems="center"
                        sx={{ p: 1.5, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.7)' }}
                      >
                        <Box
                          component="img"
                          src={item.image}
                          alt={item.title}
                          sx={{ width: 86, height: 86, borderRadius: 3, objectFit: 'cover' }}
                        />
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography fontWeight={700}>{item.title}</Typography>
                          <Stack direction="row" spacing={1} mt={0.75} alignItems="center">
                            <PlaceRounded sx={{ fontSize: 18, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              {item.location}
                            </Typography>
                          </Stack>
                          <Typography variant="body2" sx={{ mt: 1, color: 'primary.main', fontWeight: 700 }}>
                            Rs. {item.dailyRate.toLocaleString()} / day
                          </Typography>
                        </Box>
                      </Stack>
                    ))}
                  </Stack>
                </CardContent>
              </Card>

              <Card id="why-local" sx={{ background: '#0f172a', color: 'common.white' }}>
                <CardContent sx={{ p: 3.5 }}>
                  <Stack spacing={2}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.12)' }}>
                        <VerifiedRounded />
                      </Avatar>
                      <Typography variant="h5">Built for trust, not just transactions</Typography>
                    </Stack>
                    <Typography sx={{ opacity: 0.84 }}>
                      Verified hosts, transparent deposits, fast approval windows and community ratings reduce friction in
                      local rentals.
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      <Chip label="Identity aware" sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'common.white' }} />
                      <Chip label="Deposit protected" sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'common.white' }} />
                      <Chip label="Ratings on every host" sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'common.white' }} />
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>
      </Container>

      <Container maxWidth="xl" sx={{ py: { xs: 7, md: 10 } }} id="how-it-works">
        <Grid container spacing={3}>
          {[
            ['Discover nearby', 'Browse by city, category and availability to find equipment ready for pickup.'],
            ['Book confidently', 'Review condition, deposit, host score and response time before requesting a rental.'],
            ['Use and return', 'Track your rental timeline, manage approvals and build reputation after completion.'],
          ].map(([title, copy], index) => (
            <Grid item xs={12} md={4} key={title}>
              <Card sx={{ height: '100%', background: index === 1 ? 'linear-gradient(180deg,#fff7ed,#ffffff)' : '#fff' }}>
                <CardContent sx={{ p: 3.5 }}>
                  <Chip label={`0${index + 1}`} color="secondary" sx={{ mb: 2 }} />
                  <Typography variant="h5" gutterBottom>
                    {title}
                  </Typography>
                  <Typography color="text.secondary">{copy}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      <Box sx={{ py: { xs: 7, md: 10 }, bgcolor: '#eef8f6' }}>
        <Container maxWidth="xl">
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} mb={4}>
            <Box>
              <Typography variant="h3">Browse high-value categories</Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                Structured around the kinds of items people need briefly but buy reluctantly.
              </Typography>
            </Box>
            <Button component={Link} to="/marketplace" variant="outlined" endIcon={<ArrowForwardRounded />}>
              See all listings
            </Button>
          </Stack>

          <Grid container spacing={3}>
            {categories.map((category, index) => (
              <Grid item xs={12} sm={6} md={4} key={category}>
                <Card
                  sx={{
                    height: '100%',
                    background:
                      index % 2 === 0
                        ? 'linear-gradient(135deg, rgba(15,118,110,0.14), rgba(255,255,255,1))'
                        : 'linear-gradient(135deg, rgba(249,115,22,0.14), rgba(255,255,255,1))',
                  }}
                >
                  <CardContent sx={{ p: 3.5 }}>
                    <Stack spacing={2}>
                      <Avatar sx={{ bgcolor: index % 2 === 0 ? 'primary.main' : 'secondary.main' }}>
                        <BoltRounded />
                      </Avatar>
                      <Typography variant="h5">{category}</Typography>
                      <Typography color="text.secondary">
                        Premium local listings, clearer pricing, and better host context than generic classifieds.
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: { xs: 7, md: 10 } }}>
        <Grid container spacing={3}>
          {testimonials.map((entry) => (
            <Grid item xs={12} md={6} key={entry.author}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h5" sx={{ mb: 3, lineHeight: 1.5 }}>
                    &quot;{entry.quote}&quot;
                  </Typography>
                  <Divider sx={{ mb: 2.5 }} />
                  <Typography fontWeight={800}>{entry.author}</Typography>
                  <Typography color="text.secondary">{entry.role}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}

export default HomePage;
