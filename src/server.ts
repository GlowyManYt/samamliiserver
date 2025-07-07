import { createServer } from 'http';
import App from './app';
import { config } from './config/environment';

class Server {
  private app: App;
  private server: any;

  constructor() {
    this.app = new App();
    this.server = createServer(this.app.getApp());
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


}

// Start the server
const server = new Server();
server.start();

export default server;
