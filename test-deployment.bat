@echo off
echo ========================================
echo    Testing Vercel Deployment
echo ========================================
echo.

set BACKEND_URL=https://sameli-server-f4vc.vercel.app

echo Testing Health Check...
echo URL: %BACKEND_URL%/health
curl -s "%BACKEND_URL%/health"
echo.
echo.

echo Testing API Info...
echo URL: %BACKEND_URL%/api/v1
curl -s "%BACKEND_URL%/api/v1"
echo.
echo.

echo Testing Users Endpoint...
echo URL: %BACKEND_URL%/api/v1/users?limit=1
curl -s "%BACKEND_URL%/api/v1/users?limit=1"
echo.
echo.

echo Testing Login Endpoint (should return error, not CORS)...
echo URL: %BACKEND_URL%/api/v1/auth/login
curl -X POST "%BACKEND_URL%/api/v1/auth/login" ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@example.com\",\"password\":\"wrongpassword\"}"
echo.
echo.

echo ========================================
echo    Test Results Analysis
echo ========================================
echo.
echo ✅ If you see JSON responses above, the backend is working!
echo ❌ If you see HTML or "page not found", there's a deployment issue.
echo ⚠️  If you see connection errors, check the URL.
echo.
echo For the login test:
echo ✅ Expected: JSON error message (invalid credentials)
echo ❌ Unexpected: CORS error or HTML response
echo.
pause
