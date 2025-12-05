# Troubleshooting Plugin Load Error

## ✅ Confirmed: Correct Plugin Directory

**`D:\Obsidian-link-tag-plugin`** is the correct directory:
- ✅ Plugin ID: `theophysics-research-automation`
- ✅ Most recently modified: Today (11/29/2025)
- ✅ Has all required files (manifest.json, main.js, settings.js)
- ✅ 19 JS/JSON/CSS files

## 🔍 Debugging Steps

### 1. Check Obsidian Console for Errors

1. Open Obsidian
2. Press **`Ctrl+Shift+I`** (opens Developer Console)
3. Go to **Console** tab
4. Look for red error messages
5. Copy any errors you see

### 2. Verify Plugin Files Are Installed

Check that these files exist in:
`D:\THEOPHYSICS_MASTER\.obsidian\plugins\theophysics-research-automation\`

**Required files:**
- ✅ `manifest.json`
- ✅ `main.js` (37,801 bytes - updated today)
- ✅ `settings.js` (32,418 bytes - updated today)
- ✅ `styles.css` (5,068 bytes - updated today)
- ✅ `detector.js`
- ✅ `scanner.js`
- ✅ `review-queue.js`
- ✅ `glossary-manager.js`
- ✅ `auto-linker.js`
- ✅ `math-translator-command.js`
- ✅ `math-layer.js`
- ✅ `theories-layer.js`
- ✅ `ai-integration.js`
- ✅ `database-service.js`
- ✅ `postgres-sync.js`

### 3. Reinstall Plugin

If files are missing or outdated:

```powershell
cd D:\Obsidian-link-tag-plugin
powershell -ExecutionPolicy Bypass -File .\INSTALL_TO_VAULT.ps1
```

### 4. Enable Plugin

1. **Settings** → **Community Plugins**
2. Find **"Theophysics Research Automation"**
3. **Toggle OFF** (if it's on)
4. **Toggle ON**
5. **Reload Obsidian** (`Ctrl+R`)

### 5. Check Plugin Status

In **Settings** → **Community Plugins**, the plugin should show:
- ✅ **Enabled** (toggle is ON)
- ✅ **No error message** below the name

If you see an error message, copy it and check the console.

## 🐛 Common Issues

### "Failed to load"
- **Cause**: Missing file or syntax error
- **Fix**: Reinstall using the script above

### "Plugin not found"
- **Cause**: Files not in correct location
- **Fix**: Run `INSTALL_TO_VAULT.ps1` again

### Commands not showing
- **Cause**: Plugin loaded but commands not registered
- **Fix**: 
  1. Disable plugin
  2. Reload Obsidian
  3. Enable plugin
  4. Reload again

## 📝 After Plugin Loads Successfully

Once the plugin loads, you should see:

1. **In Command Palette** (`Ctrl+P`):
   - Type "50/50" → See "Apply 50/50 Ride or Die Style"
   - Type "50/50" → See "50/50 Ride or Die Visual"

2. **In Settings**:
   - **Settings** → **Theophysics Research Automation**
   - **General** tab → **Visual Identity** section at top
   - Buttons: "Apply to Current Note" and "Open Visual Note"

## 🔧 Still Not Working?

Share the error message from:
1. Obsidian console (`Ctrl+Shift+I` → Console tab)
2. Settings → Community Plugins (error below plugin name)

