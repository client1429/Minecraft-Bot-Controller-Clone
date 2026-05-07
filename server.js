const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const sharp = require('sharp');
const Tesseract = require('tesseract.js');
const { BotManager } = require('./botManager');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static('public'));
app.use(express.json());

// Initialize bot manager
const botManager = new BotManager(io);

// Endpoint for taking in-game screenshot from specific bot
app.post('/api/bot/:id/screenshot', async (req, res) => {
  const botId = parseInt(req.params.id);
  
  try {
    const result = await botManager.captureBotScreenshot(botId);
    res.json(result);
  } catch (error) {
    console.error('Screenshot error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint for getting 3D world data
app.get('/api/bot/:id/world-data', async (req, res) => {
  const botId = parseInt(req.params.id);
  const bot = botManager.getBot(botId);
  
  if (!bot || !bot.bot || !bot.bot.entity) {
    return res.json({ success: false, error: 'Bot not available' });
  }
  
  try {
    const blocks = [];
    const entities = [];
    
    // Get bot position
    const botPos = {
      x: bot.bot.entity.position.x,
      y: bot.bot.entity.position.y,
      z: bot.bot.entity.position.z
    };
    const botYaw = bot.bot.entity.yaw;
    const botPitch = bot.bot.entity.pitch;
    
    // Get nearby blocks (radius 6)
    const radius = 6;
    const blockColors = {
      'grass_block': 0x7C9C5C,
      'dirt': 0x8B5A2B,
      'stone': 0x808080,
      'cobblestone': 0x6E6E6E,
      'oak_planks': 0xBC9A6C,
      'oak_log': 0x8B5A2B,
      'water': 0x3B6CE8,
      'sand': 0xF4E4A0,
      'gravel': 0xA0A0A0,
      'brick': 0xB85C38,
      'glass': 0xC8E7F5
    };
    
    for (let x = -radius; x <= radius; x++) {
      for (let y = -3; y <= 3; y++) {
        for (let z = -radius; z <= radius; z++) {
          const blockX = Math.floor(botPos.x + x);
          const blockY = Math.floor(botPos.y + y);
          const blockZ = Math.floor(botPos.z + z);
          
          try {
            const block = bot.bot.blockAt({ x: blockX, y: blockY, z: blockZ });
            if (block && block.name && block.name !== 'air') {
              const color = blockColors[block.name] || 0xAA8C6C;
              blocks.push({
                x: blockX,
                y: blockY,
                z: blockZ,
                color: color,
                name: block.name
              });
            }
          } catch (e) {
            // Skip
          }
        }
      }
    }
    
    // Get nearby entities
    const allEntities = Object.values(bot.bot.entities);
    for (const entity of allEntities) {
      if (entity === bot.bot.entity) continue;
      if (!entity.position) continue;
      
      const entityX = entity.position.x;
      const entityY = entity.position.y;
      const entityZ = entity.position.z;
      
      // Only include entities within radius
      const distance = Math.sqrt(
        Math.pow(entityX - botPos.x, 2) +
        Math.pow(entityY - botPos.y, 2) +
        Math.pow(entityZ - botPos.z, 2)
      );
      
      if (distance < 15) {
        entities.push({
          x: entityX,
          y: entityY,
          z: entityZ,
          username: entity.username || null,
          type: entity.type || 'mob',
          color: entity.username ? 0x4CAF50 : 0xFF6B6B
        });
      }
    }
    
    res.json({
      success: true,
      blocks: blocks,
      entities: entities,
      botPos: botPos,
      botYaw: botYaw,
      botPitch: botPitch,
      stats: {
        health: bot.bot.health || 20,
        food: bot.bot.food || 20,
        heldItem: bot.bot.heldItem ? (bot.bot.heldItem.displayName || bot.bot.heldItem.name) : null
      }
    });
  } catch (error) {
    console.error('World data error:', error);
    res.json({ success: false, error: error.message });
  }
});

// Endpoint for solving captcha from bot's held item (map/captcha image)
app.post('/api/bot/:id/solve-captcha', async (req, res) => {
  const botId = parseInt(req.params.id);
  const { region } = req.body;
  
  try {
    // First capture the bot's current view
    const screenshot = await botManager.captureBotScreenshot(botId);
    if (!screenshot.success) {
      throw new Error('Failed to capture bot view');
    }
    
    const imgBuffer = Buffer.from(screenshot.image, 'base64');
    
    let imageToProcess = imgBuffer;
    if (region) {
      const { x, y, width, height } = region;
      imageToProcess = await sharp(imgBuffer)
        .extract({ left: x, top: y, width: width, height: height })
        .toBuffer();
    }
    
    // Enhanced OCR for better captcha recognition
    const { data: { text } } = await Tesseract.recognize(imageToProcess, 'eng', {
      logger: m => console.log(m),
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    });
    
    const cleanedText = text.replace(/\s/g, '').toLowerCase();
    res.json({ success: true, captchaText: cleanedText });
  } catch (error) {
    console.error('Captcha solving error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Bot control endpoints for multiple bots
app.post('/api/bots/create', async (req, res) => {
  const { host, port, username, password } = req.body;
  
  try {
    const result = botManager.createBot(host, port, username, password);
    res.json({ success: true, bot: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/bots/:id/disconnect', (req, res) => {
  const botId = parseInt(req.params.id);
  const result = botManager.disconnectBot(botId);
  res.json({ success: result });
});

app.post('/api/bots/disconnect-all', (req, res) => {
  botManager.disconnectAll();
  res.json({ success: true });
});

app.post('/api/bots/:id/command', (req, res) => {
  const botId = parseInt(req.params.id);
  const { command } = req.body;
  
  const result = botManager.sendCommandToBot(botId, command);
  if (result) {
    res.json({ success: true });
  } else {
    res.status(400).json({ success: false, error: 'Bot not connected' });
  }
});

app.get('/api/bots/list', (req, res) => {
  res.json({ success: true, bots: botManager.getAllBotsInfo() });
});

// Socket.IO connection for real-time updates
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Send initial bot list
  socket.emit('bots-list-update', botManager.getAllBotsInfo());
  
  socket.on('request-bots-list', () => {
    socket.emit('bots-list-update', botManager.getAllBotsInfo());
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Minecraft Bot Controller Ready');
});