@echo off
echo ========================================================
echo   Starting Neighborhood Help Platform (Mansi)
echo ========================================================
echo.
echo Launching Backend API server on http://localhost:5000...
start "Mansi Backend" cmd /k "npm run backend:start"

echo Launching Frontend Vite server on http://localhost:5173...
start "Mansi Frontend" cmd /k "npm run dev"

echo.
echo Both servers launched in separate console tabs.
echo Frontend: http://localhost:5173
echo Backend API: http://localhost:5000
echo.
