@echo off
setlocal
set "ROOT=%~dp0"

echo Starting Neighborhood Help backend and frontend...

start "Neighborhood Backend" powershell -NoLogo -NoExit -ExecutionPolicy Bypass -Command "Set-Location -LiteralPath '%ROOT%'; npm run backend:dev"
start "Neighborhood Frontend" powershell -NoLogo -NoExit -ExecutionPolicy Bypass -Command "Set-Location -LiteralPath '%ROOT%'; npm run dev -- --host 0.0.0.0"

echo.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5173
echo.
echo Keep both terminal windows open while using the app.
endlocal
