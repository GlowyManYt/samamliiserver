const App = require('../dist/app').default;

// Create and export the Express app for Vercel
const app = new App();
module.exports = app.getApp();
