# 🚀 Deployment Guide - Fixed Backend

## Critical Issue Fixed ✅

**Problem**: `MongoParseError: option buffermaxentries is not supported`
**Solution**: Removed deprecated `bufferMaxEntries` option from Mongoose configuration

## What Was Fixed

1. **Database Connection**: Removed deprecated `bufferMaxEntries` option
2. **CORS Configuration**: Enhanced CORS headers for better mobile app compatibility
3. **Vercel Configuration**: Updated to use TypeScript entry point (`api/index.ts`)
4. **API Service**: Fixed frontend to use public headers for login/register

## Deployment Steps

### 1. Verify Local Build
```bash
cd backend
npm run build
npm run test:db
```

### 2. Deploy to Vercel
```bash
# Login to Vercel (if not already logged in)
npx vercel login

# Deploy to production
npx vercel --prod
```

### 3. Test Deployment
After deployment, test these endpoints:

**Health Check:**
```
https://sameli-server-f4vc.vercel.app/health
```

**API Info:**
```
https://sameli-server-f4vc.vercel.app/api/v1
```

**Login Test (using curl or Postman):**
```bash
curl -X POST https://sameli-server-f4vc.vercel.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

## Expected Results

✅ **Health Check**: Should return JSON with database status
✅ **API Info**: Should return API version and endpoints
✅ **Login**: Should return proper error (not CORS error)

## CORS Configuration

The backend now supports:
- `localhost:8080` (your testing port)
- `localhost:8081`, `localhost:8082` (additional testing)
- Capacitor mobile app origins
- Vercel deployment origin

## Files Modified

1. `src/config/database.ts` - Fixed deprecated MongoDB options
2. `vercel.json` - Updated entry point and CORS headers
3. `api/index.ts` - Improved TypeScript imports
4. `src/app.ts` - Enhanced CORS middleware

## Troubleshooting

If you still see CORS errors:
1. Check browser developer tools for exact error
2. Verify the deployment URL matches your frontend configuration
3. Test with curl to isolate CORS vs backend issues

## Next Steps After Deployment

1. Update frontend API URL if needed
2. Test login functionality
3. Verify user listing works
4. Test messaging features
