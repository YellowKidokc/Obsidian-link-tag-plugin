# Install Plugin to Your Obsidian Vault

Your plugin code is in `D:\Obsidian-link-tag-plugin` but it needs to be installed in your Obsidian vault at `D:\THEOPHYSICS_MASTER`.

## Quick Install (PowerShell)

1. **Open PowerShell** in the plugin directory:
   ```powershell
   cd D:\Obsidian-link-tag-plugin
   ```

2. **Run the install script**:
   ```powershell
   .\INSTALL_TO_VAULT.ps1
   ```

3. **Open Obsidian** and:
   - Go to **Settings → Community Plugins**
   - Find **"Theophysics Research Automation"**
   - **Enable** it
   - Press **Ctrl+R** to reload

4. **Test the commands**:
   - Press `Ctrl+P` (Command Palette)
   - Type **"50/50"**
   - You should see:
     - "Apply 50/50 Ride or Die Style"
     - "50/50 Ride or Die Visual"

## Manual Install

If the script doesn't work, manually copy these files:

**From:** `D:\Obsidian-link-tag-plugin\`  
**To:** `D:\THEOPHYSICS_MASTER\.obsidian\plugins\theophysics-research-automation\`

**Required files:**
- `main.js`
- `manifest.json`
- `styles.css`
- `settings.js`
- `detector.js`
- `scanner.js`
- `review-queue.js`
- `glossary-manager.js`
- `auto-linker.js`
- `math-translator-command.js`
- `math-layer.js`
- `theories-layer.js`
- `ai-integration.js`
- `database-service.js`
- `postgres-sync.js`

## After Installation

1. **Enable the plugin** in Settings → Community Plugins
2. **Reload Obsidian** (Ctrl+R)
3. **Use the commands**:
   - Command Palette → "50/50" → "Apply 50/50 Ride or Die Style"
   - Or Settings → Theophysics Research Automation → General → "Apply to Current Note" button

## Troubleshooting

**Commands not showing?**
- Make sure plugin is **enabled** in Community Plugins
- **Reload Obsidian** (Ctrl+R)
- Check console (Ctrl+Shift+I) for errors

**Plugin not in list?**
- Make sure files are in: `D:\THEOPHYSICS_MASTER\.obsidian\plugins\theophysics-research-automation\`
- Check that `manifest.json` exists
- Restart Obsidian completely

