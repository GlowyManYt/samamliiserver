import { VercelRequest, VercelResponse } from '@vercel/node';
import App from '../src/app';

// Create the Express app
const app = new App();
const expressApp = app.getApp();

// Export the handler for Vercel
export default (req: VercelRequest, res: VercelResponse) => {
  return expressApp(req, res);
};
