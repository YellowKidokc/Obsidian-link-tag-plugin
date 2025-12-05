# 🚀 Quick Start Guide

## Theophysics Research Automation with PostgreSQL

This plugin provides epistemic classification, timeline tracking, and analytics with PostgreSQL storage.

---

## ⚡ 3-Step Setup

### Step 1: Start the Backend API
```bash
cd backend
npm install
npm start
```

You should see:
```
🚀 Theophysics Backend API running on http://localhost:3000
```

**Keep this terminal open!**

---

### Step 2: Configure Obsidian Plugin

1. **Reload Obsidian** (Ctrl+R)
2. Go to **Settings → Theophysics Research Automation → Advanced**
3. Enter your PostgreSQL connection:
   ```
   postgresql://postgres:Moss9pep28$@192.168.1.93:5432/theophysics
   ```
4. Click **"Test Connection"** → Should see ✓
5. Click **"Initialize Schema"** → Creates all tables

---

### Step 3: Start Classifying!

1. Open any note
2. Select some text
3. Right-click
4. Choose:
   - **Mark as Axiom ⚛** - Foundational assumption
   - **Mark as Evidence ●** - Supporting data
   - **Mark as Claim ◇** - Declarative statement
   - **Mark as Coherence ⟷** - Logical relationship
   - **Mark as Reference ◈** - External citation

---

## ✅ What You Get

### Right-Click Classifications
- Every selection gets a UUID
- Stored in PostgreSQL with exact position
- Timestamped and attributed
- Queryable across all notes

### Database Schema
```sql
theophysics.notes           -- All notes with UUIDs
theophysics.classifications -- Your classifications
theophysics.epistemic_types -- 8 classification types
theophysics.timeline_events -- Timeline data
theophysics.tags            -- Tag analytics
theophysics.dashboards      -- Generated dashboards
```

### Query Your Research
```sql
-- Get all axioms
SELECT n.title, c.content, c.tagged_at
FROM theophysics.classifications c
JOIN theophysics.notes n ON c.note_id = n.id
JOIN theophysics.epistemic_types t ON c.type_id = t.id
WHERE t.name = 'axiom'
ORDER BY c.tagged_at DESC;
```

---

## 🎯 Features

### Existing Features (Still Work!)
- ✅ Dashboard generation (Math, Theory, Analytics)
- ✅ Auto-linking to glossary
- ✅ Term scanning
- ✅ AI integration (Claude/OpenAI)
- ✅ Tag analytics

### New Features
- ✅ Right-click epistemic classification
- ✅ PostgreSQL storage
- ✅ Note UUIDs
- ✅ Timeline event tracking
- ✅ Cross-note querying

---

## 📁 Distribution Ready

To share this plugin:

1. **Include backend folder** in release
2. **Users run:**
   ```bash
   cd backend
   npm install
   npm start
   ```
3. **Configure connection** in Obsidian settings
4. **Done!**

---

## 🔧 Troubleshooting

### "Failed to load"
- ✅ **Fixed!** Plugin now loads even if backend isn't running
- You'll see a message when trying to use database features

### "Backend API not running"
- Start backend: `cd backend && npm start`
- Check it's on port 3000: http://localhost:3000/health

### "Connection failed"
- Verify PostgreSQL is running
- Check connection string is correct
- Make sure database 'theophysics' exists

### Right-click menu not showing
- Reload Obsidian (Ctrl+R)
- Make sure text is selected
- Check plugin is enabled

---

## 📊 Architecture

```
Obsidian Plugin (Browser)
    ↓ HTTP (fetch)
Backend API (Node.js/Express) on localhost:3000
    ↓ pg library
PostgreSQL Database on 192.168.1.93:5432
```

**Why this design?**
- ✅ Obsidian can't use Node.js modules directly
- ✅ Backend bridges Obsidian → Postgres
- ✅ Easy to distribute
- ✅ Can run backend on server for team use

---

## 🎉 You're Ready!

1. Backend running? ✓
2. Plugin loaded? ✓
3. Connection tested? ✓
4. Schema initialized? ✓

**Start classifying your research!** 🚀

---

## 📚 More Info

- **Full Setup:** See `POSTGRES_SETUP.md`
- **Backend API:** See `backend/README.md`
- **Issues:** Check GitHub issues or console (Ctrl+Shift+I)
