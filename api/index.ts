import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { connectDatabase } from '../src/config/database';

// Import routes
import authRoutes from '../src/routes/authRoutes';
import userRoutes from '../src/routes/userRoutes';
import serviceRoutes from '../src/routes/serviceRoutes';
import fileRoutes from '../src/routes/fileRoutes';
import messageRoutes from '../src/routes/messageRoutes';
import notificationRoutes from '../src/routes/notificationRoutes';

const app = express();

// Connect to database
connectDatabase();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:8080',
    'http://localhost:8081',
    'http://localhost:8082',
    'http://localhost:3000',
    'capacitor://localhost',
    'ionic://localhost',
    'http://localhost',
    'https://localhost',
    'file://',
    'capacitor-electron://',
    'capacitor://',
    'ionic://',
    'http://10.0.2.2:8080',
    'http://10.0.2.2:8081',
    'http://10.0.2.2:8082'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Compression
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/services', serviceRoutes);
app.use('/api/v1/files', fileRoutes);
app.use('/api/v1/messages', messageRoutes);
app.use('/api/v1/notifications', notificationRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Same MLI Connect API is running',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Same MLI Connect API',
    status: 'active',
    version: 'v1',
    endpoints: {
      health: '/health',
      api: '/api/v1',
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      services: '/api/v1/services',
      files: '/api/v1/files',
      messages: '/api/v1/messages',
      notifications: '/api/v1/notifications'
    }
  });
});

app.get('/api/v1', (req, res) => {
  res.json({
    message: 'Same MLI Connect API v1',
    status: 'active',
    endpoints: {
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      services: '/api/v1/services',
      files: '/api/v1/files',
      messages: '/api/v1/messages',
      notifications: '/api/v1/notifications'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

export default app;
