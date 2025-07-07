import App from './app';

// Create and export the Express app for Vercel
const app = new App();
export default app.getApp();
