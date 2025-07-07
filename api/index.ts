import App from '../dist/app';

// Create and export the Express app for Vercel
const appInstance = new App();
const app = appInstance.getApp();

export default app;
