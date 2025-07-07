const App = require('../dist/app').default;

// Create the Express app instance
const appInstance = new App();
const app = appInstance.getApp();

// Export the app for Vercel serverless functions
module.exports = app;
