import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import MainLayout from './components/MainLayout';
import { useAuth } from './context/AuthContext';
import HomePage from './pages/HomePage';
import MarketplacePage from './pages/MarketplacePage';
import ItemDetailsPage from './pages/ItemDetailsPage';
import ListItemPage from './pages/ListItemPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import AuthPage from './pages/AuthPage';

const CenteredLoader = () => (
  <Box
    sx={{
      minHeight: '100vh',
      display: 'grid',
      placeItems: 'center',
      background:
        'radial-gradient(circle at top, rgba(190, 224, 255, 0.45), transparent 30%), #f5f7fb',
    }}
  >
    <CircularProgress color="primary" />
  </Box>
);

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <CenteredLoader />;
  }

  return user ? children : <Navigate to="/auth" replace />;
};

function App() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="marketplace" element={<MarketplacePage />} />
        <Route path="marketplace/:itemId" element={<ItemDetailsPage />} />
        <Route
          path="list-your-item"
          element={
            <PrivateRoute>
              <ListItemPage />
            </PrivateRoute>
          }
        />
        <Route
          path="dashboard"
          element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          }
        />
        <Route
          path="profile"
          element={
            <PrivateRoute>
              <ProfilePage />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
