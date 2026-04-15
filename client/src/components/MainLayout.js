import React, { useState } from 'react';
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';
import MenuRounded from '@mui/icons-material/MenuRounded';
import AddRounded from '@mui/icons-material/AddRounded';
import DashboardRounded from '@mui/icons-material/DashboardRounded';
import StorefrontRounded from '@mui/icons-material/StorefrontRounded';
import LogoutRounded from '@mui/icons-material/LogoutRounded';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { label: 'Discover', to: '/marketplace', type: 'route' },
  { label: 'How it works', targetId: 'how-it-works', type: 'section' },
  { label: 'Why local', targetId: 'why-local', type: 'section' },
];

function MainLayout() {
  const [open, setOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navLinkSx = ({ isActive }) => ({
    color: isActive ? 'text.primary' : 'text.secondary',
    fontWeight: 700,
    px: 1,
    py: 0.75,
    borderRadius: 999,
    bgcolor: isActive ? 'rgba(15, 118, 110, 0.08)' : 'transparent',
  });

  const scrollToSection = (targetId) => {
    const element = document.getElementById(targetId);

    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSectionNavigation = (targetId, closeDrawer = false) => {
    if (closeDrawer) {
      setOpen(false);
    }

    if (location.pathname !== '/') {
      navigate('/');
      window.setTimeout(() => scrollToSection(targetId), 50);
      return;
    }

    scrollToSection(targetId);
  };

  return (
    <Box>
      <AppBar
        position="sticky"
        color="transparent"
        elevation={0}
        sx={{
          backdropFilter: 'blur(18px)',
          borderBottom: '1px solid rgba(148, 163, 184, 0.18)',
          bgcolor: 'rgba(244, 246, 251, 0.78)',
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ gap: 2, py: 1 }}>
            <Stack component={Link} to="/" direction="row" spacing={1.5} alignItems="center">
              <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>R</Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight={800}>
                  Rent-It Circle
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Local gear, shared better
                </Typography>
              </Box>
            </Stack>

            <Stack
              direction="row"
              spacing={1}
              sx={{ display: { xs: 'none', md: 'flex' }, ml: 4 }}
            >
              {navItems.map((item) =>
                item.type === 'route' ? (
                  <Box component={NavLink} key={item.label} to={item.to} sx={navLinkSx}>
                    {item.label}
                  </Box>
                ) : (
                  <Box
                    key={item.label}
                    component="button"
                    type="button"
                    onClick={() => handleSectionNavigation(item.targetId)}
                    sx={{
                      color: 'text.secondary',
                      fontWeight: 700,
                      px: 1,
                      py: 0.75,
                      borderRadius: 999,
                      bgcolor: 'transparent',
                      border: 0,
                      cursor: 'pointer',
                      font: 'inherit',
                    }}
                  >
                    {item.label}
                  </Box>
                )
              )}
            </Stack>

            <Box sx={{ flexGrow: 1 }} />

            <Stack direction="row" spacing={1} sx={{ display: { xs: 'none', md: 'flex' } }}>
              {isAuthenticated ? (
                <>
                  <Button component={Link} to="/list-your-item" variant="contained" startIcon={<AddRounded />}>
                    List an item
                  </Button>
                  <Button component={Link} to="/dashboard" variant="outlined" startIcon={<DashboardRounded />}>
                    Dashboard
                  </Button>
                  <Button component={Link} to="/profile" sx={{ minWidth: 0, px: 1.5 }}>
                    {user?.fullName?.split(' ')[0] || 'Profile'}
                  </Button>
                  <Button
                    color="inherit"
                    startIcon={<LogoutRounded />}
                    onClick={() => {
                      logout();
                      navigate('/');
                    }}
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button component={Link} to="/marketplace" variant="outlined" startIcon={<StorefrontRounded />}>
                    Browse
                  </Button>
                  <Button component={Link} to="/auth" variant="contained">
                    Sign in
                  </Button>
                </>
              )}
            </Stack>

            <IconButton sx={{ display: { xs: 'inline-flex', md: 'none' } }} onClick={() => setOpen(true)}>
              <MenuRounded />
            </IconButton>
          </Toolbar>
        </Container>
      </AppBar>

      <Drawer anchor="right" open={open} onClose={() => setOpen(false)}>
        <Box sx={{ width: 280, p: 3 }}>
          <Stack spacing={2}>
            {navItems.map((item) =>
              item.type === 'route' ? (
                <Button key={item.label} component={Link} to={item.to} onClick={() => setOpen(false)}>
                  {item.label}
                </Button>
              ) : (
                <Button key={item.label} onClick={() => handleSectionNavigation(item.targetId, true)}>
                  {item.label}
                </Button>
              )
            )}
            <Divider />
            {isAuthenticated ? (
              <>
                <Button component={Link} to="/list-your-item" variant="contained" onClick={() => setOpen(false)}>
                  List an item
                </Button>
                <Button component={Link} to="/dashboard" onClick={() => setOpen(false)}>
                  Dashboard
                </Button>
                <Button component={Link} to="/profile" onClick={() => setOpen(false)}>
                  Profile
                </Button>
                <Button
                  color="inherit"
                  startIcon={<LogoutRounded />}
                  onClick={() => {
                    logout();
                    setOpen(false);
                  }}
                >
                  Logout
                </Button>
              </>
            ) : (
              <Button component={Link} to="/auth" variant="contained" onClick={() => setOpen(false)}>
                Sign in
              </Button>
            )}
          </Stack>
        </Box>
      </Drawer>

      <Outlet />

      <Box component="footer" sx={{ py: 8, mt: 8, borderTop: '1px solid rgba(148,163,184,0.16)' }}>
        <Container maxWidth="xl">
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={3}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', md: 'center' }}
          >
            <Box>
              <Typography variant="h6" fontWeight={800}>
                Rent-It Circle
              </Typography>
              <Typography color="text.secondary">
                Designed for high-trust, local peer-to-peer rentals.
              </Typography>
            </Box>
            <Stack direction="row" spacing={2} color="text.secondary">
              <Typography>Secure listings</Typography>
              <Typography>Local pickup</Typography>
              <Typography>Ratings and reviews</Typography>
            </Stack>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}

export default MainLayout;
