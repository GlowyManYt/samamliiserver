import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';

// Import route handlers (simplified for Vercel)
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();

// Simple database connection for Vercel
async function connectDatabase() {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is required');
    }

    await mongoose.connect(mongoUri, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
    });

    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    throw error;
  }
}

// Connect to database
connectDatabase().catch(console.error);

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

// Simple API routes for testing
app.get('/api/v1/test', (req, res) => {
  res.json({
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.post('/api/v1/auth/test', (req, res) => {
  res.json({
    message: 'Auth endpoint is working!',
    body: req.body
  });
});

app.get('/api/v1/users/test', (req, res) => {
  res.json({
    message: 'Users endpoint is working!',
    database_connected: mongoose.connection.readyState === 1
  });
});

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
    database_status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    endpoints: {
      test: '/api/v1/test',
      auth_test: '/api/v1/auth/test',
      users_test: '/api/v1/users/test'
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
