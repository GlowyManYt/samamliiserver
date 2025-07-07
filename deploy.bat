@echo off
echo 🚀 Starting deployment process...

echo 📦 Building TypeScript...
npm run build

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Build failed. Aborting deployment.
    pause
    exit /b 1
)

echo 🧪 Testing database connection...
npm run test:db

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Database connection test failed. Aborting deployment.
    pause
    exit /b 1
)

echo ✅ Database connection test passed!

echo 🌐 Deploying to Vercel...
vercel --prod

echo ✅ Deployment complete!
echo.
echo 🧪 Testing deployed endpoints...
echo.
echo Testing health endpoint:
curl -s "https://sameli-server-f4vc.vercel.app/health"
echo.
echo.
echo Testing API endpoint:
curl -s "https://sameli-server-f4vc.vercel.app/api/v1"
echo.
echo.
pause
