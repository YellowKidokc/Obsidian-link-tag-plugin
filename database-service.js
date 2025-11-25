/**
 * Database Service - PostgreSQL Integration
 * Based on working code from Epistemic Tagger
 */

const { Pool } = require('pg');
const { Notice } = require('obsidian');

class DatabaseService {
  constructor(connectionString) {
    this.pool = null;
    this.connectionString = '';
    this.updateConnection(connectionString);
  }

  updateConnection(connectionString) {
    if (this.pool) {
      this.pool.end();
    }
    this.connectionString = connectionString;
    
    if (!connectionString) {
      return;
    }

    this.pool = new Pool({
      connectionString,
      ssl: false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    // Handle pool errors
    this.pool.on('error', (err) => {
      console.error('Unexpected database pool error:', err);
      new Notice('Database connection error. Check console for details.');
    });
  }

  async testConnection() {
    if (!this.pool) {
      return false;
    }

    try {
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }

  async initializeSchema() {
    if (!this.pool) {
      throw new Error('Database pool not initialized');
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Create schema
      await client.query('CREATE SCHEMA IF NOT EXISTS theophysics');

      // Create notes table with UUIDs
      await client.query(`
        CREATE TABLE IF NOT EXISTS theophysics.notes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          file_path TEXT NOT NULL UNIQUE,
          vault_name TEXT,
          title TEXT,
          content_hash TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          metadata JSONB
        )
      `);

      // Create epistemic types table
      await client.query(`
        CREATE TABLE IF NOT EXISTS theophysics.epistemic_types (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL UNIQUE,
          description TEXT,
          color TEXT,
          icon TEXT,
          priority INT
        )
      `);

      // Create classifications table
      await client.query(`
        CREATE TABLE IF NOT EXISTS theophysics.classifications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          note_id UUID REFERENCES theophysics.notes(id) ON DELETE CASCADE,
          content TEXT NOT NULL,
          type_id UUID REFERENCES theophysics.epistemic_types(id),
          start_offset INT,
          end_offset INT,
          line_start INT,
          line_end INT,
          confidence DECIMAL(3,2) DEFAULT 1.00,
          tagged_by TEXT,
          tagged_at TIMESTAMPTZ DEFAULT NOW(),
          notes TEXT
        )
      `);

      // Create timeline events table
      await client.query(`
        CREATE TABLE IF NOT EXISTS theophysics.timeline_events (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          note_id UUID REFERENCES theophysics.notes(id) ON DELETE CASCADE,
          label TEXT NOT NULL,
          start_year INT,
          end_year INT,
          raw_text TEXT,
          line_number INT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);

      // Create tags table
      await client.query(`
        CREATE TABLE IF NOT EXISTS theophysics.tags (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tag TEXT NOT NULL UNIQUE,
          count INT DEFAULT 0,
          last_seen TIMESTAMPTZ DEFAULT NOW()
        )
      `);

      // Create note_tags junction table
      await client.query(`
        CREATE TABLE IF NOT EXISTS theophysics.note_tags (
          note_id UUID REFERENCES theophysics.notes(id) ON DELETE CASCADE,
          tag_id UUID REFERENCES theophysics.tags(id) ON DELETE CASCADE,
          PRIMARY KEY (note_id, tag_id)
        )
      `);

      // Create dashboards table
      await client.query(`
        CREATE TABLE IF NOT EXISTS theophysics.dashboards (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          type TEXT NOT NULL,
          content TEXT,
          generated_at TIMESTAMPTZ DEFAULT NOW(),
          metadata JSONB
        )
      `);

      // Create indexes
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_notes_path ON theophysics.notes(file_path)
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_notes_vault ON theophysics.notes(vault_name)
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_classifications_note ON theophysics.classifications(note_id)
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_timeline_note ON theophysics.timeline_events(note_id)
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_timeline_years ON theophysics.timeline_events(start_year, end_year)
      `);

      await client.query('COMMIT');
      console.log('✅ Database schema initialized successfully');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Failed to initialize schema:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async seedEpistemicTypes() {
    if (!this.pool) {
      throw new Error('Database pool not initialized');
    }

    const client = await this.pool.connect();
    try {
      await client.query(`
        INSERT INTO theophysics.epistemic_types (name, description, color, icon, priority) VALUES
        ('axiom', 'Foundational assumption or first principle', '#FF6B6B', '⚛', 1),
        ('canonical', 'Established core claim', '#4ECDC4', '◆', 2),
        ('evidence', 'Supporting data or observation', '#95E1D3', '●', 3),
        ('coherence', 'Derived logical relationship', '#F38181', '⟷', 4),
        ('reference', 'External citation or authority', '#AA96DA', '◈', 5),
        ('claim', 'Declarative statement', '#FFD93D', '◇', 6),
        ('definition', 'Term or concept definition', '#6BCB77', '▣', 7),
        ('constraint', 'Logical or structural rule', '#FF6B9D', '⊡', 8)
        ON CONFLICT (name) DO NOTHING
      `);

      console.log('✅ Epistemic types seeded successfully');
    } catch (error) {
      console.error('❌ Failed to seed types:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getOrCreateNote(filePath, vaultName, title) {
    if (!this.pool) {
      throw new Error('Database pool not initialized');
    }

    const client = await this.pool.connect();
    try {
      // Try to get existing note
      const result = await client.query(`
        SELECT id FROM theophysics.notes WHERE file_path = $1
      `, [filePath]);

      if (result.rows.length > 0) {
        return result.rows[0].id;
      }

      // Create new note
      const insertResult = await client.query(`
        INSERT INTO theophysics.notes (file_path, vault_name, title)
        VALUES ($1, $2, $3)
        RETURNING id
      `, [filePath, vaultName, title]);

      return insertResult.rows[0].id;
    } finally {
      client.release();
    }
  }

  async saveClassification(noteId, content, typeName, startOffset, endOffset, lineStart, lineEnd, taggedBy = 'user') {
    if (!this.pool) {
      throw new Error('Database pool not initialized');
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Get type ID
      const typeResult = await client.query(`
        SELECT id FROM theophysics.epistemic_types WHERE name = $1
      `, [typeName]);

      if (typeResult.rows.length === 0) {
        throw new Error(`Type '${typeName}' not found`);
      }

      const typeId = typeResult.rows[0].id;

      // Insert classification
      await client.query(`
        INSERT INTO theophysics.classifications
        (note_id, content, type_id, start_offset, end_offset, line_start, line_end, tagged_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [noteId, content, typeId, startOffset, endOffset, lineStart, lineEnd, taggedBy]);

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async syncTimelineEvent(noteId, label, startYear, endYear, rawText, lineNumber) {
    if (!this.pool) {
      throw new Error('Database pool not initialized');
    }

    const client = await this.pool.connect();
    try {
      await client.query(`
        INSERT INTO theophysics.timeline_events
        (note_id, label, start_year, end_year, raw_text, line_number)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [noteId, label, startYear, endYear, rawText, lineNumber]);
    } finally {
      client.release();
    }
  }

  async syncTags(noteId, tags) {
    if (!this.pool) {
      throw new Error('Database pool not initialized');
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      for (const tag of tags) {
        // Upsert tag
        const tagResult = await client.query(`
          INSERT INTO theophysics.tags (tag, count, last_seen)
          VALUES ($1, 1, NOW())
          ON CONFLICT (tag) DO UPDATE
          SET count = theophysics.tags.count + 1, last_seen = NOW()
          RETURNING id
        `, [tag]);

        const tagId = tagResult.rows[0].id;

        // Link to note
        await client.query(`
          INSERT INTO theophysics.note_tags (note_id, tag_id)
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING
        `, [noteId, tagId]);
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async cleanup() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }
}

module.exports = { DatabaseService };
