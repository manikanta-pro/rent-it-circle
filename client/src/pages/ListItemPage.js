import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { categories } from '../data/mockData';
import { useAppData } from '../context/AppDataContext';
import api from '../services/api';

const initialForm = {
  title: '',
  category: 'Photography',
  brand: '',
  description: '',
  condition: 'like-new',
  dailyRate: 25,
  depositAmount: 100,
  location: 'London',
  neighborhood: '',
  postalCode: '',
  latitude: '',
  longitude: '',
  localOnly: true,
  serviceRadiusKm: 10,
  handoffType: 'pickup',
  pickupWindow: 'Pickup in 2 hours',
  minRentalDays: 1,
  maxRentalDays: 7,
  rentalTerms: 'Please return the item clean and on time. Late return fees may apply.',
  damagePolicy: 'Deposit may be used for repair, cleaning, or replacement if damage is confirmed.',
  gallery: [],
  tags: ['Locally available', 'Quality checked', 'Fast response'],
};

function ListItemPage() {
  const [form, setForm] = useState(initialForm);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [notice, setNotice] = useState({ message: '', severity: 'success' });
  const { createItem } = useAppData();
  const navigate = useNavigate();

  const onChange = (field) => (event) => {
    setForm((prev) => ({
      ...prev,
      [field]: ['dailyRate', 'depositAmount'].includes(field)
        ? Number(event.target.value)
        : ['minRentalDays', 'maxRentalDays', 'serviceRadiusKm'].includes(field)
          ? Number(event.target.value)
        : ['localOnly'].includes(field)
          ? event.target.value === 'true'
        : event.target.value,
    }));
  };

  const handleSubmit = async () => {
    try {
      let uploadedImages = form.gallery;

      if (selectedFiles.length) {
        const formData = new FormData();
        selectedFiles.forEach((file) => formData.append('images', file));
        const uploadResponse = await api.post('/items/uploads', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        uploadedImages = uploadResponse.data.images;
      }

      const created = await createItem({
        title: form.title,
        category: form.category,
        brand: form.brand,
        description: form.description,
        condition: form.condition,
        dailyRate: form.dailyRate,
        depositAmount: form.depositAmount,
        damagePolicy: form.damagePolicy,
        location: form.location,
        neighborhood: form.neighborhood,
        postalCode: form.postalCode,
        latitude: form.latitude || null,
        longitude: form.longitude || null,
        localOnly: form.localOnly,
        serviceRadiusKm: form.serviceRadiusKm,
        handoffType: form.handoffType,
        pickupWindow: form.pickupWindow,
        minRentalDays: form.minRentalDays,
        maxRentalDays: form.maxRentalDays,
        rentalTerms: form.rentalTerms,
        images: uploadedImages,
        tags: form.tags,
      });
      setNotice({ message: 'Listing published successfully.', severity: 'success' });
      setTimeout(() => {
        navigate(`/marketplace/${created.id}`);
      }, 700);
    } catch (error) {
      setNotice({
        message: error?.response?.data?.error || 'Unable to publish listing right now.',
        severity: 'error',
      });
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 5, md: 7 } }}>
      <Card>
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Stack spacing={4}>
            <Box>
              <Typography variant="h2" sx={{ fontSize: { xs: '2.25rem', md: '3.25rem' } }}>
                Create a premium listing
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                Better listing detail creates trust, improves approval quality and reduces repetitive host questions.
              </Typography>
            </Box>

            {notice.message ? <Alert severity={notice.severity}>{notice.message}</Alert> : null}

            <Grid container spacing={2.5}>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Listing title" value={form.title} onChange={onChange('title')} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField select fullWidth label="Category" value={form.category} onChange={onChange('category')}>
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Brand or model" value={form.brand} onChange={onChange('brand')} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField select fullWidth label="Handoff type" value={form.handoffType} onChange={onChange('handoffType')}>
                  {['pickup', 'meetup', 'delivery'].map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  minRows={5}
                  label="Description"
                  value={form.description}
                  onChange={onChange('description')}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  label="Condition"
                  value={form.condition}
                  onChange={onChange('condition')}
                >
                  {['new', 'like-new', 'good', 'fair'].map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Daily rate (£)"
                  type="number"
                  value={form.dailyRate}
                  onChange={onChange('dailyRate')}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Deposit amount (£)"
                  type="number"
                  value={form.depositAmount}
                  onChange={onChange('depositAmount')}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="City" value={form.location} onChange={onChange('location')} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Neighborhood"
                  value={form.neighborhood}
                  onChange={onChange('neighborhood')}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Postal code"
                  value={form.postalCode}
                  onChange={onChange('postalCode')}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Pickup window"
                  value={form.pickupWindow}
                  onChange={onChange('pickupWindow')}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Latitude"
                  value={form.latitude}
                  onChange={onChange('latitude')}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Longitude"
                  value={form.longitude}
                  onChange={onChange('longitude')}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  label="Local access"
                  value={String(form.localOnly)}
                  onChange={onChange('localOnly')}
                >
                  <MenuItem value="true">Only local renters</MenuItem>
                  <MenuItem value="false">Allow wider area</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Service radius (km)"
                  type="number"
                  value={form.serviceRadiusKm}
                  onChange={onChange('serviceRadiusKm')}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Minimum rental days"
                  type="number"
                  value={form.minRentalDays}
                  onChange={onChange('minRentalDays')}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Maximum rental days"
                  type="number"
                  value={form.maxRentalDays}
                  onChange={onChange('maxRentalDays')}
                />
              </Grid>
              <Grid item xs={12}>
                <Button variant="outlined" component="label">
                  Upload product images
                  <input
                    hidden
                    type="file"
                    multiple
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(event) => setSelectedFiles(Array.from(event.target.files || []))}
                  />
                </Button>
                <Typography color="text.secondary" sx={{ mt: 1 }}>
                  {selectedFiles.length
                    ? `${selectedFiles.length} image file(s) selected`
                    : 'Upload real item photos. JPG, PNG, and WEBP are supported.'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  minRows={4}
                  label="Damage policy"
                  value={form.damagePolicy}
                  onChange={onChange('damagePolicy')}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  minRows={4}
                  label="Rental terms"
                  value={form.rentalTerms}
                  onChange={onChange('rentalTerms')}
                />
              </Grid>
            </Grid>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button variant="contained" size="large" onClick={handleSubmit}>
                Publish listing
              </Button>
              <Button variant="outlined" size="large" onClick={() => setForm(initialForm)}>
                Reset
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}

export default ListItemPage;
