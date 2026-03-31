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

const initialForm = {
  title: '',
  category: 'Photography',
  description: '',
  condition: 'like-new',
  dailyRate: 1500,
  depositAmount: 5000,
  location: 'Bengaluru',
  image:
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
  gallery: [
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80',
  ],
  tags: ['Locally available', 'Quality checked', 'Fast response'],
  leadTime: 'Pickup in 2 hours',
};

function ListItemPage() {
  const [form, setForm] = useState(initialForm);
  const [notice, setNotice] = useState('');
  const { createItem } = useAppData();
  const navigate = useNavigate();

  const onChange = (field) => (event) => {
    setForm((prev) => ({
      ...prev,
      [field]: ['dailyRate', 'depositAmount'].includes(field)
        ? Number(event.target.value)
        : event.target.value,
    }));
  };

  const handleSubmit = () => {
    const created = createItem(form);
    setNotice('Listing published successfully.');
    setTimeout(() => {
      navigate(`/marketplace/${created.id}`);
    }, 700);
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

            {notice ? <Alert severity="success">{notice}</Alert> : null}

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
                <TextField fullWidth label="Daily rate" type="number" value={form.dailyRate} onChange={onChange('dailyRate')} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Deposit amount"
                  type="number"
                  value={form.depositAmount}
                  onChange={onChange('depositAmount')}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="City" value={form.location} onChange={onChange('location')} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Pickup promise" value={form.leadTime} onChange={onChange('leadTime')} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Hero image URL" value={form.image} onChange={onChange('image')} />
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
