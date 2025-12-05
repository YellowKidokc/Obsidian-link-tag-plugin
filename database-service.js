/**
 * Database Service - PostgreSQL Integration via Backend API
 * Connects to backend server instead of direct pg connection
 */

// Note: Notice is passed in methods, not required here to avoid load issues

class DatabaseService {
  constructor(connectionString) {
    this.connectionString = '';
    this.apiUrl = 'http://localhost:3000';
    this.updateConnection(connectionString);
  }

  updateConnection(connectionString) {
    this.connectionString = connectionString;
  }

  async testConnection() {
    if (!this.connectionString) {
      return false;
    }

    try {
      const response = await fetch(`${this.apiUrl}/api/test-connection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionString: this.connectionString })
      });
      
      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Database connection test failed:', error);
      console.warn('⚠️ Backend API not running. Start with: cd backend && npm start');
      return false;
    }
  }

  async initializeSchema() {
    if (!this.connectionString) {
      throw new Error('Connection string not set');
    }

    try {
      const response = await fetch(`${this.apiUrl}/api/initialize-schema`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionString: this.connectionString })
      });
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Schema initialization failed:', error);
      throw error;
    }
  }

  async seedEpistemicTypes() {
    // Types are seeded automatically in initializeSchema
    return;
  }

  async getOrCreateNote(filePath, vaultName, title) {
    if (!this.connectionString) {
      throw new Error('Connection string not set');
    }

    try {
      const response = await fetch(`${this.apiUrl}/api/note/get-or-create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionString: this.connectionString,
          filePath,
          vaultName,
          title
        })
      });
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.noteId;
    } catch (error) {
      console.error('Get/create note failed:', error);
      throw error;
    }
  }

  async saveClassification(noteId, content, typeName, startOffset, endOffset, lineStart, lineEnd, taggedBy = 'user') {
    if (!this.connectionString) {
      throw new Error('Connection string not set');
    }

    try {
      const response = await fetch(`${this.apiUrl}/api/classification/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionString: this.connectionString,
          noteId,
          content,
          typeName,
          startOffset,
          endOffset,
          lineStart,
          lineEnd,
          taggedBy
        })
      });
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Save classification failed:', error);
      throw error;
    }
  }

  async syncTimelineEvent(noteId, label, startYear, endYear, rawText, lineNumber) {
    // TODO: Implement timeline sync endpoint
    console.log('Timeline sync not yet implemented');
  }

  async syncTags(noteId, tags) {
    // TODO: Implement tag sync endpoint
    console.log('Tag sync not yet implemented');
  }

  async cleanup() {
    // No cleanup needed for HTTP client
  }
}

module.exports = { DatabaseService };
