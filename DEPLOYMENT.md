# Same MLI Connect Backend - Vercel Deployment Guide

## Prerequisites
- Vercel account
- MongoDB Atlas database
- Cloudinary account

## Environment Variables for Vercel

Copy these environment variables to your Vercel project settings:

```bash
# Server Configuration
NODE_ENV=production
PORT=5000
API_VERSION=v1

# Database Configuration
MONGODB_URI=mongodb+srv://ilyeskhireddinem2cs:XmHodgolfYuasOjb@cluster0.9sl9dja.mongodb.net/same-mli-connect?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=same-mli-connect-super-secret-jwt-key-2024-production-ready
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=same-mli-connect-refresh-secret-jwt-key-2024
JWT_REFRESH_EXPIRES_IN=30d

# Cloudinary Configuration
CLOUDINARY_URL=cloudinary://346579641249516:i1SGWur45-60o2TjiXTy04klioM@da35baqyy
CLOUDINARY_CLOUD_NAME=da35baqyy
CLOUDINARY_API_KEY=346579641249516
CLOUDINARY_API_SECRET=i1SGWur45-60o2TjiXTy04klioM

# Email Configuration (Optional)
EMAIL_FROM=noreply@same-mli-connect.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=

# Security Configuration
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration - IMPORTANT: Replace with your actual Vercel domain
CORS_ORIGIN=https://your-vercel-app.vercel.app,http://localhost:8080,http://localhost:8081,http://localhost:8082,http://localhost:3000,capacitor://localhost,ionic://localhost,http://localhost,https://localhost

# Admin Configuration
ADMIN_EMAIL=ilyeskhireddinem2cs@gmail.com

# File Upload Configuration
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document
```

## Deployment Steps

1. **Push to GitHub**: Make sure your code is pushed to the GitHub repository
2. **Connect to Vercel**: Import your GitHub repository to Vercel
3. **Configure Build Settings**:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
4. **Add Environment Variables**: Copy all the variables above to Vercel's environment variables section
5. **Update CORS_ORIGIN**: Replace `https://your-vercel-app.vercel.app` with your actual Vercel domain
6. **Deploy**: Vercel will automatically deploy your backend

## Important Notes

- The backend is configured for Capacitor mobile apps
- CORS is set up for multiple localhost ports (8080, 8081, 8082)
- Socket.IO is configured for real-time messaging
- File uploads are handled via Cloudinary
- MongoDB Atlas is used for data persistence

## Testing the Deployment

After deployment, test these endpoints:
- `GET /api/v1/health` - Health check
- `POST /api/v1/auth/login` - Authentication
- `GET /api/v1/users` - User listing

## Frontend Configuration

Update your frontend API base URL to point to your Vercel deployment:
```typescript
const API_BASE_URL = 'https://your-vercel-app.vercel.app/api/v1';
```
