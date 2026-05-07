# 🔧 Bot Connection Issue - Troubleshooting Guide

## ❌ The Problem
Your bot cannot connect to the Minecraft server because **no server is running** on `localhost:25565`.

## ✅ Solutions

### Option 1: Start a Minecraft Server (Recommended)

#### A. Official Minecraft Server
1. **Download server.jar** from https://minecraft.net/en-us/download/server
2. **Place in a folder** (e.g., `C:\minecraft-server`)
3. **Create a start script** (`start-server.bat`):
```batch
java -Xmx1024M -Xms1024M -jar server.jar nogui
```
4. **Accept EULA**: Edit `eula.txt` and change `eula=false` to `eula=true`
5. **Set offline mode** (for bots without Microsoft account):
   - Edit `server.properties`
   - Change `online-mode=false`
6. **Run** `start-server.bat`

#### B. Using Test Server (Quick Setup)
Install and run a lightweight test server:
```bash
npm install -g minecraft-server
minecraft-server
```

#### C. Connect to an Existing Server
If you already have a Minecraft server running elsewhere:
- Use its IP address instead of `localhost`
- Example: `192.168.1.100` or a public server IP

### Option 2: Create a Simple Test Server with Node.js

```javascript
// test-server.js
const net = require('net');

const server = net.createServer((socket) => {
  console.log('Client connected');
  socket.write('Hello from test server\n');
  
  socket.on('data', (data) => {
    console.log('Received:', data.toString());
  });
});

server.listen(25565, 'localhost', () => {
  console.log('Test server listening on port 25565');
});
```

Run with: `node test-server.js`

### Option 3: Use an Online Test Server

**Free public test servers:**
- `mc.hypixel.net` (requires online mode)
- `play.cubecraft.net` (requires online mode)
- `localhost` with offline mode enabled

## 🔍 Verify Server is Running

After starting your server, test the connection:
```bash
# Run diagnostic tool
node diagnose-connection.js localhost 25565 TestBot

# Or use telnet (Windows)
telnet localhost 25565
```

## ⚙️ Configure Bot to Connect

Once your server is running, update the bot connection:

### Using API
```bash
curl -X POST http://localhost:3000/api/bot/connect \
  -H "Content-Type: application/json" \
  -d '{
    "host": "localhost",
    "port": 25565,
    "username": "MyBot",
    "password": ""
  }'
```

### Using Web Interface
1. Open http://localhost:3000
2. Enter server details:
   - Host: `localhost` (or your server IP)
   - Port: `25565`
   - Username: `MyBot`
3. Click "Connect"

## 🚨 Common Error Messages & Fixes

### "ECONNREFUSED"
- **Cause:** No server running on specified port
- **Fix:** Start Minecraft server first

### "Connection timeout"
- **Cause:** Firewall blocking or wrong IP/port
- **Fix:** Check firewall settings, verify server address

### "Failed to log in"
- **Cause:** Server in online mode
- **Fix:** Set `online-mode=false` in server.properties

### "Username already taken"
- **Cause:** Another player/bot using same name
- **Fix:** Choose a different username

## 📝 Quick Start Script

Save this as `start-all.bat` to start both server and bot controller:

```batch
@echo off
echo Starting Minecraft Server...
start /min java -Xmx1024M -Xms1024M -jar server.jar nogui
timeout /t 5 /nobreak >nul
echo Starting Bot Controller...
start /min cmd /c "npm start"
echo Both server and bot controller are starting!
echo Open http://localhost:3000 in your browser
timeout /t 3 /nobreak >nul
start http://localhost:3000
```

## 🎯 Next Steps After Fixing

1. **Test connection:** `node diagnose-connection.js`
2. **Start bot controller:** `npm start`
3. **Open browser:** http://localhost:3000
4. **Connect bot** using the web interface

## 💡 For Captcha Solving

The bot has built-in captcha detection. When a captcha appears in chat:
1. Bot auto-detects keywords like "captcha" or "verify"
2. Takes screenshot of the screen
3. Uses OCR to read captcha text
4. Automatically submits the answer

To test captcha solving:
```bash
# Take manual screenshot
curl -X POST http://localhost:3000/api/screenshot

# Solve captcha from specific region
curl -X POST http://localhost:3000/api/solve-captcha \
  -H "Content-Type: application/json" \
  -d '{"region": {"x": 100, "y": 200, "width": 300, "height": 100}}'
```

## 🆘 Still Having Issues?

Run full diagnostic:
```bash
node diagnose-connection.js
```

Check server logs:
- Bot logs appear in the console where `npm start` is running
- Minecraft server logs in the server directory

---

**Remember:** The bot needs a running Minecraft server to connect to. The server must be started BEFORE trying to connect the bot.
