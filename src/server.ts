import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import App from './app';
import { config } from './config/environment';
import { initializeSocket } from './socket/socketHandler';

class Server {
  private app: App;
  private server: any;
  private io!: SocketIOServer; // Using definite assignment assertion

  constructor() {
    this.app = new App();
    this.server = createServer(this.app.getApp());
    this.initializeSocket();
  }

  private initializeSocket(): void {
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: config.cors.origin,
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    // Make Socket.IO instance available to controllers
    this.app.getApp().set('io', this.io);

    // Initialize socket handlers
    initializeSocket(this.io);
  }

  public start(): void {
    this.server.listen(config.server.port, () => {
      console.log('🚀 Server Information:');
      console.log(`   Environment: ${config.server.env}`);
      console.log(`   Port: ${config.server.port}`);
      console.log(`   API Version: ${config.server.apiVersion}`);
      console.log(`   Health Check: http://localhost:${config.server.port}/health`);
      console.log(`   API Endpoint: http://localhost:${config.server.port}/api/${config.server.apiVersion}`);
      console.log('');
      console.log('✅ Same MLI Connect Backend is running successfully!');
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully...');
      this.server.close(() => {
        console.log('Process terminated');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('SIGINT received, shutting down gracefully...');
      this.server.close(() => {
        console.log('Process terminated');
        process.exit(0);
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
  }

  public getServer() {
    return this.server;
  }

  public getIO(): SocketIOServer {
    return this.io;
  }
}

// Start the server
const server = new Server();
server.start();

export default server;
