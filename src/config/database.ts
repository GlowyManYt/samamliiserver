import mongoose from 'mongoose';
import { config } from './environment';

class Database {
  private static instance: Database;
  private connectionPromise: Promise<void> | null = null;

  private constructor() {}

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async connect(): Promise<void> {
    // Check if connection is healthy
    if (mongoose.connection.readyState === 1) {
      try {
        // Ping to verify connection is actually working
        await mongoose.connection.db?.admin().ping();
        console.log('Database connection verified and healthy');
        return;
      } catch (error) {
        console.log('Database connection exists but unhealthy, reconnecting...');
        this.connectionPromise = null;
        // Force close the unhealthy connection
        await mongoose.connection.close().catch(() => {});
      }
    }

    // If connection is in progress, wait for it
    if (this.connectionPromise) {
      console.log('Database connection in progress, waiting...');
      return this.connectionPromise;
    }

    // If connection is connecting or disconnecting, wait a bit and retry
    if (mongoose.connection.readyState === 2 || mongoose.connection.readyState === 3) {
      console.log('Database in transition state, waiting...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      return this.connect(); // Retry
    }

    // Start new connection
    this.connectionPromise = this.establishConnection();
    return this.connectionPromise;
  }

  private async establishConnection(): Promise<void> {
    try {
      // PRODUCTION-READY settings - CRITICAL FIX for buffering timeout
      const mongooseOptions = {
        maxPoolSize: 5, // Smaller pool for faster connection
        minPoolSize: 1, // Keep at least 1 connection
        serverSelectionTimeoutMS: 5000, // Faster server selection
        socketTimeoutMS: 20000, // Shorter socket timeout
        connectTimeoutMS: 10000, // Faster connection timeout
        bufferCommands: false, // CRITICAL: Disable buffering to prevent timeout errors
        maxIdleTimeMS: 10000, // Close idle connections quickly
        retryWrites: true,
        retryReads: false, // Disable retry reads for faster failures
        autoIndex: false, // Don't build indexes
        family: 4, // Use IPv4
      };

      console.log('🔄 Connecting to MongoDB...');
      console.log('🔗 URI:', config.database.uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));

      // Force close any existing connection
      if (mongoose.connection.readyState !== 0) {
        console.log('🔄 Force closing existing connection...');
        await mongoose.disconnect();
        // Wait for cleanup
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Connect with timeout protection
      const connectPromise = mongoose.connect(config.database.uri, mongooseOptions);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout after 10 seconds')), 10000);
      });

      await Promise.race([connectPromise, timeoutPromise]);

      // Verify connection is actually working
      console.log('🔄 Verifying connection...');
      await mongoose.connection.db?.admin().ping();

      console.log('✅ MongoDB connected and verified successfully');
      console.log('📊 Connection state:', mongoose.connection.readyState);

      // Set up event handlers (remove old ones first)
      mongoose.connection.removeAllListeners();

      mongoose.connection.on('error', (error) => {
        console.error('❌ MongoDB connection error:', error);
        this.connectionPromise = null;
      });

      mongoose.connection.on('disconnected', () => {
        console.log('⚠️ MongoDB disconnected');
        this.connectionPromise = null;
      });

    } catch (error) {
      console.error('❌ MongoDB connection failed:', error);
      this.connectionPromise = null;

      // Force cleanup
      try {
        await mongoose.disconnect();
      } catch (cleanupError) {
        console.error('❌ Cleanup error:', cleanupError);
      }

      throw new Error(`Database connection failed: ${error.message}`);
    }
  }

  public async disconnect(): Promise<void> {
    if (mongoose.connection.readyState === 0) {
      return;
    }

    try {
      await mongoose.connection.close();
      this.connectionPromise = null;
      console.log('✅ MongoDB disconnected gracefully');
    } catch (error) {
      console.error('❌ Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  public getConnectionStatus(): boolean {
    return mongoose.connection.readyState === 1;
  }

  public async healthCheck(): Promise<{ status: string; message: string }> {
    try {
      // Ensure connection first
      await this.connect();

      if (mongoose.connection.readyState !== 1) {
        return { status: 'error', message: 'Database not connected' };
      }

      // Ping the database
      await mongoose.connection.db?.admin().ping();

      return {
        status: 'healthy',
        message: `Connected to ${mongoose.connection.name} database`
      };
    } catch (error) {
      return {
        status: 'error',
        message: `Database health check failed: ${error}`
      };
    }
  }
}

export const database = Database.getInstance();
