# PostgreSQL Integration Setup

## Overview
This plugin now includes full PostgreSQL integration merged from the Epistemic Tagger plugin. It provides:
- ✅ Direct Postgres connection (no backend API needed)
- ✅ Right-click menu for epistemic classifications
- ✅ UUID tracking for every note
- ✅ Timeline event storage
- ✅ Tag analytics storage
- ✅ Dashboard data persistence

## Prerequisites

### 1. Install Node.js Dependencies
```bash
cd d:\Obsidian-link-tag-plugin
npm install
```

This will install the `pg` (node-postgres) library needed for database connections.

### 2. PostgreSQL Database
You need a PostgreSQL database running. Your current connection:
```
postgresql://postgres:Moss9pep28$@192.168.1.93:5432/memory
```

## Setup Steps

### 1. Configure Connection
1. Open Obsidian Settings → Theophysics Research Automation
2. Go to **Advanced** tab
3. Enter your PostgreSQL connection URL:
   ```
   postgresql://postgres:Moss9pep28$@192.168.1.93:5432/memory
   ```

### 2. Test Connection
Click **"Test Connection"** button. You should see:
```
✓ Database connection successful!
```

### 3. Initialize Schema
Click **"Initialize Schema"** button. This creates:
- `theophysics.notes` - All your notes with UUIDs
- `theophysics.epistemic_types` - Classification types (axiom, evidence, etc.)
- `theophysics.classifications` - Your right-click classifications
- `theophysics.timeline_events` - Timeline data
- `theophysics.tags` - Tag analytics
- `theophysics.dashboards` - Generated dashboards

## Using Epistemic Classifications

### Right-Click Menu
1. Select any text in a note
2. Right-click
3. Choose from:
   - **Mark as Axiom ⚛** - Foundational assumption
   - **Mark as Evidence ●** - Supporting data
   - **Mark as Claim ◇** - Declarative statement
   - **Mark as Coherence ⟷** - Logical relationship
   - **Mark as Reference ◈** - External citation

### What Happens
- Text is saved to PostgreSQL with:
  - Note UUID (auto-generated)
  - Classification type
  - Exact position in file
  - Timestamp
  - Your username

## Database Schema

### Notes Table
```sql
CREATE TABLE theophysics.notes (
  id UUID PRIMARY KEY,
  file_path TEXT UNIQUE,
  vault_name TEXT,
  title TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### Classifications Table
```sql
CREATE TABLE theophysics.classifications (
  id UUID PRIMARY KEY,
  note_id UUID REFERENCES theophysics.notes(id),
  content TEXT,
  type_id UUID REFERENCES theophysics.epistemic_types(id),
  start_offset INT,
  end_offset INT,
  tagged_at TIMESTAMPTZ
);
```

### Epistemic Types
- **axiom** - ⚛ Foundational assumption (#FF6B6B)
- **canonical** - ◆ Established core claim (#4ECDC4)
- **evidence** - ● Supporting data (#95E1D3)
- **coherence** - ⟷ Logical relationship (#F38181)
- **reference** - ◈ External citation (#AA96DA)
- **claim** - ◇ Declarative statement (#FFD93D)
- **definition** - ▣ Term definition (#6BCB77)
- **constraint** - ⊡ Logical rule (#FF6B9D)

## Querying Your Data

### Get all axioms
```sql
SELECT n.title, c.content, c.tagged_at
FROM theophysics.classifications c
JOIN theophysics.notes n ON c.note_id = n.id
JOIN theophysics.epistemic_types t ON c.type_id = t.id
WHERE t.name = 'axiom'
ORDER BY c.tagged_at DESC;
```

### Get timeline for a note
```sql
SELECT label, start_year, end_year, raw_text
FROM theophysics.timeline_events
WHERE note_id = (SELECT id FROM theophysics.notes WHERE file_path = 'your/note.md')
ORDER BY start_year;
```

### Tag frequency
```sql
SELECT tag, count
FROM theophysics.tags
ORDER BY count DESC
LIMIT 20;
```

## Troubleshooting

### "Database pool not initialized"
- Check your connection URL is correct
- Make sure PostgreSQL is running
- Verify network access to 192.168.1.93:5432

### "Failed to initialize schema"
- Check database user has CREATE permissions
- Verify database 'memory' exists
- Check console (Ctrl+Shift+I) for detailed errors

### Right-click menu not showing
- Reload Obsidian (Ctrl+R)
- Check plugin is enabled
- Verify you have text selected

## Next Steps

1. **Install dependencies**: `npm install`
2. **Test connection** in settings
3. **Initialize schema**
4. **Start classifying** your notes!

## Benefits

- 📊 **Query your research** with SQL
- 🔍 **Find patterns** across all notes
- 📈 **Track evolution** of ideas over time
- 🔗 **Link concepts** through classifications
- 💾 **Backup** all metadata to database
- 🤝 **Share** research structure with collaborators
