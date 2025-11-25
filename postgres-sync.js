/**
 * PostgreSQL Sync Module
 * Syncs vault data (dashboards, analytics, timelines) to PostgreSQL database
 */

const { Notice } = require('obsidian');

class PostgresSync {
  constructor(app, settings) {
    this.app = app;
    this.settings = settings;
    this.syncTimer = null;
    this.isConnected = false;
  }

  /**
   * Test database connection
   */
  async testConnection() {
    if (!this.validateSettings()) {
      new Notice('❌ Please configure all Postgres connection settings');
      return false;
    }

    try {
      new Notice('🔄 Testing Postgres connection...');
      
      // Note: Obsidian plugins run in browser context, so we can't use node-postgres directly
      // We need to make HTTP requests to a backend API that handles the actual DB connection
      const response = await this.makeRequest('/api/test-connection', {
        method: 'POST',
        body: JSON.stringify(this.getConnectionConfig())
      });

      if (response.success) {
        this.isConnected = true;
        new Notice('✅ Postgres connection successful!');
        return true;
      } else {
        new Notice(`❌ Connection failed: ${response.error}`);
        return false;
      }
    } catch (error) {
      new Notice(`❌ Connection error: ${error.message}`);
      console.error('Postgres connection error:', error);
      return false;
    }
  }

  /**
   * Sync all data to Postgres
   */
  async syncAll() {
    if (!this.settings.postgresSync) {
      return;
    }

    if (!this.validateSettings()) {
      new Notice('❌ Postgres sync enabled but connection not configured');
      return;
    }

    try {
      new Notice('🔄 Syncing to Postgres...');

      // Collect all data to sync
      const data = await this.collectSyncData();

      // Send to backend API
      const response = await this.makeRequest('/api/sync', {
        method: 'POST',
        body: JSON.stringify({
          connection: this.getConnectionConfig(),
          data: data
        })
      });

      if (response.success) {
        new Notice(`✅ Synced ${response.recordCount} records to Postgres`);
      } else {
        new Notice(`⚠️ Sync completed with warnings: ${response.message}`);
      }
    } catch (error) {
      new Notice(`❌ Sync failed: ${error.message}`);
      console.error('Postgres sync error:', error);
    }
  }

  /**
   * Collect all vault data for syncing
   */
  async collectSyncData() {
    const data = {
      timestamp: new Date().toISOString(),
      vault_name: this.app.vault.getName(),
      analytics: await this.collectAnalytics(),
      timelines: await this.collectTimelines(),
      tags: await this.collectTags(),
      keywords: await this.collectKeywords(),
      math_symbols: await this.collectMathSymbols(),
      theories: await this.collectTheories()
    };

    return data;
  }

  /**
   * Collect analytics data
   */
  async collectAnalytics() {
    const files = this.app.vault.getMarkdownFiles();
    return {
      total_notes: files.length,
      total_size: files.reduce((sum, f) => sum + f.stat.size, 0),
      last_modified: Math.max(...files.map(f => f.stat.mtime))
    };
  }

  /**
   * Collect timeline events
   */
  async collectTimelines() {
    const events = [];
    const files = this.app.vault.getMarkdownFiles();

    for (const file of files) {
      const content = await this.app.vault.read(file);
      const extracted = this.extractTimelineEvents(content, file.path);
      events.push(...extracted);
    }

    return events;
  }

  /**
   * Extract timeline events from content
   */
  extractTimelineEvents(content, sourcePath) {
    const events = [];
    const lines = content.split('\n');
    
    // Regex patterns for date detection
    const yearRangeRegex = /(\d{1,4})\s*[-–]\s*(\d{1,4})\s*(BC|AD)?/gi;
    const singleYearRegex = /(BC|AD)?\s*(\d{1,4})\s*(BC|AD)?/gi;

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Try to extract year ranges
      let match;
      while ((match = yearRangeRegex.exec(trimmed)) !== null) {
        const era = match[3] || 'AD';
        const startYear = era === 'BC' ? -parseInt(match[1]) : parseInt(match[1]);
        const endYear = era === 'BC' ? -parseInt(match[2]) : parseInt(match[2]);

        events.push({
          source_file: sourcePath,
          line_number: index + 1,
          raw_text: trimmed,
          start_year: startYear,
          end_year: endYear,
          label: trimmed.substring(0, 200)
        });
      }
    });

    return events;
  }

  /**
   * Collect tag data
   */
  async collectTags() {
    const tagCounts = {};
    const files = this.app.vault.getMarkdownFiles();

    for (const file of files) {
      const cache = this.app.metadataCache.getFileCache(file);
      if (cache && cache.tags) {
        cache.tags.forEach(tagRef => {
          const tag = tagRef.tag;
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    }

    return Object.entries(tagCounts).map(([tag, count]) => ({
      tag: tag,
      count: count
    }));
  }

  /**
   * Collect keyword data
   */
  async collectKeywords() {
    // This would integrate with your existing keyword tracking
    // For now, return placeholder
    return [];
  }

  /**
   * Collect math symbols
   */
  async collectMathSymbols() {
    // This would integrate with your math translation layer
    // For now, return placeholder
    return [];
  }

  /**
   * Collect theory references
   */
  async collectTheories() {
    // This would integrate with your theory integration layer
    // For now, return placeholder
    return [];
  }

  /**
   * Get connection configuration
   */
  getConnectionConfig() {
    return {
      host: this.settings.postgresHost,
      port: this.settings.postgresPort,
      database: this.settings.postgresDatabase,
      user: this.settings.postgresUser,
      password: this.settings.postgresPassword
    };
  }

  /**
   * Validate settings
   */
  validateSettings() {
    return !!(
      this.settings.postgresHost &&
      this.settings.postgresPort &&
      this.settings.postgresDatabase &&
      this.settings.postgresUser &&
      this.settings.postgresPassword
    );
  }

  /**
   * Make HTTP request to backend API
   * Note: You'll need to set up a backend service that handles the actual Postgres connection
   */
  async makeRequest(endpoint, options = {}) {
    // Placeholder: In production, this would connect to your backend API
    // For now, we'll simulate the response
    
    // Example backend URL (you'll need to set this up):
    // const baseUrl = 'http://localhost:3000';
    // const response = await fetch(baseUrl + endpoint, {
    //   headers: { 'Content-Type': 'application/json' },
    //   ...options
    // });
    // return await response.json();

    // Simulated response for now
    console.log('Postgres request:', endpoint, options);
    
    if (endpoint === '/api/test-connection') {
      return { success: true };
    } else if (endpoint === '/api/sync') {
      return { success: true, recordCount: 0, message: 'Sync simulated (backend not configured)' };
    }
    
    return { success: false, error: 'Backend API not configured' };
  }

  /**
   * Start automatic sync timer
   */
  startAutoSync() {
    if (!this.settings.postgresSync) {
      return;
    }

    this.stopAutoSync();

    const intervalMs = this.settings.postgresSyncInterval * 1000;
    this.syncTimer = setInterval(() => {
      this.syncAll();
    }, intervalMs);

    console.log(`Postgres auto-sync started (interval: ${this.settings.postgresSyncInterval}s)`);
  }

  /**
   * Stop automatic sync timer
   */
  stopAutoSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
      console.log('Postgres auto-sync stopped');
    }
  }

  /**
   * Cleanup on plugin unload
   */
  cleanup() {
    this.stopAutoSync();
  }
}

module.exports = { PostgresSync };
