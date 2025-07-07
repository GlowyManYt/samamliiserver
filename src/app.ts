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
    this.initializeDatabase();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private async initializeDatabase(): Promise<void> {
    try {
      await database.connect();
    } catch (error) {
      console.error('Failed to connect to database:', error);
      process.exit(1);
    }
  }

  private initializeMiddlewares(): void {
    // Security middleware
    this.app.use(helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" }
    }));

    // CORS configuration
    this.app.use(cors({
      origin: config.cors.origin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    }));

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
