@echo off
chcp 65001 >nul
title Minecraft Bot Controller

echo ███╗   ███╗██╗███╗   ██╗███████╗ ██████╗██████╗  █████╗ ███████╗████████╗
echo ████╗ ████║██║████╗  ██║██╔════╝██╔════╝██╔══██╗██╔══██╗██╔════╝╚══██╔══╝
echo ██╔████╔██║██║██╔██╗ ██║█████╗  ██║     ██████╔╝███████║█████╗     ██║   
echo ██║╚██╔╝██║██║██║╚██╗██║██╔══╝  ██║     ██╔══██╗██╔══██║██╔══╝     ██║   
echo ██║ ╚═╝ ██║██║██║ ╚████║██║     ╚██████╗██║  ██║██║  ██║███████╗   ██║   
echo ╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝╚═╝      ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   
echo.
echo ================================================
echo    Minecraft Bot Controller v1.0
echo ================================================
echo.

:: Kiểm tra Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found! Please install Node.js first.
    echo Download: https://nodejs.org/
    pause
    exit /b 1
)

echo [✓] Node.js found

:: Kiểm tra dependencies
if not exist "node_modules\express" (
    echo [⚠] Dependencies not found. Installing...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
    echo [✓] Dependencies installed
)

echo.
echo [🚀] Starting Minecraft Bot Controller...
echo [📱] Access dashboard at: http://localhost:3000
echo [🎮] Access 3D viewer at: http://localhost:3000/3dviewer.html
echo.
echo [INFO] Press Ctrl+C to stop the server
echo.

:: Start server
node server.js

pause
