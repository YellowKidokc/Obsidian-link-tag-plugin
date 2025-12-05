# Theophysics Research Automation Plugin

An Obsidian plugin that automatically detects, links, and manages key terms across research papers with a central glossary system.

## Features
- **Term Scanner**: scans all markdown files using detection patterns for equations, capitalized phrases, acronyms, biblical references, and technical terms.
- **Review Queue**: generates `_term_review_queue.md` grouped by confidence and highlighting custom terms.
- **Auto-Linker**: links approved/whitelisted terms to the central glossary on file save.
- **Glossary Manager**: ensures `Theophysics_Glossary.md` exists and creates stub entries for approved terms.
- **Definition Maintenance Mode**: scan only the configured Definitions folder to focus on glossary upkeep.
- **Definition Dashboard**: generates `Definition_Dashboard.md` with coverage, missing items, and pending review queue stats.
- **Custom Terms**: user-managed `Theophysics_Custom_Terms.md` merged with auto-detected terms during scans.

## Usage
1. Install the plugin in your vault.
2. Run **Scan Vault for Terms** to generate the review queue.
3. Check boxes for terms you want in the glossary and run **Process Review Queue**.
4. Auto-linking will annotate files on save; use **Link Current File** to process manually.
5. Use **Definition Maintenance Mode (Definitions folder only)** to re-scan only the `Definitions` directory and refresh the Definition Dashboard.

## Files
- `manifest.json` – Obsidian plugin metadata.
- `main.js` – plugin entry point and command registration.
- `settings.js` – settings tab and defaults.
- `detector.js` – pattern-based term detection.
- `scanner.js` – vault scanner and frequency counter.
- `review-queue.js` – builds the review queue markdown file.
- `glossary-manager.js` – central glossary helpers.
- `auto-linker.js` – link insertion logic.
- `styles.css` – optional styling.

## Building
This repo is plain JavaScript; no build step is required beyond bundling for Obsidian. Copy the files into your plugin directory or load via a development environment.
