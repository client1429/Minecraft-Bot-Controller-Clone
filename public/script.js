const socket = io();

// DOM Elements
const botsListDiv = document.getElementById('botsList');
const selectedBotSelect = document.getElementById('selectedBot');
const activeBotsCountSpan = document.getElementById('activeBotsCount');
const createBotBtn = document.getElementById('createBotBtn');
const disconnectAllBtn = document.getElementById('disconnectAllBtn');
const captureScreenshotBtn = document.getElementById('captureScreenshotBtn');
const solveCaptchaBtn = document.getElementById('solveCaptchaBtn');
const sendCommandBtn = document.getElementById('sendCommandBtn');
const commandInput = document.getElementById('commandInput');
const screenshotCanvas = document.getElementById('screenshotCanvas');
const logMessages = document.getElementById('logMessages');
const clearLogBtn = document.getElementById('clearLogBtn');
const captchaResult = document.getElementById('captchaResult');
const systemStatusDot = document.getElementById('systemStatusDot');
const systemStatusText = document.getElementById('systemStatusText');

let currentBots = [];
let selectedBotId = null;

// Create new bot
createBotBtn.addEventListener('click', async () => {
    const host = document.getElementById('serverHost').value;
    const port = parseInt(document.getElementById('serverPort').value);
    const username = document.getElementById('botUsername').value.trim();
    const password = document.getElementById('botPassword').value;
    
    if (!username) {
        addLog('error', 'Please enter a username for the bot');
        return;
    }
    
    addLog('info', `Creating bot: ${username} connecting to ${host}:${port}...`);
    
    try {
        const response = await fetch('/api/bots/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ host, port, username, password })
        });
        
        const data = await response.json();
        if (data.success) {
            addLog('success', `Bot ${username} created successfully (ID: ${data.bot.id})`);
        } else {
            addLog('error', `Failed to create bot: ${data.error}`);
        }
    } catch (error) {
        addLog('error', `Error creating bot: ${error.message}`);
    }
});

// Disconnect all bots
disconnectAllBtn.addEventListener('click', async () => {
    if (confirm('Are you sure you want to disconnect all bots?')) {
        try {
            await fetch('/api/bots/disconnect-all', { method: 'POST' });
            addLog('info', 'Disconnecting all bots...');
        } catch (error) {
            addLog('error', `Error: ${error.message}`);
        }
    }
});

// Capture screenshot from selected bot
captureScreenshotBtn.addEventListener('click', async () => {
    if (!selectedBotId) {
        addLog('error', 'Please select a bot first');
        return;
    }
    
    addLog('info', `Capturing in-game view from bot ${selectedBotId}...`);
    
    try {
        const response = await fetch(`/api/bot/${selectedBotId}/screenshot`, { method: 'POST' });
        const data = await response.json();
        
        if (!response.ok) {
            addLog('error', `Screenshot failed: ${data.error || 'Unknown error'}`);
            return;
        }
        
        if (data.success) {
            const img = new Image();
            img.onload = () => {
                screenshotCanvas.width = data.width;
                screenshotCanvas.height = data.height;
                const ctx = screenshotCanvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                
                // Draw overlay info
                ctx.font = 'bold 14px monospace';
                ctx.fillStyle = '#FFF';
                ctx.shadowColor = 'black';
                ctx.shadowBlur = 3;
                ctx.fillText(`Position: ${data.position.x}, ${data.position.y}, ${data.position.z}`, 10, 30);
                ctx.fillText(`Health: ${data.stats?.health || '?'} | Food: ${data.stats?.food || '?'}`, 10, 50);
                ctx.fillText(`Entities: ${data.stats?.entities || 0} | Blocks: ${data.stats?.blocks || 0}`, 10, 70);
                ctx.shadowBlur = 0;
            };
            img.src = `data:image/png;base64,${data.image}`;
            addLog('success', `Screenshot captured at position (${data.position.x}, ${data.position.y}, ${data.position.z})`);
        } else {
            addLog('error', `Screenshot failed: ${data.error}`);
        }
    } catch (error) {
        addLog('error', `Screenshot error: ${error.message}`);
    }
});

// Solve captcha from selected bot's view
solveCaptchaBtn.addEventListener('click', async () => {
    if (!selectedBotId) {
        addLog('error', 'Please select a bot first');
        return;
    }
    
    addLog('info', 'Attempting to solve captcha from bot view...');
    captchaResult.innerHTML = 'Processing captcha...';
    
    try {
        // Get region from user or use default (center of screen where map usually is)
        const region = {
            x: 200,
            y: 200,
            width: 400,
            height: 200
        };
        
        const response = await fetch(`/api/bot/${selectedBotId}/solve-captcha`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ region })
        });
        
        const data = await response.json();
        if (data.success) {
            captchaResult.innerHTML = `<strong>✅ Captcha Solved:</strong> ${data.captchaText}`;
            addLog('success', `Captcha solved: ${data.captchaText}`);
            
            // Auto-fill command input
            commandInput.value = data.captchaText;
        } else {
            captchaResult.innerHTML = `<strong>❌ Error:</strong> ${data.error}`;
            addLog('error', `Captcha solving failed: ${data.error}`);
        }
    } catch (error) {
        captchaResult.innerHTML = `<strong>❌ Error:</strong> ${error.message}`;
        addLog('error', `Captcha error: ${error.message}`);
    }
});

// Send command to selected bot
sendCommandBtn.addEventListener('click', async () => {
    if (!selectedBotId) {
        addLog('error', 'Please select a bot first');
        return;
    }
    
    const command = commandInput.value.trim();
    if (!command) return;
    
    try {
        const response = await fetch(`/api/bots/${selectedBotId}/command`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command })
        });
        
        const data = await response.json();
        if (data.success) {
            addLog('command', `Sent to bot ${selectedBotId}: ${command}`);
            commandInput.value = '';
        } else {
            addLog('error', `Failed to send command: ${data.error}`);
        }
    } catch (error) {
        addLog('error', `Command error: ${error.message}`);
    }
});

// Quick commands
document.querySelectorAll('.quick-cmd').forEach(btn => {
    btn.addEventListener('click', () => {
        commandInput.value = btn.textContent;
        sendCommandBtn.click();
    });
});

// Enter key for command input
commandInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendCommandBtn.click();
    }
});

// Clear log
clearLogBtn.addEventListener('click', () => {
    logMessages.innerHTML = '';
    addLog('info', 'Log cleared');
});

// Bot selection change
selectedBotSelect.addEventListener('change', (e) => {
    selectedBotId = e.target.value;
    if (selectedBotId) {
        addLog('info', `Selected bot ID: ${selectedBotId}`);
    }
});

// Socket.IO event handlers
socket.on('bots-list-update', (bots) => {
    currentBots = bots;
    updateBotsListUI();
    updateBotSelect();
    activeBotsCountSpan.textContent = bots.filter(b => b.status === 'connected').length;
});

socket.on('bot-status-update', (botInfo) => {
    updateBotStatusInUI(botInfo);
    activeBotsCountSpan.textContent = currentBots.filter(b => b.status === 'connected').length;
});

socket.on('bot-disconnected', (data) => {
    if (data.reconnectAttemptsLeft !== undefined && data.reconnectAttemptsLeft > 0) {
        addLog('warning', `⚠️ Bot ${data.username} disconnected: ${data.reason}. Auto-reconnecting... (${data.reconnectAttemptsLeft} retries left)`);
    } else if (data.reconnectAttemptsLeft !== undefined && data.reconnectAttemptsLeft === 0) {
        addLog('error', `❌ Bot ${data.username} disconnected: ${data.reason}. Last attempt.`);
    } else {
        addLog('error', `⚠️ BOT DISCONNECTED: ${data.username} - Reason: ${data.reason}`);
    }
    // Flash system status
    systemStatusDot.style.animation = 'none';
    setTimeout(() => {
        systemStatusDot.style.animation = 'pulse 2s infinite';
    }, 100);
});

socket.on('bot-reconnect-failed', (data) => {
    addLog('error', `❌ Bot ${data.username} failed to reconnect after ${data.maxAttempts} attempts. Bot will remain offline.`);
});

socket.on('bot-log', (data) => {
    addLog(data.type, `[${data.username}]: ${data.message}`);
});

socket.on('captcha-detected', (data) => {
    addLog('error', `🔐 CAPTCHA DETECTED on bot ${data.username}: ${data.message}`);
    if (confirm(`Captcha detected on ${data.username}! Solve it now?`)) {
        selectedBotId = data.botId;
        selectedBotSelect.value = data.botId;
        solveCaptchaBtn.click();
    }
});

// Helper functions
function updateBotsListUI() {
    if (currentBots.length === 0) {
        botsListDiv.innerHTML = '<p style="color: #888; text-align: center;">No bots connected. Create one to start.</p>';
        return;
    }
    
    botsListDiv.innerHTML = currentBots.map(bot => `
        <div class="bot-card" data-bot-id="${bot.id}">
            <div class="bot-header">
                <span class="bot-name">${escapeHtml(bot.username)}</span>
                <span class="bot-status ${bot.status}">${bot.status}</span>
            </div>
            <div class="bot-info">
                Server: ${bot.host}:${bot.port}<br>
                ${bot.position ? `Position: ${bot.position.x}, ${bot.position.y}, ${bot.position.z}` : 'Position: unknown'}<br>
                ${bot.health ? `Health: ${bot.health} ❤️ | Food: ${bot.food} 🍗` : ''}
            </div>
            <div class="bot-actions">
                <button onclick="selectBot(${bot.id})" class="btn-small">Select</button>
                <button onclick="disconnectBot(${bot.id})" class="btn-small" style="background: rgba(244, 67, 54, 0.2);">Disconnect</button>
            </div>
        </div>
    `).join('');
}

function updateBotSelect() {
    selectedBotSelect.innerHTML = '<option value="">-- Select a bot --</option>' +
        currentBots.map(bot => `<option value="${bot.id}">${bot.username} (${bot.status})</option>`).join('');
    
    if (selectedBotId && currentBots.find(b => b.id == selectedBotId)) {
        selectedBotSelect.value = selectedBotId;
    } else {
        selectedBotId = null;
    }
}

function updateBotStatusInUI(botInfo) {
    const botCard = document.querySelector(`.bot-card[data-bot-id="${botInfo.botId}"]`);
    if (botCard) {
        const statusSpan = botCard.querySelector('.bot-status');
        if (statusSpan) {
            statusSpan.className = `bot-status ${botInfo.status}`;
            statusSpan.textContent = botInfo.status;
        }
        
        const infoDiv = botCard.querySelector('.bot-info');
        if (infoDiv && botInfo.position) {
            infoDiv.innerHTML = `
                Server: ${botInfo.host}:${botInfo.port}<br>
                Position: ${botInfo.position.x}, ${botInfo.position.y}, ${botInfo.position.z}<br>
                ${botInfo.health ? `Health: ${botInfo.health} ❤️ | Food: ${botInfo.food} 🍗` : ''}
            `;
        }
    }
}

window.selectBot = function(botId) {
    selectedBotId = botId;
    selectedBotSelect.value = botId;
    addLog('info', `Selected bot ID: ${botId}`);
};

window.disconnectBot = async function(botId) {
    if (confirm('Disconnect this bot?')) {
        try {
            await fetch(`/api/bots/${botId}/disconnect`, { method: 'POST' });
            addLog('info', `Disconnecting bot ${botId}...`);
        } catch (error) {
            addLog('error', `Error: ${error.message}`);
        }
    }
};

function addLog(type, message) {
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry log-${type}`;
    const timestamp = new Date().toLocaleTimeString();
    logEntry.innerHTML = `<span style="color: #888;">[${timestamp}]</span> ${escapeHtml(message)}`;
    logMessages.appendChild(logEntry);
    logMessages.scrollTop = logMessages.scrollHeight;
    
    while (logMessages.children.length > 500) {
        logMessages.removeChild(logMessages.firstChild);
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Request initial bot list
socket.emit('request-bots-list');
addLog('info', 'Bot controller ready. Create bots to start managing.');
