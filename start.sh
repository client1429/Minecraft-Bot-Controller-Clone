#!/bin/bash

# Minecraft Bot Controller Startup Script

echo "███╗   ███╗██╗███╗   ██╗███████╗ ██████╗██████╗  █████╗ ███████╗████████╗"
echo "████╗ ████║██║████╗  ██║██╔════╝██╔════╝██╔══██╗██╔══██╗██╔════╝╚══██╔══╝"
echo "██╔████╔██║██║██╔██╗ ██║█████╗  ██║     ██████╔╝███████║█████╗     ██║   "
echo "██║╚██╔╝██║██║██║╚██╗██║██╔══╝  ██║     ██╔══██╗██╔══██║██╔══╝     ██║   "
echo "██║ ╚═╝ ██║██║██║ ╚████║██║     ╚██████╗██║  ██║██║  ██║███████╗   ██║   "
echo "╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝╚═╝      ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   "
echo ""
echo "================================================"
echo "   Minecraft Bot Controller v1.0"
echo "================================================"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js not found! Please install Node.js first."
    echo "Download: https://nodejs.org/"
    exit 1
fi

echo "[✓] Node.js found: $(node --version)"

# Check dependencies
if [ ! -d "node_modules/express" ]; then
    echo "[⚠] Dependencies not found. Installing..."
    npm install
    if [ $? -ne 0 ]; then
        echo "[ERROR] Failed to install dependencies"
        exit 1
    fi
    echo "[✓] Dependencies installed"
fi

echo ""
echo "[🚀] Starting Minecraft Bot Controller..."
echo "[📱] Access dashboard at: http://localhost:3000"
echo "[🎮] Access 3D viewer at: http://localhost:3000/3dviewer.html"
echo ""
echo "[INFO] Press Ctrl+C to stop the server"
echo ""

# Start server
node server.js
