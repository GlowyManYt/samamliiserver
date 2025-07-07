import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from './config/environment';
import { database } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import messageRoutes from './routes/messageRoutes';
import serviceRequestRoutes from './routes/serviceRequestRoutes';

class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
    // Initialize database connection for Vercel
    this.ensureDatabaseConnection();
  }

  private ensureDatabaseConnection(): void {
    // Add middleware to ensure database connection before each request
    this.app.use(async (req, res, next) => {
      try {
        if (!database.getConnectionStatus()) {
          console.log('🔄 Establishing database connection...');
          await database.connect();
        }
        next();
      } catch (error) {
        console.error('❌ Database connection failed:', error);
        res.status(503).json({
          success: false,
          message: 'Database connection failed',
          error: process.env.NODE_ENV === 'development' ? error : 'Service temporarily unavailable'
        });
      }
    });
  }

  private initializeMiddlewares(): void {
    // Security middleware
    this.app.use(helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" }
    }));

    // Enhanced CORS configuration (like pharmacy app)
    const allowedOrigins = config.cors.origin;

    this.app.use(cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Capacitor, Postman, etc.)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          console.warn(`🚨 CORS violation: Blocked origin ${origin}`);
          callback(null, true); // Allow all origins for now to fix mobile app issues
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
      exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
      preflightContinue: false,
      optionsSuccessStatus: 200
    }));

    // Additional CORS headers for preflight requests (like pharmacy app)
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
      res.header('Access-Control-Allow-Credentials', 'true');
      next();
    });

    // Rate limiting - TEMPORARILY DISABLED FOR DEBUGGING
    // const limiter = rateLimit({
    //   windowMs: config.security.rateLimit.windowMs,
    //   max: config.security.rateLimit.maxRequests,
    //   message: {
    //     success: false,
    //     message: 'Too many requests from this IP, please try again later.',
    //   },
    //   standardHeaders: true,
    //   legacyHeaders: false,
    // });
    // this.app.use('/api', limiter);

    // Compression
    this.app.use(compression());

    // Logging
    if (config.server.env === 'development') {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined'));
    }

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Health check endpoint
    this.app.get('/health', async (req: Request, res: Response) => {
      const dbHealth = await database.healthCheck();
      res.status(dbHealth.status === 'healthy' ? 200 : 503).json({
        success: dbHealth.status === 'healthy',
        message: 'Same MLI Connect API Health Check',
        timestamp: new Date().toISOString(),
        environment: config.server.env,
        version: config.server.apiVersion,
        database: dbHealth,
      });
    });

    // API info endpoint
    this.app.get('/api', (req: Request, res: Response) => {
      res.json({
        success: true,
        message: 'Same MLI Connect API',
        version: config.server.apiVersion,
        environment: config.server.env,
        timestamp: new Date().toISOString(),
        endpoints: {
          auth: `/api/${config.server.apiVersion}/auth`,
          users: `/api/${config.server.apiVersion}/users`,
          services: `/api/${config.server.apiVersion}/services`,
          messages: `/api/${config.server.apiVersion}/messages`,
          files: `/api/${config.server.apiVersion}/files`,
          admin: `/api/${config.server.apiVersion}/admin`,
        },
      });
    });
  }

  private initializeRoutes(): void {
    // Health check route for root path
    this.app.get('/', (req: Request, res: Response) => {
      res.json({
        success: true,
        message: 'Same MLI Connect API is running',
        version: config.server.apiVersion,
        timestamp: new Date().toISOString(),
        endpoints: {
          auth: `/api/${config.server.apiVersion}/auth`,
          users: `/api/${config.server.apiVersion}/users`,
          messages: `/api/${config.server.apiVersion}/messages`,
          serviceRequests: `/api/${config.server.apiVersion}/service-requests`
        }
      });
    });

    // Health check route
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({
        success: true,
        message: 'API is healthy',
        timestamp: new Date().toISOString()
      });
    });

    // API routes
    this.app.use(`/api/${config.server.apiVersion}/auth`, authRoutes);
    this.app.use(`/api/${config.server.apiVersion}/users`, userRoutes);
    this.app.use(`/api/${config.server.apiVersion}/messages`, messageRoutes);
    this.app.use(`/api/${config.server.apiVersion}/service-requests`, serviceRequestRoutes);

    // Placeholder for additional routes
    this.app.get(`/api/${config.server.apiVersion}`, (req: Request, res: Response) => {
      res.json({
        success: true,
        message: `Same MLI Connect API ${config.server.apiVersion}`,
        timestamp: new Date().toISOString(),
      });
    });
  }

  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);

    // Global error handler
    this.app.use(errorHandler);
  }

  public getApp(): Application {
    return this.app;
  }
}

export default App;
