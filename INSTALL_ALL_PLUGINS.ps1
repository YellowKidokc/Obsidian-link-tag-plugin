# Install All Available Plugins to Obsidian Vault
$vaultPath = "D:\THEOPHYSICS_MASTER"
$pluginsDir = "$vaultPath\.obsidian\plugins"

Write-Host "Installing all plugins to vault..." -ForegroundColor Green
Write-Host "Vault: $vaultPath" -ForegroundColor Cyan
Write-Host ""

# Define all plugins
$plugins = @(
    @{
        Name = "theophysics-research-automation"
        Source = "D:\Obsidian-link-tag-plugin"
        Files = @("main.js", "manifest.json", "styles.css", "settings.js", "detector.js", "scanner.js", "review-queue.js", "glossary-manager.js", "auto-linker.js", "math-translator-command.js", "math-layer.js", "theories-layer.js", "ai-integration.js", "database-service.js", "postgres-sync.js")
        Description = "Theophysics Research Automation"
    },
    @{
        Name = "obsidian-epistemic-tagger"
        Source = "D:\Word-ontology"
        Files = @("main.js", "manifest.json", "styles.css")
        Description = "Epistemic Tagger"
    },
    @{
        Name = "note-definitions"
        Source = "D:\obsidian-note-definitions"
        Files = @("main.js", "manifest.json", "styles.css")
        Description = "Note Definitions"
    },
    @{
        Name = "theophysics-math-translator"
        Source = "D:\Math-Translation-Layer"
        Files = @("main.js", "manifest.json", "styles.css")
        Description = "Theophysics Math Translator"
    }
)

if (-not (Test-Path $vaultPath)) {
    Write-Host "ERROR: Vault not found at $vaultPath" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $pluginsDir)) {
    Write-Host "Creating plugins directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $pluginsDir -Force | Out-Null
}

$totalInstalled = 0
$totalSkipped = 0

foreach ($plugin in $plugins) {
    $pluginSource = $plugin.Source
    $pluginName = $plugin.Name
    $pluginDest = "$pluginsDir\$pluginName"
    
    Write-Host ""
    Write-Host "Processing: $($plugin.Description)" -ForegroundColor Cyan
    Write-Host "  Source: $pluginSource" -ForegroundColor Gray
    Write-Host "  Destination: $pluginDest" -ForegroundColor Gray
    
    if (-not (Test-Path $pluginSource)) {
        Write-Host "  SKIPPED: Source directory not found" -ForegroundColor Yellow
        $totalSkipped++
        continue
    }
    
    # Check if manifest exists
    $manifestPath = Join-Path $pluginSource "manifest.json"
    if (-not (Test-Path $manifestPath)) {
        Write-Host "  SKIPPED: No manifest.json found" -ForegroundColor Yellow
        $totalSkipped++
        continue
    }
    
    # Create plugin directory
    if (-not (Test-Path $pluginDest)) {
        New-Item -ItemType Directory -Path $pluginDest -Force | Out-Null
    }
    
    # Copy files
    $copied = 0
    $fileSkipped = 0
    
    foreach ($file in $plugin.Files) {
        $sourceFile = Join-Path $pluginSource $file
        $destFile = Join-Path $pluginDest $file
        
        if (Test-Path $sourceFile) {
            Copy-Item -Path $sourceFile -Destination $destFile -Force
            $copied++
        } else {
            $fileSkipped++
        }
    }
    
    if ($copied -gt 0) {
        Write-Host "  SUCCESS: Copied $copied files" -ForegroundColor Green
        if ($fileSkipped -gt 0) {
            Write-Host "  WARNING: $fileSkipped files not found" -ForegroundColor Yellow
        }
        $totalInstalled++
    } else {
        Write-Host "  SKIPPED: No files copied" -ForegroundColor Yellow
        $totalSkipped++
    }
}

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host "Installation Summary" -ForegroundColor Green
Write-Host "  Plugins installed: $totalInstalled" -ForegroundColor Cyan
Write-Host "  Plugins skipped: $totalSkipped" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Green
Write-Host "  1. Open Obsidian" -ForegroundColor White
Write-Host "  2. Go to Settings, then Community Plugins" -ForegroundColor White
Write-Host "  3. Enable the plugins you want to use" -ForegroundColor White
Write-Host "  4. Reload Obsidian (Ctrl+R)" -ForegroundColor White
Write-Host ""

