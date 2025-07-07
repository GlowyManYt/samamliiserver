// Vercel serverless function entry point
const { createServer } = require('http');
const { Server: SocketIOServer } = require('socket.io');

// Import the compiled app
let app;
try {
  // Try to import from dist first (if built)
  app = require('../dist/app').default;
} catch (error) {
  // Fallback to TypeScript source with ts-node
  require('ts-node/register');
  app = require('../src/app').default;
}

// Create app instance
const appInstance = new app();
const expressApp = appInstance.getApp();

// Export for Vercel
module.exports = expressApp;
