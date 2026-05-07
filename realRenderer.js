const { createCanvas } = require('canvas');
const path = require('path');
const fs = require('fs');

/**
 * Real 3D Renderer using Three.js via puppeteer
 * Creates actual game-like screenshots
 */
class RealRenderer {
  constructor(bot) {
    this.bot = bot;
    this.width = 1024;
    this.height = 768;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.browser = null;
    this.page = null;
    this.initialized = false;
  }

  async init(width = 1024, height = 768) {
    this.width = width;
    this.height = height;
    
    try {
      // Dynamic import for puppeteer
      const puppeteer = require('puppeteer');
      
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      this.page = await this.browser.newPage();
      await this.page.setViewport({ width: this.width, height: this.height });
      
      // Create HTML with Three.js viewer
      const html = this.createViewerHTML();
      await this.page.setContent(html);
      
      this.initialized = true;
      console.log('[RealRenderer] Initialized with Three.js');
    } catch (error) {
      console.error('[RealRenderer] Failed to initialize:', error);
      this.initialized = false;
    }
  }

  createViewerHTML() {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { margin: 0; overflow: hidden; font-family: 'Minecraft', monospace; }
        #info {
          position: absolute;
          top: 20px;
          left: 20px;
          color: white;
          background: rgba(0,0,0,0.7);
          padding: 10px;
          border-radius: 5px;
          pointer-events: none;
          z-index: 100;
          font-size: 14px;
        }
        #crosshair {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 20px;
          height: 20px;
          transform: translate(-50%, -50%);
          pointer-events: none;
          z-index: 100;
        }
        #crosshair::before, #crosshair::after {
          content: '';
          position: absolute;
          background: white;
        }
        #crosshair::before {
          top: 50%;
          left: 0;
          width: 100%;
          height: 2px;
          transform: translateY(-50%);
        }
        #crosshair::after {
          top: 0;
          left: 50%;
          width: 2px;
          height: 100%;
          transform: translateX(-50%);
        }
        .ui-bar {
          position: absolute;
          bottom: 20px;
          left: 20px;
          right: 20px;
          background: rgba(0,0,0,0.7);
          padding: 10px;
          border-radius: 5px;
          color: white;
          pointer-events: none;
          z-index: 100;
        }
        .health-bar {
          background: #E74C3C;
          height: 20px;
          transition: width 0.3s;
        }
        .food-bar {
          background: #F39C12;
          height: 20px;
          transition: width 0.3s;
        }
      </style>
    </head>
    <body>
      <div id="info">
        <div>Position: <span id="pos">0, 0, 0</span></div>
        <div>Holding: <span id="heldItem">Nothing</span></div>
      </div>
      <div id="crosshair"></div>
      <div class="ui-bar">
        <div>❤️ Health: <span id="health">20</span></div>
        <div class="health-bar" id="healthBar" style="width: 100%"></div>
        <div>🍗 Food: <span id="food">20</span></div>
        <div class="food-bar" id="foodBar" style="width: 100%"></div>
      </div>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
      <script>
        // Three.js setup
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x87CEEB);
        scene.fog = new THREE.Fog(0x87CEEB, 50, 100);
        
        const camera = new THREE.PerspectiveCamera(70, ${this.width}/${this.height}, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(${this.width}, ${this.height});
        document.body.appendChild(renderer.domElement);
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(1, 1, 1);
        scene.add(directionalLight);
        
        // Simple ground
        const gridHelper = new THREE.GridHelper(100, 20, 0x88ff88, 0x44aa44);
        scene.add(gridHelper);
        
        // Simple blocks around player
        const blockMaterials = {
          grass: new THREE.MeshStandardMaterial({ color: 0x7C9C5C }),
          dirt: new THREE.MeshStandardMaterial({ color: 0x8B5A2B }),
          stone: new THREE.MeshStandardMaterial({ color: 0x808080 }),
          wood: new THREE.MeshStandardMaterial({ color: 0xBC9A6C })
        };
        
        // Create a simple world
        for(let x = -10; x <= 10; x++) {
          for(let z = -10; z <= 10; z++) {
            const blockGeo = new THREE.BoxGeometry(1, 1, 1);
            let material = blockMaterials.grass;
            if(Math.random() > 0.8) material = blockMaterials.dirt;
            if(Math.random() > 0.9) material = blockMaterials.stone;
            const block = new THREE.Mesh(blockGeo, material);
            block.position.set(x, -1, z);
            scene.add(block);
          }
        }
        
        // Simple trees
        for(let i = 0; i < 20; i++) {
          const x = (Math.random() - 0.5) * 40;
          const z = (Math.random() - 0.5) * 40;
          if(Math.abs(x) < 3 && Math.abs(z) < 3) continue;
          
          const trunkGeo = new THREE.BoxGeometry(0.8, 2, 0.8);
          const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8B5A2B });
          const trunk = new THREE.Mesh(trunkGeo, trunkMat);
          trunk.position.set(x, 0, z);
          scene.add(trunk);
          
          const leavesGeo = new THREE.SphereGeometry(0.8);
          const leavesMat = new THREE.MeshStandardMaterial({ color: 0x2E8B57 });
          const leaves = new THREE.Mesh(leavesGeo, leavesMat);
          leaves.position.set(x, 1.5, z);
          scene.add(leaves);
        }
        
        window.updateCamera = (x, y, z, yaw, pitch) => {
          camera.position.set(x, y + 1.6, z);
          camera.rotation.order = 'YXZ';
          camera.rotation.y = yaw;
          camera.rotation.x = pitch;
          
          document.getElementById('pos').textContent = `${Math.floor(x)}, ${Math.floor(y)}, ${Math.floor(z)}`;
        };
        
        window.updateUI = (health, food, heldItem) => {
          document.getElementById('health').textContent = health;
          document.getElementById('food').textContent = food;
          document.getElementById('healthBar').style.width = (health / 20) * 100 + '%';
          document.getElementById('foodBar').style.width = (food / 20) * 100 + '%';
          document.getElementById('heldItem').textContent = heldItem || 'Nothing';
        };
        
        function animate() {
          requestAnimationFrame(animate);
          renderer.render(scene, camera);
        }
        animate();
      </script>
    </body>
    </html>
    `;
  }

  async render() {
    if (!this.initialized) {
      await this.init();
    }

    if (!this.bot || !this.bot.entity) {
      throw new Error('Bot not ready');
    }

    try {
      // Get bot data
      const pos = this.bot.entity.position;
      const x = typeof pos.x === 'function' ? pos.x() : pos.x;
      const y = typeof pos.y === 'function' ? pos.y() : pos.y;
      const z = typeof pos.z === 'function' ? pos.z() : pos.z;
      const yaw = this.bot.entity.yaw;
      const pitch = this.bot.entity.pitch;
      const health = this.bot.health || 20;
      const food = this.bot.food || 20;
      const heldItem = this.bot.heldItem ? (this.bot.heldItem.displayName || this.bot.heldItem.name) : null;

      // Update camera and UI
      await this.page.evaluate((x, y, z, yaw, pitch, health, food, heldItem) => {
        window.updateCamera(x, y, z, yaw, pitch);
        window.updateUI(health, food, heldItem);
      }, x, y, z, yaw, pitch, health, food, heldItem);

      // Wait a frame for render
      await new Promise(resolve => setTimeout(resolve, 100));

      // Take screenshot
      const screenshot = await this.page.screenshot({
        type: 'png',
        encoding: 'base64'
      });

      return {
        success: true,
        image: screenshot,
        width: this.width,
        height: this.height,
        position: { x: Math.floor(x), y: Math.floor(y), z: Math.floor(z) },
        stats: {
          health: health,
          food: food,
          heldItem: heldItem
        }
      };
    } catch (error) {
      console.error('[RealRenderer] Render error:', error);
      throw error;
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
    this.initialized = false;
    console.log('[RealRenderer] Cleaned up');
  }
}

module.exports = { RealRenderer };
