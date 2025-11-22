# Theophysics Research Automation - Usage Guide

## Quick Start

1. **Install & Enable**
   - Plugin is already installed in your vault
   - Go to Settings → Community Plugins
   - Enable "Theophysics Research Automation"

2. **Configure Scope**
   - Settings → Theophysics Research Automation
   - Choose **"Local"** for specific folder scanning
   - Set folder path: `03_PUBLICATIONS/COMPLETE_LOGOS_PAPERS_FINAL`
   - This will scan all 12-13 Logos papers in that folder

3. **Run First Scan**
   - Use Command Palette (Ctrl/Cmd + P)
   - Run: "Scan Vault for Terms"
   - Plugin will:
     - Find all terms from your custom list
     - Count occurrences (shows as "Local" count)
     - Generate individual term pages in `_Term_Pages/`
     - Fetch external links (Stanford, arXiv, Wikipedia)

## Features

### Folder Scoping
- **Global**: Scans entire vault (shows total count)
- **Local**: Scans only specified folder (shows local count)
- Perfect for focusing on your Logos Papers collection

### Auto-Generated Term Pages
Each term gets its own page with:
- Occurrence count (local or global)
- Context quotes from each file where it appears
- Backlinks to source documents
- External research links

### Smart External Links
- **First view**: Shows all relevant links
- **After first view**: Asks if you want to keep seeing links
- **Learns your preferences**: Hides redundant links automatically
- **Manual control**: Manage preferences in settings

### Safety Controls
All in Settings → Manual Controls & Safety:
- **Clear all term pages**: Delete generated pages (originals untouched)
- **Reset link preferences**: Start fresh with link display
- **Export settings**: Backup your configuration

## How It Scans Your Logos Papers

When you set scope to `03_PUBLICATIONS/COMPLETE_LOGOS_PAPERS_FINAL`:
- Scans ALL files in that folder
- Includes all 12-13 papers (LGS-P01 through LGS-P12)
- Includes subfolders if present
- Shows "Local" tag count for that folder only

## Commands

1. **Scan Vault for Terms** - Full scan + generate pages
2. **Generate Term Pages** - Regenerate pages without scanning
3. **Process Review Queue** - Approve terms to glossary
4. **Link Current File** - Auto-link terms in active file

## What Could Go Wrong?

**Nothing permanent!**
- Creates files in `_Term_Pages/` → Just delete the folder
- Stores preferences → Use "Reset" button
- Plugin crashes → Disable it, no data loss

**Your original papers are never modified** (unless you use auto-linking)

## Tips

1. **Start with Local scope** on your Logos Papers folder
2. **Review generated term pages** to see what was found
3. **Use "Manage link preferences"** to hide redundant links
4. **Export settings** before major changes
5. **Switch to Global** later to scan entire vault

## Example Workflow

```
1. Settings → Scan scope: Local
2. Folder: 03_PUBLICATIONS/COMPLETE_LOGOS_PAPERS_FINAL
3. Enable: Auto-generate term pages ✓
4. Enable: Fetch external links ✓
5. Enable: Smart link display ✓
6. Run: "Scan Vault for Terms"
7. Check: _Term_Pages/ folder for results
8. View a term page → See external links
9. Next view → Plugin asks if you want to keep seeing links
10. Manage preferences as needed
```

## Need Help?

- All features have tooltips in settings
- Check the review queue file for scan results
- Use "Clear all term pages" to start over
- Export settings to backup your configuration
