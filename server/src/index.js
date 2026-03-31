import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { testDatabaseConnection } from './config/database.js';
import authRoutes from './routes/auth.routes.js';
import itemRoutes from './routes/item.routes.js';
import rentalRoutes from './routes/rental.routes.js';
import userRoutes from './routes/user.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
const io = new Server(httpServer, {
  cors: {
    origin: clientUrl,
    credentials: true,
  },
});

app.use(
  cors({
    origin: clientUrl,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

io.on('connection', (socket) => {
  socket.on('join-rental', (rentalId) => {
    socket.join(`rental-${rentalId}`);
  });

  socket.on('rental-message', (data) => {
    io.to(`rental-${data.rentalId}`).emit('new-message', data);
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/rentals', rentalRoutes);
app.use('/api/users', userRoutes);

app.get('/api/health', async (req, res) => {
  try {
    await testDatabaseConnection();
    res.json({ status: 'OK', timestamp: new Date() });
  } catch (error) {
    res.status(500).json({ status: 'ERROR', message: 'Database connection failed' });
  }
});

app.use(errorHandler);

const PORT = Number(process.env.PORT || 5000);

httpServer.listen(PORT, async () => {
  try {
    await testDatabaseConnection();
    console.log(`Server running on port ${PORT}`);
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }
});

export { io };
