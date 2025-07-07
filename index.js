const App = require('./dist/app').default;
const { database } = require('./dist/config/database');

// Create the Express app instance
const appInstance = new App();
const app = appInstance.getApp();

// Ensure database connection is established for Vercel serverless
let isConnecting = false;

const ensureConnection = async () => {
  if (isConnecting) return;
  isConnecting = true;

  try {
    if (!database.getConnectionStatus()) {
      console.log('🔄 Vercel: Establishing database connection...');
      await database.connect();
      console.log('✅ Vercel: Database connected successfully');
    }
  } catch (error) {
    console.error('❌ Vercel: Database connection failed:', error);
  } finally {
    isConnecting = false;
  }
};

// Initialize connection on startup
ensureConnection();

module.exports = app;
