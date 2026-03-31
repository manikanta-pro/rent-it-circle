import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function AuthPage() {
  const navigate = useNavigate();
  const { login, register, isAuthenticated } = useAuth();
  const [tab, setTab] = useState(0);
  const [notice, setNotice] = useState('');
  const [loginForm, setLoginForm] = useState({
    email: 'aarav@rentitcircle.com',
    password: 'demo123',
  });
  const [registerForm, setRegisterForm] = useState({
    fullName: '',
    email: '',
    location: 'Bengaluru',
    password: '',
  });

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogin = async () => {
    const result = await login(loginForm);
    setNotice(result.message || 'Signed in successfully.');
    navigate('/dashboard');
  };

  const handleRegister = async () => {
    const result = await register(registerForm);
    setNotice(result.message || 'Account created successfully.');
    navigate('/dashboard');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        py: 6,
        background:
          'radial-gradient(circle at top left, rgba(15,118,110,0.22), transparent 28%), radial-gradient(circle at bottom right, rgba(249,115,22,0.2), transparent 24%), #f4f6fb',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={3} alignItems="stretch">
          <Grid item xs={12} md={5}>
            <Card sx={{ height: '100%', background: 'linear-gradient(180deg, #0f766e, #0f172a)', color: 'common.white' }}>
              <CardContent sx={{ p: 4, height: '100%' }}>
                <Stack spacing={3} justifyContent="space-between" sx={{ height: '100%' }}>
                  <Box>
                    <Typography variant="h3">Access a serious rental experience</Typography>
                    <Typography sx={{ mt: 2, opacity: 0.82 }}>
                      Sign in to publish listings, manage requests and keep your local rental reputation visible.
                    </Typography>
                  </Box>
                  <Stack spacing={1.5}>
                    <Typography sx={{ opacity: 0.82 }}>Demo sign-in works even if the backend is offline.</Typography>
                    <Typography sx={{ opacity: 0.82 }}>Email: `aarav@rentitcircle.com`</Typography>
                    <Typography sx={{ opacity: 0.82 }}>Password: `demo123`</Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={7}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 4 }}>
                <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ mb: 3 }}>
                  <Tab label="Sign in" />
                  <Tab label="Create account" />
                </Tabs>

                {notice ? <Alert severity="info" sx={{ mb: 3 }}>{notice}</Alert> : null}

                {tab === 0 ? (
                  <Stack spacing={2.5}>
                    <TextField
                      label="Email"
                      value={loginForm.email}
                      onChange={(event) => setLoginForm((prev) => ({ ...prev, email: event.target.value }))}
                    />
                    <TextField
                      label="Password"
                      type="password"
                      value={loginForm.password}
                      onChange={(event) => setLoginForm((prev) => ({ ...prev, password: event.target.value }))}
                    />
                    <Button variant="contained" size="large" onClick={handleLogin}>
                      Sign in
                    </Button>
                  </Stack>
                ) : (
                  <Stack spacing={2.5}>
                    <TextField
                      label="Full name"
                      value={registerForm.fullName}
                      onChange={(event) => setRegisterForm((prev) => ({ ...prev, fullName: event.target.value }))}
                    />
                    <TextField
                      label="Email"
                      value={registerForm.email}
                      onChange={(event) => setRegisterForm((prev) => ({ ...prev, email: event.target.value }))}
                    />
                    <TextField
                      label="City"
                      value={registerForm.location}
                      onChange={(event) => setRegisterForm((prev) => ({ ...prev, location: event.target.value }))}
                    />
                    <TextField
                      label="Password"
                      type="password"
                      value={registerForm.password}
                      onChange={(event) => setRegisterForm((prev) => ({ ...prev, password: event.target.value }))}
                    />
                    <Button variant="contained" size="large" onClick={handleRegister}>
                      Create account
                    </Button>
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default AuthPage;
