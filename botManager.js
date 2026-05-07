const mineflayer = require('mineflayer');

class BotInstance {
  constructor(id, host, port, username, password, io) {
    this.id = id;
    this.username = username;
    this.host = host;
    this.port = port;
    this.password = password;
    this.bot = null;
    this.status = 'connecting';
    this.renderer = null;
    this.io = io;
    this.lastScreenshot = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 3;
    this.reconnectDelay = 5000;
    this.reconnectTimer = null;
    this.connect();
  }

  connect() {
    this.bot = mineflayer.createBot({
      host: this.host,
      port: this.port,
      username: this.username,
      password: this.password,
      version: false
    });

    this.bot.on('login', () => {
      this.resetReconnectAttempts();
      this.status = 'connected';
      this.emitStatus();
      this.log('info', `Connected to ${this.host}:${this.port}`);
    });

    this.bot.on('spawn', () => {
      this.log('info', 'Bot spawned in world');
      this.emitStatus();
    });

    this.bot.on('error', (err) => {
      this.status = 'error';
      this.log('error', `Error: ${err.message}`);
      this.emitStatus();
    });

    this.bot.on('end', (reason) => {
      this.status = 'disconnected';
      this.log('info', `Disconnected: ${reason}`);
      this.emitStatus();
      // Notify admin about disconnect with retry info
      this.io.emit('bot-disconnected', {
        botId: this.id,
        username: this.username,
        reason: reason,
        reconnectAttemptsLeft: this.maxReconnectAttempts - this.reconnectAttempts
      });
      
      // Auto-reconnect with retry logic
      this.scheduleReconnect();
    });

    this.bot.on('kicked', (reason) => {
      this.status = 'kicked';
      this.log('error', `Kicked: ${reason}`);
      this.emitStatus();
      this.io.emit('bot-disconnected', {
        botId: this.id,
        username: this.username,
        reason: `Kicked: ${reason}`,
        reconnectAttemptsLeft: this.maxReconnectAttempts - this.reconnectAttempts
      });
      
      // Auto-reconnect with retry logic
      this.scheduleReconnect();
    });

    this.bot.on('message', (message) => {
      const text = message.toString();
      this.log('chat', text);
      
      if (text.toLowerCase().includes('captcha') || text.includes('verify')) {
        this.io.emit('captcha-detected', {
          botId: this.id,
          username: this.username,
          message: text
        });
      }
    });

    // Handle held item changes for map/captcha items
    this.bot.on('heldItemChanged', () => {
      const heldItem = this.bot.heldItem;
      if (heldItem && heldItem.name && heldItem.name.includes('map')) {
        this.log('info', `Holding map item: ${heldItem.name}`);
        this.io.emit('bot-holding-map', {
          botId: this.id,
          username: this.username,
          item: heldItem.name
        });
      }
    });
  }

  async captureIngameView() {
    if (this.status !== 'connected') {
      throw new Error(`Bot is ${this.status}. Please wait for reconnect.`);
    }
    
    if (!this.bot || !this.bot.entity) {
      throw new Error('Bot not fully initialized yet');
    }
    
    if (!this.renderer && this.status === 'connected') {
      const { IngameRenderer } = require('./ingameRenderer');
      this.renderer = new IngameRenderer(this.bot);
      this.renderer.init();
    }
    
    if (this.renderer) {
      this.renderer.bot = this.bot;
      return await this.renderer.render();
    }
    
    throw new Error('Bot not ready for rendering');
  }

  sendCommand(command) {
    if (this.bot && this.status === 'connected') {
      this.bot.chat(command);
      this.log('command', `Sent: ${command}`);
      return true;
    }
    return false;
  }

  scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const retriesLeft = this.maxReconnectAttempts - this.reconnectAttempts;
      this.status = `reconnecting (${this.reconnectAttempts}/${this.maxReconnectAttempts})`;
      this.emitStatus();
      
      this.log('info', `Reconnecting in ${this.reconnectDelay/1000}s... Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      
      this.reconnectTimer = setTimeout(() => {
        this.log('info', `Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`);
        this.cleanupBot();
        this.connect();
      }, this.reconnectDelay);
    } else {
      this.log('error', `Max reconnection attempts (${this.maxReconnectAttempts}) reached. Bot will remain disconnected.`);
      this.status = 'disconnected_permanent';
      this.emitStatus();
      this.io.emit('bot-reconnect-failed', {
        botId: this.id,
        username: this.username,
        maxAttempts: this.maxReconnectAttempts
      });
    }
  }

  cleanupBot() {
    if (this.bot) {
      try {
        this.bot.removeAllListeners();
        this.bot.end();
      } catch (e) {
        // Ignore cleanup errors
      }
      this.bot = null;
    }
    if (this.renderer) {
      this.renderer.cleanup();
      this.renderer = null;
    }
  }

  resetReconnectAttempts() {
    this.reconnectAttempts = 0;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  disconnect() {
    this.resetReconnectAttempts();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.cleanupBot();
    this.status = 'disconnected';
    this.emitStatus();
  }

  log(type, message) {
    this.io.emit('bot-log', {
      botId: this.id,
      username: this.username,
      type: type,
      message: message,
      timestamp: new Date().toISOString()
    });
  }

  emitStatus() {
    this.io.emit('bot-status-update', {
      botId: this.id,
      username: this.username,
      status: this.status,
      position: this.bot && this.bot.entity ? {
        x: Math.floor(this.bot.entity.position.x),
        y: Math.floor(this.bot.entity.position.y),
        z: Math.floor(this.bot.entity.position.z)
      } : null,
      health: this.bot ? this.bot.health : null,
      food: this.bot ? this.bot.food : null
    });
  }

  getInfo() {
    return {
      id: this.id,
      username: this.username,
      host: this.host,
      port: this.port,
      status: this.status,
      position: this.bot && this.bot.entity ? {
        x: Math.floor(this.bot.entity.position.x),
        y: Math.floor(this.bot.entity.position.y),
        z: Math.floor(this.bot.entity.position.z)
      } : null,
      health: this.bot ? this.bot.health : null,
      food: this.bot ? this.bot.food : null
    };
  }
}

class BotManager {
  constructor(io) {
    this.bots = new Map();
    this.io = io;
    this.nextId = 1;
  }

  createBot(host, port, username, password) {
    const id = this.nextId++;
    const botInstance = new BotInstance(id, host, port, username, password, this.io);
    this.bots.set(id, botInstance);
    this.io.emit('bots-list-update', this.getAllBotsInfo());
    return { id, username, status: 'connecting' };
  }

  getBot(id) {
    return this.bots.get(parseInt(id));
  }

  getAllBots() {
    return Array.from(this.bots.values());
  }

  getAllBotsInfo() {
    return Array.from(this.bots.values()).map(bot => bot.getInfo());
  }

  disconnectBot(id) {
    const bot = this.getBot(id);
    if (bot) {
      bot.disconnect();
      this.bots.delete(parseInt(id));
      this.io.emit('bots-list-update', this.getAllBotsInfo());
      return true;
    }
    return false;
  }

  disconnectAll() {
    this.bots.forEach(bot => bot.disconnect());
    this.bots.clear();
    this.io.emit('bots-list-update', []);
  }

  async captureBotScreenshot(id) {
    const bot = this.getBot(id);
    if (bot) {
      return await bot.captureIngameView();
    }
    throw new Error('Bot not found');
  }

  sendCommandToBot(id, command) {
    const bot = this.getBot(id);
    if (bot) {
      return bot.sendCommand(command);
    }
    return false;
  }
}

module.exports = { BotManager };
