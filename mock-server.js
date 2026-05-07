const net = require('net');
const crypto = require('crypto');

/**
 * Simple mock Minecraft server for testing bot connections
 * This simulates basic Minecraft protocol responses
 */

class MockMinecraftServer {
  constructor(port = 25565) {
    this.port = port;
    this.server = null;
    this.clients = new Map();
    this.handlers = {
      // Handshake packet ID 0x00
      0x00: this.handleHandshake.bind(this),
      // Login start packet ID 0x00 (after handshake)
      0x00: this.handleLoginStart.bind(this)
    };
  }

  start() {
    this.server = net.createServer((socket) => {
      console.log(`[Mock Server] Client connected from ${socket.remoteAddress}:${socket.remotePort}`);
      
      const clientId = crypto.randomBytes(8).toString('hex');
      this.clients.set(clientId, { socket, state: 'handshake', username: null });
      
      socket.on('data', (data) => {
        this.handleData(clientId, data);
      });
      
      socket.on('error', (err) => {
        console.log(`[Mock Server] Client error: ${err.message}`);
      });
      
      socket.on('close', () => {
        console.log(`[Mock Server] Client disconnected`);
        this.clients.delete(clientId);
      });
    });
    
    this.server.listen(this.port, '0.0.0.0', () => {
      console.log(`[Mock Server] Listening on port ${this.port}`);
      console.log(`[Mock Server] This is a TEST server, not a real Minecraft server`);
      console.log(`[Mock Server] Use for testing bot connection only\n`);
    });
    
    this.server.on('error', (err) => {
      console.error(`[Mock Server] Error: ${err.message}`);
    });
  }

  handleData(clientId, data) {
    const client = this.clients.get(clientId);
    if (!client) return;
    
    try {
      // Simplified packet parsing
      const packetId = data[0];
      console.log(`[Mock Server] Received packet ID: 0x${packetId.toString(16)}`);
      
      if (client.state === 'handshake' && packetId === 0x00) {
        this.handleHandshake(client, data);
      } else if (client.state === 'login' && packetId === 0x00) {
        this.handleLoginStart(client, data);
      }
    } catch (err) {
      console.error(`[Mock Server] Error handling data: ${err.message}`);
    }
  }

  handleHandshake(client, data) {
    console.log('[Mock Server] Handshake received');
    client.state = 'login';
    
    // Send login success response
    this.sendLoginSuccess(client);
  }

  handleLoginStart(client, data) {
    // Extract username (simplified)
    let username = 'TestPlayer';
    try {
      // Try to read username from packet
      if (data.length > 2) {
        const nameLength = data[1];
        if (nameLength > 0 && data.length >= 2 + nameLength) {
          username = data.slice(2, 2 + nameLength).toString('utf8');
        }
      }
    } catch (err) {
      console.log('[Mock Server] Could not parse username, using default');
    }
    
    console.log(`[Mock Server] Login start for username: ${username}`);
    client.username = username;
    
    // Send login success
    this.sendLoginSuccess(client, username);
  }

  sendLoginSuccess(client, username = null) {
    const finalUsername = username || client.username || 'TestBot';
    console.log(`[Mock Server] Sending login success for ${finalUsername}`);
    
    // Simple login success response (not actual Minecraft protocol)
    const response = Buffer.from(`Login success! Welcome ${finalUsername} to test server`, 'utf8');
    client.socket.write(response);
    
    // Keep connection alive
    setInterval(() => {
      if (!client.socket.destroyed) {
        const keepAlive = Buffer.from('Server is running...', 'utf8');
        client.socket.write(keepAlive);
      }
    }, 30000);
  }

  stop() {
    if (this.server) {
      this.server.close();
      console.log('[Mock Server] Stopped');
    }
  }
}

// Run if called directly
if (require.main === module) {
  const port = parseInt(process.argv[2]) || 25565;
  const server = new MockMinecraftServer(port);
  server.start();
  
  console.log('\n⚠️  NOTE: This is NOT a real Minecraft server!');
  console.log('   It only simulates basic connection for testing.');
  console.log('   For real Minecraft functionality, use actual Minecraft server.\n');
  
  process.on('SIGINT', () => {
    console.log('\nShutting down mock server...');
    server.stop();
    process.exit(0);
  });
}

module.exports = MockMinecraftServer;
