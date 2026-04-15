import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Container,
  Grid,
  Link as MuiLink,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import FacebookRounded from '@mui/icons-material/FacebookRounded';
import Twitter from '@mui/icons-material/Twitter';
import Instagram from '@mui/icons-material/Instagram';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function AuthPage() {
  const navigate = useNavigate();
  const { login, register, isAuthenticated } = useAuth();
  const [tab, setTab] = useState(0);
  const [notice, setNotice] = useState({ message: '', severity: 'info' });
  const [rememberMe, setRememberMe] = useState(true);
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  });
  const [registerForm, setRegisterForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    city: 'London',
    neighborhood: '',
    postalCode: '',
    accountType: 'both',
    preferredContactMethod: 'in_app',
    bio: '',
    password: '',
  });

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogin = async () => {
    const result = await login(loginForm);
    setNotice({
      message: result.message || 'Signed in successfully.',
      severity: result.ok ? 'success' : 'error',
    });

    if (result.ok) {
      navigate('/dashboard');
    }
  };

  const handleRegister = async () => {
    const result = await register(registerForm);
    setNotice({
      message: result.message || 'Account created successfully.',
      severity: result.ok ? 'success' : 'error',
    });

    if (result.ok) {
      navigate('/dashboard');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#ffffff',
      }}
    >
      <Container maxWidth={false} disableGutters sx={{ width: '100%' }}>
        <Card
          sx={{
            borderRadius: 0,
            overflow: 'hidden',
            boxShadow: 'none',
            minHeight: '100vh',
          }}
        >
          <Grid container sx={{ minHeight: '100vh' }}>
            <Grid item xs={12} md={6}>
              <CardContent
                sx={{
                  minHeight: '100%',
                  p: { xs: 4, sm: 6, md: '7vw' },
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  bgcolor: '#fff',
                }}
              >
                <Box>
                  <Typography
                    sx={{
                      color: '#71717a',
                      fontWeight: 900,
                      fontSize: { xs: '1.8rem', md: '2rem' },
                      letterSpacing: '-0.04em',
                    }}
                  >
                    Rent-It Circle
                  </Typography>

                  <Tabs
                    value={tab}
                    onChange={(_, value) => setTab(value)}
                    sx={{
                      mt: { xs: 6, md: 10 },
                      mb: 3,
                      minHeight: 0,
                      '& .MuiTabs-indicator': { backgroundColor: '#3151ff' },
                    }}
                  >
                    <Tab label="Login" sx={{ minHeight: 0, px: 0, mr: 3 }} />
                    <Tab label="Sign up" sx={{ minHeight: 0, px: 0 }} />
                  </Tabs>

                  {notice.message ? (
                    <Alert severity={notice.severity} sx={{ mb: 2.5, borderRadius: 0 }}>
                      {notice.message}
                    </Alert>
                  ) : null}

                  {tab === 0 ? (
                    <Box>
                      <Box sx={{ border: '1px solid #d4d4d8', maxWidth: 700 }}>
                        <Box sx={{ display: 'flex', minHeight: 92 }}>
                          <Box sx={{ width: 14, bgcolor: '#ff20ea' }} />
                          <Box sx={{ px: 3, py: 2.25, flex: 1 }}>
                            <Typography sx={{ color: '#a1a1aa', fontWeight: 800, letterSpacing: '0.2em', fontSize: '0.78rem' }}>
                              EMAIL ADDRESS
                            </Typography>
                            <TextField
                              variant="standard"
                              fullWidth
                              placeholder="name@mail.com"
                              value={loginForm.email}
                              onChange={(event) => setLoginForm((prev) => ({ ...prev, email: event.target.value }))}
                              InputProps={{
                                disableUnderline: true,
                                sx: { mt: 1, fontSize: '1.3rem', color: '#52525b' },
                              }}
                            />
                          </Box>
                        </Box>

                        <Box sx={{ display: 'flex', minHeight: 92, borderTop: '1px solid #d4d4d8' }}>
                          <Box sx={{ width: 14, bgcolor: 'transparent' }} />
                          <Box sx={{ px: 3, py: 2.25, flex: 1 }}>
                            <Typography sx={{ color: '#a1a1aa', fontWeight: 800, letterSpacing: '0.2em', fontSize: '0.78rem' }}>
                              PASSWORD
                            </Typography>
                            <TextField
                              variant="standard"
                              fullWidth
                              type="password"
                              placeholder="****************"
                              value={loginForm.password}
                              onChange={(event) => setLoginForm((prev) => ({ ...prev, password: event.target.value }))}
                              InputProps={{
                                disableUnderline: true,
                                sx: { mt: 1, fontSize: '1.3rem', color: '#52525b' },
                              }}
                            />
                          </Box>
                        </Box>
                      </Box>

                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        sx={{ mt: 1.5, mb: 4, maxWidth: 700, flexWrap: 'wrap', rowGap: 1 }}
                      >
                        <Stack direction="row" spacing={0.75} alignItems="center">
                          <Checkbox
                            checked={rememberMe}
                            onChange={(event) => setRememberMe(event.target.checked)}
                            sx={{ p: 0.5 }}
                          />
                          <Typography sx={{ color: '#d4d4d8', fontWeight: 500 }}>Remember me</Typography>
                        </Stack>
                        <MuiLink underline="none" sx={{ color: '#d4d4d8', fontWeight: 500, cursor: 'pointer' }}>
                          Forget password?
                        </MuiLink>
                      </Stack>

                      <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', rowGap: 2 }}>
                        <Button
                          variant="contained"
                          onClick={handleLogin}
                          sx={{
                            minWidth: 180,
                            borderRadius: 0,
                            py: 1.55,
                            px: 4,
                            bgcolor: '#ff20ea',
                            boxShadow: 'none',
                            fontWeight: 800,
                            letterSpacing: '0.04em',
                            '&:hover': { bgcolor: '#ec10d7', boxShadow: 'none' },
                          }}
                        >
                          Login
                        </Button>
                        <Button
                          variant="outlined"
                          onClick={() => setTab(1)}
                          sx={{
                            minWidth: 180,
                            borderRadius: 0,
                            py: 1.55,
                            px: 4,
                            borderColor: '#3151ff',
                            color: '#3151ff',
                            fontWeight: 800,
                            letterSpacing: '0.04em',
                          }}
                        >
                          Sign up
                        </Button>
                      </Stack>
                    </Box>
                  ) : (
                    <Stack spacing={1.5} sx={{ maxWidth: 700 }}>
                      <Grid container spacing={1.5}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Full name"
                            value={registerForm.fullName}
                            onChange={(event) => setRegisterForm((prev) => ({ ...prev, fullName: event.target.value }))}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Phone"
                            value={registerForm.phone}
                            onChange={(event) => setRegisterForm((prev) => ({ ...prev, phone: event.target.value }))}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Email"
                            value={registerForm.email}
                            onChange={(event) => setRegisterForm((prev) => ({ ...prev, email: event.target.value }))}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="City"
                            value={registerForm.city}
                            onChange={(event) => setRegisterForm((prev) => ({ ...prev, city: event.target.value }))}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Neighborhood"
                            value={registerForm.neighborhood}
                            onChange={(event) => setRegisterForm((prev) => ({ ...prev, neighborhood: event.target.value }))}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Postal code"
                            value={registerForm.postalCode}
                            onChange={(event) => setRegisterForm((prev) => ({ ...prev, postalCode: event.target.value }))}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Password"
                            type="password"
                            value={registerForm.password}
                            onChange={(event) => setRegisterForm((prev) => ({ ...prev, password: event.target.value }))}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Bio"
                            multiline
                            minRows={3}
                            value={registerForm.bio}
                            onChange={(event) => setRegisterForm((prev) => ({ ...prev, bio: event.target.value }))}
                          />
                        </Grid>
                      </Grid>

                      <Stack direction="row" spacing={2} sx={{ pt: 1, flexWrap: 'wrap', rowGap: 2 }}>
                        <Button
                          variant="contained"
                          onClick={handleRegister}
                          sx={{
                            minWidth: 180,
                            borderRadius: 0,
                            py: 1.55,
                            px: 4,
                            bgcolor: '#ff20ea',
                            boxShadow: 'none',
                            fontWeight: 800,
                            letterSpacing: '0.04em',
                            '&:hover': { bgcolor: '#ec10d7', boxShadow: 'none' },
                          }}
                        >
                          Create account
                        </Button>
                        <Button
                          variant="outlined"
                          onClick={() => setTab(0)}
                          sx={{
                            minWidth: 180,
                            borderRadius: 0,
                            py: 1.55,
                            px: 4,
                            borderColor: '#3151ff',
                            color: '#3151ff',
                            fontWeight: 800,
                            letterSpacing: '0.04em',
                          }}
                        >
                          Back to login
                        </Button>
                      </Stack>
                    </Stack>
                  )}
                </Box>

                <Stack direction="row" spacing={2.5} alignItems="center" sx={{ mt: 5, color: '#71717a', flexWrap: 'wrap' }}>
                  <Typography sx={{ fontWeight: 800, letterSpacing: '0.18em' }}>FOLLOW</Typography>
                  <FacebookRounded />
                  <Twitter />
                  <Instagram />
                </Stack>
              </CardContent>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  minHeight: { xs: 360, md: '100vh' },
                  position: 'relative',
                  overflow: 'hidden',
                  background:
                    'linear-gradient(145deg, #1c8a85 0%, #184c67 42%, #0f3556 65%, #ea7a2f 100%)',
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 2,
                    textAlign: 'center',
                    width: '100%',
                    px: 3,
                  }}
                >
                  <Typography
                    sx={{
                      color: 'rgba(255,255,255,0.95)',
                      fontWeight: 300,
                      letterSpacing: '-0.05em',
                      lineHeight: 0.95,
                      fontSize: { xs: '2.8rem', md: '4.8rem' },
                    }}
                  >
                    Hello,
                  </Typography>
                  <Typography
                    sx={{
                      color: '#ffffff',
                      fontWeight: 900,
                      letterSpacing: '-0.06em',
                      lineHeight: 0.9,
                      fontSize: { xs: '3.2rem', md: '5.3rem' },
                      textShadow: '0 10px 28px rgba(9, 30, 66, 0.18)',
                    }}
                  >
                    welcome!
                  </Typography>
                </Box>
                <Box
                  sx={{
                    position: 'absolute',
                    top: -120,
                    left: -110,
                    width: { xs: 320, md: 520 },
                    height: { xs: 320, md: 520 },
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(111, 221, 211, 0.38) 0%, rgba(111, 221, 211, 0.05) 64%, transparent 72%)',
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    top: '14%',
                    right: '10%',
                    width: { xs: 160, md: 260 },
                    height: { xs: 160, md: 260 },
                    borderRadius: '50%',
                    background:
                      'radial-gradient(circle, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.08) 42%, transparent 72%)',
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      'linear-gradient(45deg, transparent 0 47%, rgba(255,255,255,0.08) 47% 48.2%, transparent 48.2% 100%)',
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: -170,
                    right: -120,
                    width: { xs: 320, md: 500 },
                    height: { xs: 320, md: 500 },
                    borderRadius: '50%',
                    border: { xs: '36px solid rgba(255,255,255,0.12)', md: '52px solid rgba(255,255,255,0.12)' },
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: -10,
                    left: 90,
                    width: { xs: 380, md: 760 },
                    height: { xs: 180, md: 300 },
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.05))',
                    clipPath: 'polygon(0 100%, 100% 42%, 100% 100%)',
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      'radial-gradient(circle at bottom right, rgba(255,122,36,0.45), transparent 34%), linear-gradient(180deg, rgba(255,255,255,0.04), rgba(0,0,0,0.08))',
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </Card>
      </Container>
    </Box>
  );
}

export default AuthPage;
