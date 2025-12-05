# Install Epistemic Tagger Plugin to Obsidian Vault
$vaultPath = "D:\THEOPHYSICS_MASTER"
$pluginSource = "D:\Word-ontology"
$pluginName = "obsidian-epistemic-tagger"
$pluginDest = "$vaultPath\.obsidian\plugins\$pluginName"

Write-Host "Installing Epistemic Tagger plugin to vault..." -ForegroundColor Green
Write-Host "Vault: $vaultPath" -ForegroundColor Cyan
Write-Host "Plugin Source: $pluginSource" -ForegroundColor Cyan
Write-Host "Plugin Destination: $pluginDest" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $vaultPath)) {
    Write-Host "ERROR: Vault not found at $vaultPath" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $pluginSource)) {
    Write-Host "ERROR: Plugin source not found at $pluginSource" -ForegroundColor Red
    exit 1
}

$pluginsDir = "$vaultPath\.obsidian\plugins"
if (-not (Test-Path $pluginsDir)) {
    Write-Host "Creating plugins directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $pluginsDir -Force | Out-Null
}

if (-not (Test-Path $pluginDest)) {
    Write-Host "Creating plugin directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $pluginDest -Force | Out-Null
}

# Files needed for Epistemic Tagger
$filesToCopy = @(
    "main.js",
    "manifest.json",
    "styles.css"
)

Write-Host "Copying plugin files..." -ForegroundColor Yellow
$copied = 0
$skipped = 0

foreach ($file in $filesToCopy) {
    $sourceFile = Join-Path $pluginSource $file
    $destFile = Join-Path $pluginDest $file
    
    if (Test-Path $sourceFile) {
        Copy-Item -Path $sourceFile -Destination $destFile -Force
        Write-Host "  Copied $file" -ForegroundColor Green
        $copied++
    } else {
        Write-Host "  Skipped $file (not found)" -ForegroundColor Yellow
        $skipped++
    }
}

Write-Host ""
Write-Host "Installation complete!" -ForegroundColor Green
Write-Host "  Files copied: $copied" -ForegroundColor Cyan
Write-Host "  Files skipped: $skipped" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Green
Write-Host "  1. Open Obsidian" -ForegroundColor White
Write-Host "  2. Go to Settings, then Community Plugins" -ForegroundColor White
Write-Host "  3. Enable Epistemic Tagger" -ForegroundColor White
Write-Host "  4. Reload Obsidian (Ctrl+R)" -ForegroundColor White

