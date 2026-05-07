const sharp = require('sharp');

/**
 * Advanced in-game renderer for Minecraft bot
 * Renders the game world from the bot's perspective using available data
 */
class IngameRenderer {
  constructor(bot) {
    this.bot = bot;
    this.width = 800;
    this.height = 600;
    this.viewDistance = 16;
    this.fieldOfView = 70; // degrees
    this.initialized = false;
  }

  init(width = 800, height = 600) {
    this.width = width;
    this.height = height;
    this.initialized = true;
    console.log(`[IngameRenderer] Initialized: ${width}x${height}, view distance: ${this.viewDistance}`);
  }

  /**
   * Convert 3D world coordinates to 2D screen coordinates
   */
  worldToScreen(pos, botPos, botYaw, botPitch) {
    // Safely get position values
    const getPosValue = (posObj, axis) => {
      if (!posObj) return 0;
      if (typeof posObj[axis] === 'function') {
        return posObj[axis]();
      }
      if (typeof posObj[axis] === 'number') {
        return posObj[axis];
      }
      // Handle object with x,y,z properties
      if (posObj[axis] !== undefined) {
        return posObj[axis];
      }
      return 0;
    };
    
    const botX = getPosValue(botPos, 'x');
    const botY = getPosValue(botPos, 'y');
    const botZ = getPosValue(botPos, 'z');
    const posX = getPosValue(pos, 'x');
    const posY = getPosValue(pos, 'y');
    const posZ = getPosValue(pos, 'z');
    
    // Translate to camera-relative coordinates
    let dx = posX - botX;
    let dy = posY - botY - 1.6; // Eye height
    let dz = posZ - botZ;

    // Rotate by yaw (horizontal rotation)
    const yawRad = botYaw;
    const cosYaw = Math.cos(-yawRad);
    const sinYaw = Math.sin(-yawRad);
    let xRot = dx * cosYaw - dz * sinYaw;
    let zRot = dx * sinYaw + dz * cosYaw;

    // Rotate by pitch (vertical rotation)
    const pitchRad = botPitch;
    const cosPitch = Math.cos(pitchRad);
    const sinPitch = Math.sin(pitchRad);
    let yRot = dy * cosPitch - zRot * sinPitch;
    let zRot2 = dy * sinPitch + zRot * cosPitch;

    if (zRot2 <= 0) return null; // Behind camera

    // Project to screen
    const fovRad = (this.fieldOfView * Math.PI) / 180;
    const scale = this.height / (2 * Math.tan(fovRad / 2));
    const screenX = this.width / 2 + (xRot * scale) / zRot2;
    const screenY = this.height / 2 - (yRot * scale) / zRot2;

    if (screenX < 0 || screenX > this.width || screenY < 0 || screenY > this.height) {
      return null;
    }

    return { x: screenX, y: screenY, distance: zRot2 };
  }

  /**
   * Get block color based on type
   */
  getBlockColor(block) {
    if (!block || block.name === 'air') return null;
    
    const colors = {
      'grass_block': '#7C9C5C',
      'dirt': '#8B5A2B',
      'stone': '#808080',
      'cobblestone': '#6E6E6E',
      'oak_planks': '#BC9A6C',
      'oak_log': '#8B5A2B',
      'water': '#3B6CE8',
      'sand': '#F4E4A0',
      'gravel': '#A0A0A0',
      'brick': '#B85C38',
      'glass': '#C8E7F5',
      'diamond_block': '#4CEDF0',
      'gold_block': '#F0D040',
      'iron_block': '#E0E0E0',
      'emerald_block': '#50C878',
      'redstone_block': '#FF4500'
    };
    
    return colors[block.name] || '#AA8C6C';
  }

  /**
   * Render the game world from bot's perspective
   */
  async render() {
    if (!this.initialized) {
      this.init();
    }

    if (!this.bot || !this.bot.entity) {
      throw new Error('Bot not ready - missing entity data');
    }
    
    console.log('[IngameRenderer] Starting render...');
    console.log('[IngameRenderer] Bot position:', this.bot.entity.position);
    console.log('[IngameRenderer] Bot held item:', this.bot.heldItem);
    
    // Check if world is available
    if (!this.bot.blockAt && !this.bot.block) {
      console.warn('[IngameRenderer] World data not available');
      // Return a fallback view instead of throwing error
      return this.renderFallback();
    }

    // Safely get position values
    const getPosValue = (posObj, axis) => {
      if (!posObj) return 0;
      if (typeof posObj[axis] === 'function') {
        return posObj[axis]();
      }
      return posObj[axis];
    };
    
    const botX = getPosValue(this.bot.entity.position, 'x');
    const botY = getPosValue(this.bot.entity.position, 'y');
    const botZ = getPosValue(this.bot.entity.position, 'z');
    const botYaw = this.bot.entity.yaw;
    const botPitch = this.bot.entity.pitch;
    
    const botPos = { x: botX, y: botY, z: botZ };

    // Get all nearby blocks (in a radius around the bot)
    const blocks = [];
    const radius = 8;
    let debugBlockCount = 0;
    let totalChecked = 0;
    
    for (let x = -radius; x <= radius; x++) {
      for (let y = -3; y <= 3; y++) {
        for (let z = -radius; z <= radius; z++) {
          totalChecked++;
          // Create block position using Vec3 which has floored method
          const blockX = Math.floor(botX + x);
          const blockY = Math.floor(botY + y);
          const blockZ = Math.floor(botZ + z);
          
          // Try to get block using different methods
          let block = null;
          try {
            // Method 1: Try with object
            block = this.bot.blockAt({ x: blockX, y: blockY, z: blockZ });
            if (!block && this.bot.block) {
              // Method 2: Try with direct method
              block = this.bot.block(blockX, blockY, blockZ);
            }
          } catch (e) {
            // Silently skip blocks that can't be accessed
            continue;
          }
          
          if (block) {
            debugBlockCount++;
            if (block.name && block.name !== 'air') {
              const screenPos = this.worldToScreen(
                { x: blockX + 0.5, y: blockY + 0.5, z: blockZ + 0.5 },
                botPos,
                botYaw,
                botPitch
              );
              if (screenPos) {
                blocks.push({
                  ...screenPos,
                  color: this.getBlockColor(block),
                  name: block.name
                });
              }
            }
          }
        }
      }
    }
    
    console.log(`[IngameRenderer] Checked ${totalChecked} positions, found ${debugBlockCount} blocks, rendered ${blocks.length} blocks`);
    if (blocks.length === 0) {
      console.warn('[IngameRenderer] No blocks found to render! Bot may not have world data or is in unloaded chunk');
    }

    // Sort blocks by distance (far to near for proper depth)
    blocks.sort((a, b) => b.distance - a.distance);

    // Get nearby entities
    const entities = Object.values(this.bot.entities);
    const visibleEntities = [];
    for (const entity of entities) {
      if (entity === this.bot.entity || !entity.position) continue;
      
      const entityX = getPosValue(entity.position, 'x');
      const entityY = getPosValue(entity.position, 'y');
      const entityZ = getPosValue(entity.position, 'z');
      
      // Skip if position values are invalid
      if (isNaN(entityX) || isNaN(entityY) || isNaN(entityZ)) continue;
      
      const screenPos = this.worldToScreen(
        { x: entityX, y: entityY + 1, z: entityZ },
        botPos,
        botYaw,
        botPitch
      );
      if (screenPos) {
        visibleEntities.push({
          ...screenPos,
          username: entity.username,
          type: entity.type,
          entity: entity
        });
      }
    }

    // Generate SVG
    let svg = `<svg width="${this.width}" height="${this.height}" xmlns="http://www.w3.org/2000/svg">`;
    
    // Sky gradient
    svg += `<defs>
      <linearGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:#4A90E2"/>
        <stop offset="100%" style="stop-color:#87CEEB"/>
      </linearGradient>
    </defs>`;
    svg += `<rect width="100%" height="100%" fill="url(#sky)"/>`;

    // Draw blocks
    for (const block of blocks) {
      const size = 20 / (block.distance * 0.5 + 0.5);
      svg += `<rect x="${block.x - size/2}" y="${block.y - size/2}" 
              width="${size}" height="${size}" 
              fill="${block.color}" stroke="#000" stroke-width="1" opacity="0.9"/>`;
    }

    // Draw entities
    for (const entity of visibleEntities) {
      const size = 30 / (entity.distance * 0.5 + 0.5);
      const color = entity.username ? '#4CAF50' : '#FF6B6B';
      svg += `<rect x="${entity.x - size/2}" y="${entity.y - size}" 
              width="${size}" height="${size}" 
              fill="${color}" stroke="#FFF" stroke-width="2" rx="3"/>`;
      
      if (entity.username) {
        svg += `<text x="${entity.x}" y="${entity.y - size - 5}" 
                fill="white" font-size="12" text-anchor="middle" 
                font-weight="bold" stroke="#000" stroke-width="0.5">
          ${entity.username}
        </text>`;
      }
    }

    // Draw crosshair
    const cx = this.width / 2;
    const cy = this.height / 2;
    svg += `<g stroke="white" stroke-width="2" opacity="0.8">
      <line x1="${cx - 15}" y1="${cy}" x2="${cx - 5}" y2="${cy}"/>
      <line x1="${cx + 5}" y1="${cy}" x2="${cx + 15}" y2="${cy}"/>
      <line x1="${cx}" y1="${cy - 15}" x2="${cx}" y2="${cy - 5}"/>
      <line x1="${cx}" y1="${cy + 5}" x2="${cx}" y2="${cy + 15}"/>
      <circle cx="${cx}" cy="${cy}" r="2" fill="white"/>
    </g>`;

    // Draw UI
    const health = this.bot.health || 20;
    const healthPercent = (health / 20) * 200;
    svg += `<rect x="20" y="20" width="200" height="24" fill="#333" stroke="#FFF" stroke-width="2" rx="4"/>`;
    svg += `<rect x="22" y="22" width="${healthPercent}" height="20" fill="#E74C3C" rx="2"/>`;
    svg += `<text x="30" y="37" fill="white" font-size="14" font-weight="bold">❤️ ${health}</text>`;

    const food = this.bot.food || 20;
    const foodPercent = (food / 20) * 200;
    svg += `<rect x="20" y="54" width="200" height="24" fill="#333" stroke="#FFF" stroke-width="2" rx="4"/>`;
    svg += `<rect x="22" y="56" width="${foodPercent}" height="20" fill="#F39C12" rx="2"/>`;
    svg += `<text x="30" y="71" fill="white" font-size="14" font-weight="bold">🍗 ${food}</text>`;

    // Show held item
    if (this.bot.heldItem) {
      const itemName = this.bot.heldItem.displayName || this.bot.heldItem.name || 'Unknown';
      svg += `<rect x="20" y="88" width="200" height="24" fill="#333" stroke="#667eea" stroke-width="2" rx="4"/>`;
      svg += `<text x="30" y="103" fill="#667eea" font-size="13" font-weight="bold">🎮 Holding: ${itemName}</text>`;
    } else {
      svg += `<rect x="20" y="88" width="200" height="24" fill="#333" stroke="#888" stroke-width="2" rx="4"/>`;
      svg += `<text x="30" y="103" fill="#888" font-size="13">✋ Holding: Nothing</text>`;
    }

    // Position info
    svg += `<text x="20" y="${this.height - 20}" fill="white" font-size="12" font-family="monospace">
      XYZ: ${Math.floor(botPos.x)} / ${Math.floor(botPos.y)} / ${Math.floor(botPos.z)}
    </text>`;

    // FPS / info
    const entityCount = visibleEntities.length;
    svg += `<text x="${this.width - 120}" y="${this.height - 20}" fill="white" font-size="11" font-family="monospace">
      Entities: ${entityCount} | Blocks: ${blocks.length}
    </text>`;

    svg += `</svg>`;

    // Convert to PNG
    const buffer = await sharp(Buffer.from(svg))
      .png({ compressionLevel: 6 })
      .toBuffer();

    return {
      success: true,
      image: buffer.toString('base64'),
      width: this.width,
      height: this.height,
      position: {
        x: Math.floor(botPos.x),
        y: Math.floor(botPos.y),
        z: Math.floor(botPos.z)
      },
      stats: {
        health: health,
        food: food,
        entities: entityCount,
        blocks: blocks.length
      }
    };
  }

  renderFallback() {
    console.log('[IngameRenderer] Rendering fallback view');
    
    let svg = `<svg width="${this.width}" height="${this.height}" xmlns="http://www.w3.org/2000/svg">`;
    
    // Background
    svg += `<rect width="100%" height="100%" fill="#1a1a2e"/>`;
    
    // Message
    svg += `<text x="${this.width/2}" y="${this.height/2 - 50}" fill="#ff9800" font-size="24" text-anchor="middle" font-weight="bold">
      ⚠️ World data not available
    </text>`;
    svg += `<text x="${this.width/2}" y="${this.height/2 - 10}" fill="#aaa" font-size="16" text-anchor="middle">
      Waiting for bot to fully load...
    </text>`;
    svg += `<text x="${this.width/2}" y="${this.height/2 + 30}" fill="#888" font-size="14" text-anchor="middle">
      Try again in a few seconds
    </text>`;
    
    // Draw UI
    const health = this.bot.health || 20;
    const healthPercent = (health / 20) * 200;
    svg += `<rect x="20" y="20" width="200" height="24" fill="#333" stroke="#FFF" stroke-width="2" rx="4"/>`;
    svg += `<rect x="22" y="22" width="${healthPercent}" height="20" fill="#E74C3C" rx="2"/>`;
    svg += `<text x="30" y="37" fill="white" font-size="14" font-weight="bold">❤️ ${health}</text>`;

    const food = this.bot.food || 20;
    const foodPercent = (food / 20) * 200;
    svg += `<rect x="20" y="54" width="200" height="24" fill="#333" stroke="#FFF" stroke-width="2" rx="4"/>`;
    svg += `<rect x="22" y="56" width="${foodPercent}" height="20" fill="#F39C12" rx="2"/>`;
    svg += `<text x="30" y="71" fill="white" font-size="14" font-weight="bold">🍗 ${food}</text>`;
    
    svg += `</svg>`;
    
    return this.svgToBuffer(svg);
  }

  async svgToBuffer(svg) {
    const buffer = await sharp(Buffer.from(svg))
      .png({ compressionLevel: 6 })
      .toBuffer();

    return {
      success: true,
      image: buffer.toString('base64'),
      width: this.width,
      height: this.height,
      position: {
        x: Math.floor(this.bot.entity?.position?.x || 0),
        y: Math.floor(this.bot.entity?.position?.y || 0),
        z: Math.floor(this.bot.entity?.position?.z || 0)
      },
      stats: {
        health: this.bot.health || 20,
        food: this.bot.food || 20,
        entities: 0,
        blocks: 0
      }
    };
  }

  cleanup() {
    this.initialized = false;
    console.log('[IngameRenderer] Cleaned up');
  }
}

module.exports = { IngameRenderer };
