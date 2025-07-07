// Vercel serverless function entry point
const path = require('path');

// Configure ts-node for TypeScript compilation
require('ts-node').register({
  project: path.join(__dirname, '../tsconfig.json'),
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs',
    target: 'es2020',
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
    resolveJsonModule: true,
    skipLibCheck: true
  }
});

// Import the TypeScript app
const App = require('../src/app').default;

// Create app instance
const appInstance = new App();
const expressApp = appInstance.getApp();

// Export for Vercel
module.exports = expressApp;
