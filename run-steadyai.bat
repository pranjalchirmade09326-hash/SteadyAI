@echo off
title SteadyAI Launcher
set "PATH=%APPDATA%\npm;%LOCALAPPDATA%\pnpm\bin;%PATH%"
echo ========================================================
echo          Starting SteadyAI Full-Stack Suite
echo ========================================================
echo.

echo [1/3] Starting Backend API (Port 3000)...
start "SteadyAI Backend API (Port 3000)" cmd /k "cd /d %~dp0 && npm run dev"

echo [2/3] Starting Web Application (Port 3001)...
start "SteadyAI Next.js Web (Port 3001)" cmd /k "cd /d %~dp0frontend\web && npm run dev"

echo [3/3] Starting Mobile App Web Preview (Port 8081)...
start "SteadyAI Mobile App (Port 8081)" cmd /k "cd /d %~dp0frontend\mobile && npx expo start --web"

echo.
echo ========================================================
echo All services are launching in their own terminal windows!
echo - Backend API:    http://localhost:3000
echo - Web Site:       http://localhost:3001
echo - Mobile App:     http://localhost:8081
echo ========================================================
echo.
pause
