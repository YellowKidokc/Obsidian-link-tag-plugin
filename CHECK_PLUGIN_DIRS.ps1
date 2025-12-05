# Check which plugin directory is the most complete/updated
Write-Host "Checking plugin directories..." -ForegroundColor Green
Write-Host ""

$dirs = @(
    "D:\Obsidian-link-tag-plugin",
    "D:\obsidian-note-definitions",
    "D:\Word-ontology",
    "D:\Obsidian-Theophysics-research",
    "D:\Obsidian-Plugin-Module-Notes",
    "D:\Obsidian-Tags-Data-Analytics",
    "D:\Math-Translation-Layer"
)

$results = @()

foreach ($dir in $dirs) {
    if (Test-Path $dir) {
        $manifest = Join-Path $dir "manifest.json"
        $main = Join-Path $dir "main.js"
        $settings = Join-Path $dir "settings.js"
        
        $hasManifest = Test-Path $manifest
        $hasMain = Test-Path $main
        $hasSettings = Test-Path $settings
        
        if ($hasManifest) {
            $manifestContent = Get-Content $manifest -Raw | ConvertFrom-Json
            $pluginName = $manifestContent.name
            $pluginId = $manifestContent.id
        } else {
            $pluginName = "Unknown"
            $pluginId = "Unknown"
        }
        
        $fileCount = (Get-ChildItem $dir -File | Where-Object { $_.Extension -eq ".js" -or $_.Extension -eq ".json" -or $_.Extension -eq ".css" }).Count
        
        if ($hasMain) {
            $mainDate = (Get-Item $main).LastWriteTime
            $mainSize = (Get-Item $main).Length
        } else {
            $mainDate = $null
            $mainSize = 0
        }
        
        $results += [PSCustomObject]@{
            Directory = $dir
            PluginName = $pluginName
            PluginID = $pluginId
            HasManifest = $hasManifest
            HasMain = $hasMain
            HasSettings = $hasSettings
            FileCount = $fileCount
            MainLastModified = $mainDate
            MainSize = $mainSize
        }
    }
}

Write-Host "Plugin Directory Analysis:" -ForegroundColor Cyan
Write-Host "=" * 80 -ForegroundColor Gray
Write-Host ""

foreach ($result in $results) {
    Write-Host "Directory: $($result.Directory)" -ForegroundColor Yellow
    Write-Host "  Plugin Name: $($result.PluginName)" -ForegroundColor White
    Write-Host "  Plugin ID: $($result.PluginID)" -ForegroundColor White
    Write-Host "  Has manifest.json: $($result.HasManifest)" -ForegroundColor $(if ($result.HasManifest) { "Green" } else { "Red" })
    Write-Host "  Has main.js: $($result.HasMain)" -ForegroundColor $(if ($result.HasMain) { "Green" } else { "Red" })
    Write-Host "  Has settings.js: $($result.HasSettings)" -ForegroundColor $(if ($result.HasSettings) { "Green" } else { "Red" })
    Write-Host "  JS/JSON/CSS files: $($result.FileCount)" -ForegroundColor Cyan
    if ($result.MainLastModified) {
        Write-Host "  main.js last modified: $($result.MainLastModified)" -ForegroundColor Cyan
        Write-Host "  main.js size: $($result.MainSize) bytes" -ForegroundColor Cyan
    }
    Write-Host ""
}

# Find the one with "theophysics-research-automation" ID
$theophysicsPlugin = $results | Where-Object { $_.PluginID -eq "theophysics-research-automation" }

if ($theophysicsPlugin) {
    Write-Host "RECOMMENDED: $($theophysicsPlugin.Directory)" -ForegroundColor Green
    Write-Host "  This is the Theophysics Research Automation plugin" -ForegroundColor Green
    Write-Host ""
}

# Find most recently modified
$mostRecent = $results | Where-Object { $_.MainLastModified } | Sort-Object MainLastModified -Descending | Select-Object -First 1

if ($mostRecent) {
    Write-Host "MOST RECENTLY MODIFIED: $($mostRecent.Directory)" -ForegroundColor Magenta
    Write-Host "  Last modified: $($mostRecent.MainLastModified)" -ForegroundColor Magenta
    Write-Host ""
}

