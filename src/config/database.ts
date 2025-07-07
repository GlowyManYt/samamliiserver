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
    // If already connected, return immediately
    if (mongoose.connection.readyState === 1) {
      console.log('Database already connected');
      return;
    }

    // If connection is in progress, wait for it
    if (this.connectionPromise) {
      console.log('Database connection in progress, waiting...');
      return this.connectionPromise;
    }

    // Start new connection
    this.connectionPromise = this.establishConnection();
    return this.connectionPromise;
  }

  private async establishConnection(): Promise<void> {
    try {
      // Optimized settings for Vercel serverless
      const mongooseOptions = {
        maxPoolSize: 5, // Reduced for serverless
        serverSelectionTimeoutMS: 10000, // Increased timeout
        socketTimeoutMS: 45000,
        bufferCommands: false, // Disable buffering to get immediate errors
        // Removed deprecated bufferMaxEntries option
      };

      console.log('🔄 Connecting to MongoDB...');
      await mongoose.connect(config.database.uri, mongooseOptions);

      console.log('✅ MongoDB connected successfully');

      // Handle connection events
      mongoose.connection.on('error', (error) => {
        console.error('❌ MongoDB connection error:', error);
        this.connectionPromise = null;
      });

      mongoose.connection.on('disconnected', () => {
        console.log('⚠️ MongoDB disconnected');
        this.connectionPromise = null;
      });

      mongoose.connection.on('reconnected', () => {
        console.log('✅ MongoDB reconnected');
      });

    } catch (error) {
      console.error('❌ MongoDB connection failed:', error);
      this.connectionPromise = null;
      throw error;
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
