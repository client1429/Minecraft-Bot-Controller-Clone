# 🚨 Bot Connection Error - Quick Fix Guide

## The Problem
Your bot cannot connect to the Minecraft server. This is because **no Minecraft server is running** on `localhost:25565`.

## ⚡ Quick Solutions (Choose One)

### 🎮 Solution 1: Use Mock Test Server (Easiest for Testing)
This simulates a Minecraft server for testing commands and screenshots.

```bash
# Terminal 1: Start mock server
npm run mock-server

# Terminal 2: Start bot controller
npm start
```

**OR double-click:** `start-with-mock-server.bat`

✅ **Pros:** No Minecraft server needed, works immediately  
❌ **Cons:** Limited functionality (chat simulation only)

### 🖥️ Solution 2: Start Real Minecraft Server
If you want full Minecraft gameplay:

1. **Download server.jar** from https://minecraft.net/en-us/download/server
2. **Create folder** `C:\minecraft-server`
3. **Place server.jar** in that folder
4. **Create `start-server.bat`:**
   ```batch
   java -Xmx1024M -Xms1024M -jar server.jar nogui
   ```
5. **Run `start-server.bat`** (it will generate files)
6. **Accept EULA:** Edit `eula.txt`, change `false` to `true`
7. **Set offline mode:** Edit `server.properties`, set `online-mode=false`
8. **Restart server**
9. **Connect bot** using web interface

✅ **Pros:** Full Minecraft features, real gameplay  
❌ **Cons:** Requires Java, more setup time

### 🌐 Solution 3: Connect to External Server
Use an existing Minecraft server:

- Public test server: `mc.hypixel.net` (requires online mode)
- Your friend's server: `192.168.1.100:25565`
- LAN server: Use your local IP address

Then connect bot with that IP instead of `localhost`.

## 🔧 Diagnostic Tool
Run this to diagnose connection issues:
```bash
npm run diagnose
```

Or with custom parameters:
```bash
node diagnose-connection.js <host> <port> <username>
# Example: node diagnose-connection.js 192.168.1.100 25565 MyBot
```

## 📝 Testing Your Connection

### Step 1: Verify Server is Running
```bash
# Check if port 25565 is listening
netstat -an | findstr :25565
```

If you see `LISTENING`, your server is running.

### Step 2: Test with Telnet
```bash
telnet localhost 25565
```
If connection succeeds, server is reachable.

### Step 3: Run Bot Diagnostics
```bash
node diagnose-connection.js
```

## 🌐 Connecting via Web Interface

1. **Start the server:** `npm start`
2. **Open browser:** http://localhost:3000
3. **Enter server details:**
   - Host: `localhost` (or your server IP)
   - Port: `25565`
   - Username: Your bot name
   - Password: (leave blank for offline mode)
4. **Click "Connect"**

## 📡 API Connection Example

```bash
curl -X POST http://localhost:3000/api/bot/connect \
  -H "Content-Type: application/json" \
  -d '{
    "host": "localhost",
    "port": 25565,
    "username": "MyBot"
  }'
```

## 🎯 Verify Bot is Connected

Check bot status:
```bash
curl http://localhost:3000/api/bot/status
```

Expected response:
```json
{"status":"connected","bot":"connected"}
```

## 🧪 Test Captcha Features

Once connected, test screenshot and captcha solving:

```bash
# Take screenshot
curl -X POST http://localhost:3000/api/screenshot

# Solve captcha from screenshot
curl -X POST http://localhost:3000/api/solve-captcha \
  -H "Content-Type: application/json" \
  -d '{"region": {"x": 100, "y": 200, "width": 300, "height": 100}}'

# Send chat command
curl -X POST http://localhost:3000/api/bot/command \
  -H "Content-Type: application/json" \
  -d '{"command": "Hello!"}'
```

## ❌ Common Errors

| Error | Solution |
|-------|----------|
| `ECONNREFUSED` | Start Minecraft server first |
| `Connection timeout` | Check firewall, verify IP/port |
| `Failed to log in` | Set `online-mode=false` in server.properties |
| `Username taken` | Choose different username |
| `getaddrinfo ENOTFOUND` | Check hostname spelling |

## 🚀 Quick Start with Mock Server (No Minecraft Needed)

**For testing the bot controller and captcha features:**

1. **Open terminal 1:**
   ```bash
   npm run mock-server
   ```

2. **Open terminal 2:**
   ```bash
   npm start
   ```

3. **Open browser:** http://localhost:3000

4. **Connect with:**
   - Host: `localhost`
   - Port: `25565`
   - Username: `TestBot`

5. **Test features:**
   - Take screenshots
   - Test captcha solving
   - Send commands

## 💡 Pro Tips

1. **For offline mode servers:** Always use `online-mode=false` for bot connections
2. **Multiple bots:** Use different usernames, ensure server has enough player slots
3. **Firewall:** Add exception for Java (port 25565) if using real server
4. **Performance:** Mock server uses less resources than real Minecraft server

## 📚 Additional Resources

- [Full Connection Fix Guide](CONNECTION_FIX.md)
- [Diagnostic Tool](diagnose-connection.js)
- [Mock Test Server](mock-server.js)

## 🆘 Still Having Issues?

1. **Run full diagnostics:** `npm run diagnose`
2. **Check the logs** in both terminal windows
3. **Verify your Minecraft server is running** (try connecting with Minecraft client)
4. **Post the error message** from the diagnostic tool

---

**TL;DR:** You need a running Minecraft server. Use `npm run mock-server` for quick testing, or start a real Minecraft server for full features.
