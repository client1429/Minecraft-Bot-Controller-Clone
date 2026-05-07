@echo off
title Minecraft Bot with Mock Server
color 0a
echo ========================================
echo   Minecraft Bot Controller
echo   With Mock Test Server
echo ========================================
echo.

echo [1/3] Starting mock test server...
start "Mock Minecraft Server" cmd /c "node mock-server.js 25565"

echo [2/3] Waiting for server to initialize...
timeout /t 3 /nobreak >nul

echo [3/3] Starting bot controller...
start "Bot Controller" cmd /c "npm start"

echo.
echo ========================================
echo   Both servers are starting!
echo   Wait a few seconds then open:
echo   http://localhost:3000
echo ========================================
echo.
echo Press any key to open the web interface...
pause >nul

start http://localhost:3000

echo.
echo To stop all servers, close the command windows
echo or press Ctrl+C in each window.
pause
