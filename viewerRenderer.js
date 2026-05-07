const { createServer } = require('http');
const express = require('express');
const path = require('path');
const mineflayer = require('mineflayer');

/**
 * Prismarine Viewer integration - Real 3D rendering
 * This creates an actual 3D view of the game world
 */
class ViewerRenderer {
  constructor(bot, port = 3001) {
    this.bot = bot;
    this.port = port;
    this.server = null;
    this.viewer = null;
    this.initialized = false;
    this.lastScreenshot = null;
  }

  async init() {
    try {
      const { Viewer } = require('prismarine-viewer');
      
      // Create independent HTTP server for viewer
      const app = express();
      this.server = require('http').createServer(app);
      
      // Initialize viewer
      this.viewer = new Viewer(this.server, this.bot);
      await this.viewer.start();
      
      this.server.listen(this.port, () => {
        console.log(`[ViewerRenderer] 3D Viewer running on http://localhost:${this.port}`);
      });
      
      this.initialized = true;
      
      // Wait for viewer to load world
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error('[ViewerRenderer] Failed to initialize:', error);
      this.initialized = false;
      throw error;
    }
  }

  async captureScreenshot() {
    if (!this.initialized) {
      throw new Error('Viewer not initialized');
    }

    try {
      // Use puppeteer to capture the viewer page
      const puppeteer = require('puppeteer');
      
      const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      await page.setViewport({ width: 1024, height: 768 });
      
      // Navigate to viewer
      await page.goto(`http://localhost:${this.port}`, {
        waitUntil: 'networkidle0',
        timeout: 10000
      });
      
      // Wait for 3D scene to load
      await page.waitForSelector('canvas', { timeout: 5000 });
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Take screenshot
      const screenshot = await page.screenshot({
        type: 'png',
        encoding: 'base64'
      });
      
      await browser.close();
      
      return {
        success: true,
        image: screenshot,
        width: 1024,
        height: 768,
        position: {
          x: Math.floor(this.bot.entity.position.x),
          y: Math.floor(this.bot.entity.position.y),
          z: Math.floor(this.bot.entity.position.z)
        },
        stats: {
          health: this.bot.health,
          food: this.bot.food,
          heldItem: this.bot.heldItem ? this.bot.heldItem.name : null
        }
      };
    } catch (error) {
      console.error('[ViewerRenderer] Screenshot error:', error);
      throw error;
    }
  }

  cleanup() {
    if (this.viewer) {
      this.viewer.close();
    }
    if (this.server) {
      this.server.close();
    }
    this.initialized = false;
    console.log('[ViewerRenderer] Cleaned up');
  }
}

module.exports = { ViewerRenderer };
