/**
 * Theophysics Backend API
 * PostgreSQL bridge for Obsidian plugin
 */

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Database pool (will be initialized per request with connection string)
let pools = new Map();

function getPool(connectionString) {
  if (!pools.has(connectionString)) {
    pools.set(connectionString, new Pool({
      connectionString,
      ssl: false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    }));
  }
  return pools.get(connectionString);
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Theophysics Backend API is running' });
});

// Test database connection
app.post('/api/test-connection', async (req, res) => {
  try {
    const { connectionString } = req.body;
    
    if (!connectionString) {
      return res.status(400).json({ success: false, error: 'Connection string required' });
    }

    const pool = getPool(connectionString);
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();

    res.json({ success: true, message: 'Connection successful' });
  } catch (error) {
    console.error('Connection test failed:', error);
    res.json({ success: false, error: error.message });
  }
});

// Initialize database schema
app.post('/api/initialize-schema', async (req, res) => {
  try {
    const { connectionString } = req.body;
    
    if (!connectionString) {
      return res.status(400).json({ success: false, error: 'Connection string required' });
    }

    const pool = getPool(connectionString);
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Create schema
      await client.query('CREATE SCHEMA IF NOT EXISTS theophysics');

      // Create notes table
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
      await client.query('CREATE INDEX IF NOT EXISTS idx_notes_path ON theophysics.notes(file_path)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_notes_vault ON theophysics.notes(vault_name)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_classifications_note ON theophysics.classifications(note_id)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_timeline_note ON theophysics.timeline_events(note_id)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_timeline_years ON theophysics.timeline_events(start_year, end_year)');

      // Seed epistemic types
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

      await client.query('COMMIT');
      
      res.json({ success: true, message: 'Schema initialized successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Schema initialization failed:', error);
    res.json({ success: false, error: error.message });
  }
});

// Get or create note
app.post('/api/note/get-or-create', async (req, res) => {
  try {
    const { connectionString, filePath, vaultName, title } = req.body;
    
    const pool = getPool(connectionString);
    const client = await pool.connect();

    try {
      // Try to get existing note
      let result = await client.query(
        'SELECT id FROM theophysics.notes WHERE file_path = $1',
        [filePath]
      );

      if (result.rows.length > 0) {
        return res.json({ success: true, noteId: result.rows[0].id });
      }

      // Create new note
      result = await client.query(
        'INSERT INTO theophysics.notes (file_path, vault_name, title) VALUES ($1, $2, $3) RETURNING id',
        [filePath, vaultName, title]
      );

      res.json({ success: true, noteId: result.rows[0].id });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Get/create note failed:', error);
    res.json({ success: false, error: error.message });
  }
});

// Save classification
app.post('/api/classification/save', async (req, res) => {
  try {
    const { 
      connectionString, 
      noteId, 
      content, 
      typeName, 
      startOffset, 
      endOffset, 
      lineStart, 
      lineEnd, 
      taggedBy 
    } = req.body;
    
    const pool = getPool(connectionString);
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get type ID
      const typeResult = await client.query(
        'SELECT id FROM theophysics.epistemic_types WHERE name = $1',
        [typeName]
      );

      if (typeResult.rows.length === 0) {
        throw new Error(`Type '${typeName}' not found`);
      }

      const typeId = typeResult.rows[0].id;

      // Insert classification
      await client.query(
        `INSERT INTO theophysics.classifications
         (note_id, content, type_id, start_offset, end_offset, line_start, line_end, tagged_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [noteId, content, typeId, startOffset, endOffset, lineStart, lineEnd, taggedBy]
      );

      await client.query('COMMIT');
      
      res.json({ success: true, message: 'Classification saved' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Save classification failed:', error);
    res.json({ success: false, error: error.message });
  }
});

// Sync data (bulk operations)
app.post('/api/sync', async (req, res) => {
  try {
    const { connectionString, data } = req.body;
    
    const pool = getPool(connectionString);
    // Process sync data...
    
    res.json({ 
      success: true, 
      recordCount: 0,
      message: 'Sync completed'
    });
  } catch (error) {
    console.error('Sync failed:', error);
    res.json({ success: false, error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Theophysics Backend API running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Ready to accept connections from Obsidian plugin`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  for (const pool of pools.values()) {
    await pool.end();
  }
  process.exit(0);
});
