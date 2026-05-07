const mineflayer = require('mineflayer');
const net = require('net');

console.log('🔍 Minecraft Bot Connection Diagnostic Tool\n');

// Test server connection
function testServerConnection(host, port, timeout = 5000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const startTime = Date.now();
    
    socket.setTimeout(timeout);
    
    socket.on('connect', () => {
      const latency = Date.now() - startTime;
      socket.destroy();
      resolve({ success: true, latency, message: `Connected in ${latency}ms` });
    });
    
    socket.on('timeout', () => {
      socket.destroy();
      resolve({ success: false, message: `Connection timeout after ${timeout}ms` });
    });
    
    socket.on('error', (err) => {
      socket.destroy();
      resolve({ success: false, message: err.message });
    });
    
    socket.connect(port, host);
  });
}

// Test bot connection
async function testBotConnection(host, port, username) {
  return new Promise((resolve) => {
    console.log(`Attempting to connect bot ${username} to ${host}:${port}...`);
    
    const bot = mineflayer.createBot({
      host: host,
      port: port,
      username: username,
      version: false,
      connectTimeout: 10000
    });
    
    const timeout = setTimeout(() => {
      bot.end();
      resolve({ success: false, message: 'Bot connection timeout after 10 seconds' });
    }, 10000);
    
    bot.on('login', () => {
      clearTimeout(timeout);
      console.log('✓ Bot logged in successfully');
      resolve({ success: true, message: 'Bot connected successfully' });
      setTimeout(() => bot.end(), 1000);
    });
    
    bot.on('error', (err) => {
      clearTimeout(timeout);
      console.error('Bot error:', err.message);
      resolve({ success: false, message: err.message });
      bot.end();
    });
    
    bot.on('kicked', (reason) => {
      clearTimeout(timeout);
      resolve({ success: false, message: `Bot was kicked: ${reason}` });
      bot.end();
    });
  });
}

async function main() {
  // Get configuration from user or use defaults
  const args = process.argv.slice(2);
  let host = args[0] || 'localhost';
  let port = parseInt(args[1]) || 25565;
  let username = args[2] || 'TestBot';
  
  console.log('Testing configuration:');
  console.log(`  Host: ${host}`);
  console.log(`  Port: ${port}`);
  console.log(`  Username: ${username}\n`);
  
  // Step 1: Test if server is reachable
  console.log('📡 Step 1: Testing server reachability...');
  const serverTest = await testServerConnection(host, port);
  
  if (!serverTest.success) {
    console.log(`❌ Server unreachable: ${serverTest.message}\n`);
    console.log('Possible issues:');
    console.log('  1. Minecraft server is not running');
    console.log('  2. Wrong IP address or port');
    console.log('  3. Firewall blocking the connection');
    console.log('  4. Server is in offline mode?\n');
    console.log('💡 Troubleshooting tips:');
    console.log('  - Start your Minecraft server first');
    console.log('  - Check server.properties for correct port');
    console.log('  - Try connecting with Minecraft client to verify');
    console.log(`  - Run: telnet ${host} ${port} (if available)`);
    process.exit(1);
  }
  
  console.log(`✅ Server reachable! (${serverTest.message})\n`);
  
  // Step 2: Test bot connection
  console.log('🤖 Step 2: Testing bot connection...');
  const botTest = await testBotConnection(host, port, username);
  
  if (!botTest.success) {
    console.log(`❌ Bot connection failed: ${botTest.message}\n`);
    console.log('Possible issues:');
    console.log('  1. Server is in online mode (need Microsoft authentication)');
    console.log('  2. Username already in use');
    console.log('  3. Server is at maximum player capacity');
    console.log('  4. Server version incompatible with mineflayer\n');
    console.log('💡 Solutions:');
    console.log('  - Set server to offline mode in server.properties (online-mode=false)');
    console.log('  - Choose a different username');
    console.log('  - Update mineflayer: npm update mineflayer');
    console.log('  - Check server logs for more details\n');
    process.exit(1);
  }
  
  console.log(`✅ Bot connection successful!\n`);
  console.log('🎉 Your Minecraft bot is ready to use!');
  console.log('\nNext steps:');
  console.log('  1. Start the bot controller: npm start');
  console.log('  2. Open browser: http://localhost:3000');
  console.log('  3. Connect with the same server details');
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testServerConnection, testBotConnection };
