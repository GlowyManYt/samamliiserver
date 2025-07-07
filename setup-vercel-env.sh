#!/bin/bash

# Setup Vercel Environment Variables
# Run this script if you have Vercel CLI installed: npm i -g vercel

echo "Setting up Vercel environment variables..."

# Required variables
vercel env add MONGODB_URI production
vercel env add JWT_SECRET production
vercel env add CLOUDINARY_CLOUD_NAME production
vercel env add CLOUDINARY_API_KEY production
vercel env add CLOUDINARY_API_SECRET production
vercel env add CLOUDINARY_URL production

# Optional variables
vercel env add NODE_ENV production
vercel env add API_VERSION production
vercel env add JWT_EXPIRES_IN production
vercel env add JWT_REFRESH_SECRET production
vercel env add JWT_REFRESH_EXPIRES_IN production
vercel env add BCRYPT_ROUNDS production
vercel env add ADMIN_EMAIL production

echo "Environment variables setup complete!"
echo "Now redeploy with: vercel --prod"
