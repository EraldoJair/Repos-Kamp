import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import createInitialUsers from './scripts/createInitialUsers.js';
import authRoutes from './routes/auth.js';
import purchaseRoutes from './routes/purchases.js';
import userRoutes from './routes/users.js';
import warehouseRoutes from './routes/warehouses.js';
import warehouseOperationsRoutes from './routes/warehouseOperations.js';
import { errorHandler } from './middleware/errorHandler.js';
import http from 'http';
import { Server } from 'socket.io';

dotenv.config();

const app = express();
app.set('trust proxy', 1); // Trust the first proxy (Nginx)
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://your-production-domain.com'] 
      : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174'],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware to attach io to req
app.use((req, res, next) => {
  req.io = io;
  next();
});

const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-production-domain.com'] 
    : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/users', userRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/warehouse-ops', warehouseOperationsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server only after database connection is established
const startServer = async () => {
  try {
    // Wait for MongoDB connection to be established
    await connectDB();
    await createInitialUsers();

    io.on('connection', (socket) => {
      console.log('🔌 A user connected', socket.id);

      socket.on('disconnect', () => {
        console.log('👋 User disconnected', socket.id);
      });
    });
    
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 API URL: http://localhost:${PORT}/api`);
      console.log(`📦 Warehouse module: ENABLED`);
      console.log(`📡 Socket.IO server initialized`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();