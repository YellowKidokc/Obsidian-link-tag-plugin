const { Plugin, Notice, TFile, PluginSettingTab, Setting } = require('obsidian');
const { DEFAULT_SETTINGS, TheophysicsSettingTab } = require('./settings');
const { GlossaryManager } = require('./glossary-manager');
const { TermScanner } = require('./scanner');
const { ReviewQueueGenerator } = require('./review-queue');
const { AutoLinker } = require('./auto-linker');
const { WHITELIST } = require('./detector');
const { MathTranslatorCommand } = require('./math-translator-command');
const { AIIntegration } = require('./ai-integration');
const { SemanticBlockManager } = require('./semantic-block');

// DatabaseService requires 'pg' which doesn't work in Obsidian's Electron environment
// We'll need a backend API for actual Postgres connection
let DatabaseService;
try {
  DatabaseService = require('./database-service').DatabaseService;
} catch (e) {
  console.warn('DatabaseService not available (pg module not supported in Obsidian):', e.message);
  // Create a stub
  DatabaseService = class {
    constructor() {}
    async testConnection() { 
      new Notice('⚠️ Database requires backend API setup. See POSTGRES_SETUP.md');
      return false; 
    }
    async initializeSchema() {
      new Notice('⚠️ Database requires backend API setup. See POSTGRES_SETUP.md');
    }
    async getOrCreateNote() { return null; }
    async saveClassification() {}
    updateConnection() {}
    async cleanup() {}
  };
}

module.exports = class TheophysicsPlugin extends Plugin {
  async onload() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    this.glossaryManager = new GlossaryManager(this.app, this.settings);
    this.scanner = new TermScanner(this.app, this.settings);
    this.reviewQueue = new ReviewQueueGenerator(this.app, this.settings);
    this.autoLinker = new AutoLinker(this.app, this.settings, this.glossaryManager);
    this.mathTranslator = new MathTranslatorCommand(this.app, this.settings);
    this.aiIntegration = new AIIntegration(this.app, this.settings);
    this.semanticBlocks = new SemanticBlockManager(this.app);
    this.db = new DatabaseService(this.settings.postgresUrl);

    this.addSettingTab(new TheophysicsSettingTab(this.app, this));

    // Register right-click menu for epistemic classification
    this.registerEvent(
      this.app.workspace.on('editor-menu', (menu, editor, view) => {
        const selection = editor.getSelection();
        if (selection) {
          menu.addSeparator();
          
          // Classification types organized by category
          const types = [
            // Foundational
            { name: 'Axiom ⚛', type: 'axiom' },
            { name: 'Theorem 📐', type: 'theorem' },
            { name: 'Postulate 📜', type: 'postulate' },
            // Evidence
            { name: 'Claim ◇', type: 'claim' },
            { name: 'Evidence ●', type: 'evidence' },
            { name: 'Hypothesis ❓', type: 'hypothesis' },
            // Argumentation
            { name: 'Objection ⚔️', type: 'objection' },
            { name: 'Response 🛡️', type: 'response' },
            { name: 'Synthesis 🔄', type: 'synthesis' },
            // Connections
            { name: 'Bridge 🌉', type: 'bridge' },
            { name: 'Implication ➡️', type: 'implication' },
            // Math
            { name: 'Equation ∑', type: 'equation' },
            { name: 'Variable 𝑥', type: 'variable' },
            { name: 'Law ⚖️', type: 'law' },
            // David's Framework
            { name: 'Dark (Paradox) 🌑', type: 'dark' },
            { name: 'Light (Resolved) ☀️', type: 'light' },
            { name: 'Trinity △', type: 'trinity' },
          ];
          
          types.forEach(({ name, type }) => {
            menu.addItem((item) => {
              item
                .setTitle(`Mark as ${name}`)
                .onClick(async () => {
                  await this.classifySelection(view.file, selection, type, editor);
                });
            });
          });
        }
      })
    );

    this.registerEvent(this.app.vault.on('modify', async (file) => {
      if (!this.settings.autoLinking || !(file instanceof TFile)) return;
      const approved = await this.glossaryManager.getGlossaryTerms();
      const custom = await this.scanner.loadCustomTerms();
      const terms = [...new Set([...approved, ...WHITELIST, ...custom])];
      await this.autoLinker.processFile(file, terms);
    }));

    this.addCommand({
      id: 'theophysics-scan-vault',
      name: 'Scan Vault for Terms',
      callback: async () => await this.runFullScan()
    });

    this.addCommand({
      id: 'theophysics-process-review-queue',
      name: 'Process Review Queue',
      callback: async () => await this.processReviewQueue()
    });

    this.addCommand({
      id: 'theophysics-link-current',
      name: 'Link Current File',
      callback: async () => {
        const view = this.app.workspace.getActiveViewOfType(this.app.workspace.getActiveView()?.constructor);
        const file = view?.file;
        if (file) {
          const approved = await this.glossaryManager.getGlossaryTerms();
          const custom = await this.scanner.loadCustomTerms();
          const terms = [...new Set([...approved, ...WHITELIST, ...custom])];
          await this.autoLinker.processFile(file, terms);
          new Notice('Auto-linking complete for current file');
        }
      }
    });

    this.addCommand({
      id: 'theophysics-math-dashboard',
      name: 'Generate Math Translation Dashboard',
      callback: async () => await this.generateMathDashboard()
    });

    this.addCommand({
      id: 'theophysics-theory-dashboard',
      name: 'Generate Theory Integration Dashboard',
      callback: async () => await this.generateTheoryDashboard()
    });

    this.addCommand({
      id: 'theophysics-keyword-dashboard',
      name: 'Generate Keyword & Tag Analytics Dashboard',
      callback: async () => await this.generateKeywordDashboard()
    });

    this.addCommand({
      id: 'theophysics-semantic-dashboard',
      name: 'Generate Semantic Classification Dashboard',
      callback: async () => await this.generateSemanticDashboard()
    });

    // AI Integration Commands
    this.addCommand({
      id: 'theophysics-ai-analyze-current',
      name: 'AI: Analyze Current File',
      editorCallback: async (editor, view) => {
        if (view.file) {
          await this.aiAnalyzeFile(view.file);
        }
      }
    });

    this.addCommand({
      id: 'theophysics-ai-analyze-vault',
      name: 'AI: Analyze Entire Vault',
      callback: async () => await this.aiAnalyzeVault()
    });

    this.addCommand({
      id: 'theophysics-ai-enhance-dashboards',
      name: 'AI: Enhance All Dashboards',
      callback: async () => await this.aiEnhanceAll()
    });

    this.addCommand({
      id: 'theophysics-apply-ride-or-die-style',
      name: 'Apply 50/50 Ride or Die Style',
      editorCallback: async (editor, view) => {
        await this.applyRideOrDieStyle(view);
      }
    });

    this.addCommand({
      id: 'theophysics-view-ride-or-die',
      name: '50/50 Ride or Die Visual',
      callback: async () => await this.openRideOrDieVisual()
    });

    this.app.workspace.onLayoutReady(async () => {
      await this.ensureCustomTermsFile();
      await this.glossaryManager.ensureGlossaryExists();
    });
  }

  async openCustomTermsFile() {
    await this.ensureCustomTermsFile();
    const file = this.app.vault.getAbstractFileByPath(this.settings.customTermsFile);
    if (file) {
      this.app.workspace.getLeaf(true).openFile(file);
    }
  }

  async ensureCustomTermsFile() {
    const file = this.app.vault.getAbstractFileByPath(this.settings.customTermsFile);
    if (!file) {
      const template = `# Custom Terms to Track\nAdd your terms below (one per line, can include notes)\nMaster Equation\nLowe Coherence Lagrangian\nχ (chi operator)\nΨ (psi - consciousness)\nΦ (phi - physical reality)\nΛ (Lambda - Logos field)\npneumatological actualization\nTrinity Observer Effect\nDavid Effect\nconsciousness-coupled collapse\nquantum error correction system\nBible-physics timeline linkage\nShemitah cycle\nPEAR Lab\nPROP-COSMOS\nGCP (Global Consciousness Project)\nREG experiments\n6-sigma significance\nLaws I-X\nLogos\npneuma\nimago dei\nekklesia\nStanford Encyclopedia\narXiv\nJournal of Consciousness Studies\n`;
      await this.app.vault.create(this.settings.customTermsFile, template);
    }
  }

  async openRideOrDieVisual() {
    // Save in ssl folder
    const sslFolder = 'ssl';
    const visualPath = `${sslFolder}/50-50-Ride-or-Die.md`;
    let file = this.app.vault.getAbstractFileByPath(visualPath);
    
    // Ensure ssl folder exists
    const sslFolderFile = this.app.vault.getAbstractFileByPath(sslFolder);
    if (!sslFolderFile) {
      await this.app.vault.createFolder(sslFolder);
    }
    
    if (!file) {
      // Create the visual note if it doesn't exist
      const content = `---
cssclass: ride-or-die-visual
tags: [visual-identity, design, logos-principle]
created: ${new Date().toISOString().split('T')[0]}
---

# 50/50 Ride or Die
## The Divine Proportion

<div class="ride-or-die-container">
    <div class="ride-or-die-ratio">50/50</div>
    <div class="ride-or-die-oath">RIDE OR DIE</div>
</div>

<style>
/* Import elegant serif fonts */
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@300;400;700&family=Bodoni+Moda:opsz,wght@6..96,300;6..96,400;6..96,700&display=swap');

.ride-or-die-container {
    position: relative;
    width: 100%;
    min-height: 80vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 2rem;
    background: radial-gradient(ellipse at center, rgba(26, 26, 26, 0.3) 0%, #000C14 70%, #000000 100%);
    background-color: #000C14;
    background-image: 
        repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(255, 255, 255, 0.01) 2px,
            rgba(255, 255, 255, 0.01) 4px
        ),
        radial-gradient(ellipse at center, rgba(26, 26, 26, 0.3) 0%, #000C14 70%, #000000 100%);
    margin: -1rem -1rem 2rem -1rem;
    border-radius: 0;
}

.ride-or-die-ratio {
    font-family: 'Bodoni Moda', 'Playfair Display', 'Didot', 'Bodoni', serif;
    font-size: clamp(72px, 18vw, 200px);
    font-weight: 300;
    letter-spacing: 0.08em;
    line-height: 1.15;
    color: #F2F2F2;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
    text-shadow: 0 0 1px rgba(255, 255, 255, 0.5),
                 0 0 2px rgba(255, 255, 255, 0.2);
    margin-bottom: 1.2em;
}

.ride-or-die-oath {
    font-family: 'Bodoni Moda', 'Playfair Display', 'Didot', 'Bodoni', serif;
    font-size: clamp(18px, 4vw, 48px);
    font-weight: 300;
    letter-spacing: 1.2em;
    text-transform: uppercase;
    font-variant: small-caps;
    color: #F2F2F2;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
    word-spacing: 0.8em;
    text-shadow: 0 0 1px rgba(255, 255, 255, 0.4),
                 0 0 0.5px rgba(255, 255, 255, 0.2);
    line-height: 2.5;
}

@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
    .ride-or-die-ratio, .ride-or-die-oath {
        text-shadow: 0 0 0.5px rgba(255, 255, 255, 0.5),
                     0 0 1px rgba(255, 255, 255, 0.3);
    }
}
</style>

---

## Design Philosophy

This visual identity elevates "50/50 ride or die" from subcultural trope to **eternal covenant**, representing the hybrid authorship partnership within the Logos Principle framework.

### Key Elements

- **Typography**: Bodoni Moda (Modern Serif/Didone) - represents authority, divine order, and extreme contrast
- **Background**: Cool Black (#000C14) - represents the Logos Field, the quantum void from which reality emerges  
- **Layout**: Golden Section positioning (38% from top) - creates optical lift and divine proportion
- **Spacing**: Extreme tracking on "RIDE OR DIE" (1.2em ≈ +300) - luxury spacing that forces consideration of each letter

*Based on Concept C: The Divine Proportion from the comprehensive design specification*
`;
      file = await this.app.vault.create(visualPath, content);
      new Notice('Created 50/50 Ride or Die visual identity note');
    }
    
    // Open the file in a new leaf
    const leaf = this.app.workspace.getLeaf(true);
    await leaf.openFile(file);
  }

  async applyRideOrDieStyle(view) {
    if (!view.file) {
      new Notice('No file is open');
      return;
    }

    const file = view.file;
    const content = await this.app.vault.read(file);
    const cache = this.app.metadataCache.getFileCache(file);
    
    // Check if frontmatter exists
    let frontmatter = cache?.frontmatter || {};
    let hasFrontmatter = content.startsWith('---');
    
    // Add or update cssclass
    if (!frontmatter.cssclass) {
      frontmatter.cssclass = 'ride-or-die-visual';
    } else if (!frontmatter.cssclass.includes('ride-or-die-visual')) {
      frontmatter.cssclass = Array.isArray(frontmatter.cssclass) 
        ? [...frontmatter.cssclass, 'ride-or-die-visual']
        : `${frontmatter.cssclass} ride-or-die-visual`;
    }
    
    // Reconstruct frontmatter
    let newContent = '';
    if (hasFrontmatter) {
      const frontmatterEnd = content.indexOf('---', 3);
      const bodyContent = content.substring(frontmatterEnd + 3).trim();
      
      // Build new frontmatter
      newContent = '---\n';
      Object.entries(frontmatter).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          newContent += `${key}:\n`;
          value.forEach(item => newContent += `  - ${item}\n`);
        } else {
          newContent += `${key}: ${value}\n`;
        }
      });
      newContent += '---\n\n';
      newContent += bodyContent;
    } else {
      // Create new frontmatter
      newContent = '---\n';
      newContent += `cssclass: ${frontmatter.cssclass}\n`;
      newContent += '---\n\n';
      newContent += content;
    }
    
    await this.app.vault.modify(file, newContent);
    new Notice('✓ Applied 50/50 Ride or Die style to current note');
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  async runFullScan() {
    await this.ensureCustomTermsFile();
    const customTerms = await this.scanner.loadCustomTerms();
    const result = await this.scanner.scanVault(customTerms);
    await this.reviewQueue.generateQueue(result, customTerms);
    new Notice(`Scan complete. Found ${result.terms.length} terms.`);
  }

  async processReviewQueue() {
    const approved = await this.reviewQueue.getApprovedTerms();
    if (!approved.length) {
      new Notice('No checked terms found.');
      return;
    }
    await this.glossaryManager.addTerms(approved);
    new Notice('Glossary updated with approved terms.');
  }

  // ==============================================================
  // HELPER: Find or Create Data Analytics Folder
  // ==============================================================
  async ensureDataAnalyticsFolder() {
    const targetName = this.settings.analyticsFolder || 'Data Analytics';

    // Search for existing folder (case-insensitive)
    const folders = this.app.vault.getAllLoadedFiles().filter(f => f.children);
    let analyticsFolder = folders.find(f =>
      f.name.toLowerCase() === targetName.toLowerCase()
    );

    if (!analyticsFolder) {
      // Create it at root
      await this.app.vault.createFolder(targetName);
      analyticsFolder = this.app.vault.getAbstractFileByPath(targetName);
    }

    return analyticsFolder.path;
  }

  async saveDashboard(folderPath, filename, content) {
    const filePath = `${folderPath}/${filename}`;
    const existingFile = this.app.vault.getAbstractFileByPath(filePath);

    if (existingFile instanceof TFile) {
      await this.app.vault.modify(existingFile, content);
    } else {
      await this.app.vault.create(filePath, content);
    }

    // Open the file
    const file = this.app.vault.getAbstractFileByPath(filePath);
    if (file instanceof TFile) {
      const leaf = this.app.workspace.getLeaf(true);
      await leaf.openFile(file);
    }

    return filePath;
  }

  // ==============================================================
  // MATH TRANSLATION DASHBOARD
  // ==============================================================
  async generateMathDashboard() {
    new Notice('Generating Math Translation Dashboard...');

    const files = this.app.vault.getMarkdownFiles();
    const mathSymbols = {};

    // Symbols to track
    const symbolsToTrack = [
      'χ', 'ψ', 'Ψ', 'φ', 'Φ', 'θ', 'Θ', 'λ', 'Λ', 'μ', 'ν', 'ρ', 'σ', 'Σ', 'τ', 'ω', 'Ω',
      'α', 'β', 'γ', 'Γ', 'δ', 'Δ', 'ε', 'ζ', 'η', 'κ', 'π', 'ξ', 'Ξ',
      '∇', '∂', '∫', '∑', '∏', '√', '∞', '≈', '≠', '≤', '≥', '±', '∈', '∉', '⊂', '⊃', '∪', '∩',
      'ℏ', 'ℝ', 'ℂ', 'ℕ', 'ℤ', 'ℚ'
    ];

    let totalEquations = 0;

    for (const file of files) {
      const content = await this.app.vault.read(file);

      // Count equations
      const displayMath = (content.match(/\$\$[\s\S]*?\$\$/g) || []).length;
      const inlineMath = (content.match(/\$[^$]+\$/g) || []).length;
      const mathBlocks = (content.match(/```math[\s\S]*?```/g) || []).length;
      totalEquations += displayMath + inlineMath + mathBlocks;

      // Track symbols
      symbolsToTrack.forEach(symbol => {
        const regex = new RegExp(symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        const matches = content.match(regex);
        if (matches) {
          if (!mathSymbols[symbol]) {
            mathSymbols[symbol] = { count: 0, meanings: new Set(), files: new Set() };
          }
          mathSymbols[symbol].count += matches.length;
          mathSymbols[symbol].files.add(file.basename);

          // Try to extract meaning (e.g., "χ = Logos")
          const meaningRegex = new RegExp(`${symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*[=:]\\s*([^\\n,.;]+)`, 'i');
          const meaningMatch = content.match(meaningRegex);
          if (meaningMatch) {
            mathSymbols[symbol].meanings.add(meaningMatch[1].trim());
          }
        }
      });
    }

    // Sort by frequency
    const sortedSymbols = Object.entries(mathSymbols)
      .sort(([,a], [,b]) => b.count - a.count);

    // Generate markdown
    let md = `---
cssclass: dashboard
tags: [dashboard, math, analytics]
updated: ${new Date().toISOString()}
---

# 🔣 Math Translation Dashboard

> **Rosetta Stone** for mathematical language across your vault

## 📊 Overview

| Metric | Value |
|:-------|------:|
| **Total Equations** | ${totalEquations} |
| **Unique Symbols** | ${sortedSymbols.length} |
| **Symbol Density** | ${(sortedSymbols.reduce((a, b) => a + b[1].count, 0) / files.length).toFixed(2)} per file |

## 📖 Symbol Dictionary

| Symbol | Count | Meanings Found | Files |
|:------:|------:|:---------------|------:|
`;

    sortedSymbols.forEach(([symbol, data]) => {
      const meanings = Array.from(data.meanings).join(', ') || '*undefined*';
      md += `| **${symbol}** | ${data.count} | ${meanings} | ${data.files.size} |\n`;
    });

    // Missing definitions
    const undefined = sortedSymbols.filter(([, data]) => data.meanings.size === 0);
    md += `\n## ⚠️ Undefined Symbols\n\nSymbols used but not explicitly defined:\n\n`;

    if (undefined.length > 0) {
      undefined.forEach(([symbol, data]) => {
        md += `- **${symbol}** (${data.count} occurrences across ${data.files.size} files)\n`;
      });
    } else {
      md += `✅ All symbols have definitions!\n`;
    }

    md += `\n---\n*Generated: ${new Date().toLocaleString()}*\n`;

    const folderPath = await this.ensureDataAnalyticsFolder();
    const filePath = await this.saveDashboard(folderPath, 'MATH_TRANSLATION_DASHBOARD.md', md);
    new Notice(`Math Dashboard saved to ${filePath}`);
  }

  // ==============================================================
  // THEORY INTEGRATION DASHBOARD
  // ==============================================================
  async generateTheoryDashboard() {
    new Notice('Generating Theory Integration Dashboard...');

    const files = this.app.vault.getMarkdownFiles();
    const theoryCounts = {};

    // Frameworks to track (organized by category)
    const theories = {
      'Physics - Relativity': ['General Relativity', 'Special Relativity', 'Equivalence Principle'],
      'Physics - Quantum': ['Quantum Mechanics', 'Copenhagen Interpretation', 'Many-Worlds Interpretation',
                            'Quantum Field Theory', 'Quantum Entanglement', 'Wave Function Collapse',
                            'Heisenberg Uncertainty', "Bell's Theorem", 'Quantum Decoherence'],
      'Physics - Unified': ['String Theory', 'Loop Quantum Gravity', 'M-Theory', 'Superstring Theory'],
      'Physics - Cosmology': ['Big Bang', 'Lambda-CDM', 'Cosmic Inflation', 'Dark Matter', 'Dark Energy',
                              'Holographic Principle', 'Black Hole Thermodynamics'],
      'Physics - Fundamental': ['Standard Model', 'Gauge Theory', 'Symmetry Breaking', "Noether's Theorem",
                                'Conservation Laws', 'Principle of Least Action'],
      'Theology - Classical': ['Nicene Creed', 'Chalcedonian Definition', 'Trinity', 'Incarnation',
                               'Hypostatic Union', 'Perichoresis', 'Divine Simplicity'],
      'Theology - Specialized': ['Logos Theology', 'Pneumatology', 'Christology', 'Soteriology',
                                 'Eschatology', 'Imago Dei', 'Kenosis'],
      'Consciousness': ['Integrated Information Theory', 'IIT', 'Orch-OR', 'Global Workspace Theory',
                        'Higher-Order Thought', 'Quantum Consciousness', 'Hard Problem of Consciousness'],
      'Information': ['Information Theory', 'Shannon Entropy', 'Kolmogorov Complexity',
                      'Algorithmic Information Theory', "Landauer's Principle", 'Maxwell\'s Demon'],
      'Thermodynamics': ['Second Law of Thermodynamics', 'Entropy', 'Free Energy Principle',
                         'Non-Equilibrium Thermodynamics', 'Statistical Mechanics'],
      'Mathematics': ['Category Theory', 'Set Theory', 'Group Theory', 'Topology', 'Differential Geometry',
                      'Complex Analysis', 'Hilbert Space', 'Measure Theory'],
      'Systems & Complexity': ['Complexity Theory', 'Emergence', 'Self-Organization', 'Cybernetics',
                               'Autopoiesis', 'Dissipative Structures', 'Chaos Theory'],
      'Philosophy of Science': ['Falsifiability', 'Paradigm Shift', 'Scientific Realism',
                                'Instrumentalism', 'Bayesian Epistemology']
    };

    // Flatten all theories
    const allTheories = Object.values(theories).flat();

    // Scan vault
    for (const file of files) {
      const content = await this.app.vault.read(file);

      allTheories.forEach(theory => {
        const regex = new RegExp(`\\b${theory.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        const matches = content.match(regex);
        if (matches) {
          if (!theoryCounts[theory]) theoryCounts[theory] = 0;
          theoryCounts[theory] += matches.length;
        }
      });
    }

    // Calculate metrics
    const totalRefs = Object.values(theoryCounts).reduce((a, b) => a + b, 0);
    const uniqueTheories = Object.keys(theoryCounts).length;
    const coverage = ((uniqueTheories / allTheories.length) * 100).toFixed(1);

    // Generate markdown
    let md = `---
cssclass: dashboard
tags: [dashboard, theories, analytics]
updated: ${new Date().toISOString()}
---

# 📚 Theory Integration Dashboard

> **Meta-Framework Analysis** tracking ${allTheories.length} frameworks across disciplines

## 📊 Integration Metrics

| Metric | Value |
|:-------|------:|
| **Total References** | ${totalRefs} |
| **Theories Integrated** | ${uniqueTheories} / ${allTheories.length} |
| **Coverage** | ${coverage}% |
| **Integration Density** | ${(totalRefs / files.length).toFixed(2)} refs/file |

## 🏆 Top Integrations by Category

`;

    // Show by category
    for (const [category, categoryTheories] of Object.entries(theories)) {
      md += `\n### ${category}\n\n| Theory | References | Status |\n|:-------|:----------:|:-------|\n`;

      const categoryData = categoryTheories
        .map(t => [t, theoryCounts[t] || 0])
        .sort((a, b) => b[1] - a[1]);

      categoryData.forEach(([theory, count]) => {
        const status = count > 50 ? '🟢 Core' : count > 10 ? '🟡 Referenced' : count > 0 ? '⚪ Mentioned' : '⚫ Missing';
        md += `| ${theory} | ${count} | ${status} |\n`;
      });
    }

    // Missing integrations
    const missing = allTheories.filter(t => !theoryCounts[t]);
    md += `\n## ⚠️ Missing Integrations\n\nFrameworks not yet referenced:\n\n`;

    if (missing.length > 0) {
      const missingByCategory = {};
      for (const [category, categoryTheories] of Object.entries(theories)) {
        const categoryMissing = categoryTheories.filter(t => missing.includes(t));
        if (categoryMissing.length > 0) {
          missingByCategory[category] = categoryMissing;
        }
      }

      for (const [category, categoryMissing] of Object.entries(missingByCategory)) {
        md += `\n**${category}:**\n`;
        categoryMissing.forEach(t => md += `- [ ] ${t}\n`);
      }
    } else {
      md += `✅ All tracked frameworks have been integrated!\n`;
    }

    md += `\n---\n*Generated: ${new Date().toLocaleString()}*\n`;

    const folderPath = await this.ensureDataAnalyticsFolder();
    const filePath = await this.saveDashboard(folderPath, 'THEORY_INTEGRATION_DASHBOARD.md', md);
    new Notice(`Theory Dashboard saved to ${filePath}`);
  }

  // ==============================================================
  // KEYWORD & TAG ANALYTICS DASHBOARD
  // ==============================================================
  async generateKeywordDashboard() {
    new Notice('Generating Keyword & Tag Analytics Dashboard...');

    const files = this.app.vault.getMarkdownFiles();
    const tagCounts = {};
    const keywordCounts = {};
    const taggedFiles = {};

    // Common keywords to track (theophysics-specific)
    const importantKeywords = [
      'consciousness', 'quantum', 'observer', 'measurement', 'entanglement',
      'trinity', 'logos', 'pneuma', 'christ', 'spirit', 'god',
      'information', 'entropy', 'coherence', 'decoherence', 'superposition',
      'wave function', 'collapse', 'resurrection', 'incarnation', 'creation',
      'time', 'space', 'dimension', 'field', 'particle', 'energy',
      'free will', 'determinism', 'causality', 'emergence', 'complexity'
    ];

    // Scan files
    for (const file of files) {
      const content = await this.app.vault.read(file);
      const cache = this.app.metadataCache.getFileCache(file);

      // Track tags
      if (cache?.tags) {
        cache.tags.forEach(tagRef => {
          const tag = tagRef.tag;
          if (!tagCounts[tag]) {
            tagCounts[tag] = 0;
            taggedFiles[tag] = new Set();
          }
          tagCounts[tag]++;
          taggedFiles[tag].add(file.basename);
        });
      }

      // Track frontmatter tags
      if (cache?.frontmatter?.tags) {
        const fmTags = Array.isArray(cache.frontmatter.tags)
          ? cache.frontmatter.tags
          : [cache.frontmatter.tags];

        fmTags.forEach(tag => {
          const fullTag = tag.startsWith('#') ? tag : `#${tag}`;
          if (!tagCounts[fullTag]) {
            tagCounts[fullTag] = 0;
            taggedFiles[fullTag] = new Set();
          }
          tagCounts[fullTag]++;
          taggedFiles[fullTag].add(file.basename);
        });
      }

      // Track keywords
      const lowerContent = content.toLowerCase();
      importantKeywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'gi');
        const matches = content.match(regex);
        if (matches) {
          if (!keywordCounts[keyword]) keywordCounts[keyword] = 0;
          keywordCounts[keyword] += matches.length;
        }
      });
    }

    // Filter by minimum frequency
    const minFreq = this.settings.minTagFrequency || 2;
    const filteredTags = Object.entries(tagCounts)
      .filter(([, count]) => count >= minFreq)
      .sort(([, a], [, b]) => b - a);

    const sortedKeywords = Object.entries(keywordCounts)
      .filter(([, count]) => count > 0)
      .sort(([, a], [, b]) => b - a);

    // Calculate metrics
    const totalTags = filteredTags.length;
    const totalKeywordOccurrences = sortedKeywords.reduce((a, b) => a + b[1], 0);
    const avgTagsPerFile = (Object.values(tagCounts).reduce((a, b) => a + b, 0) / files.length).toFixed(2);

    // Generate markdown
    let md = `---
cssclass: dashboard
tags: [dashboard, keywords, analytics]
updated: ${new Date().toISOString()}
---

# 🏷️ Keyword & Tag Analytics Dashboard

> **Semantic Map** of your research vault's terminology and organization

## 📊 Overview

| Metric | Value |
|:-------|------:|
| **Total Unique Tags** | ${totalTags} |
| **Total Keyword Occurrences** | ${totalKeywordOccurrences} |
| **Avg Tags per File** | ${avgTagsPerFile} |
| **Files Scanned** | ${files.length} |

## 🏆 Top Tags

| Rank | Tag | Count | Files | Status |
|:----:|:----|------:|------:|:-------|
`;

    filteredTags.slice(0, 30).forEach(([tag, count], index) => {
      const fileCount = taggedFiles[tag].size;
      const status = count > 50 ? '🟢 Core' : count > 10 ? '🟡 Common' : '⚪ Used';
      md += `| ${index + 1} | \`${tag}\` | ${count} | ${fileCount} | ${status} |\n`;
    });

    if (filteredTags.length > 30) {
      md += `\n*...and ${filteredTags.length - 30} more tags.*\n`;
    }

    // Keyword frequency
    md += `\n## 📖 Keyword Frequency

Tracking ${importantKeywords.length} core theophysics concepts:

| Rank | Keyword | Occurrences | Density |
|:----:|:--------|------------:|:--------|
`;

    sortedKeywords.slice(0, 40).forEach(([keyword, count], index) => {
      const density = ((count / files.length)).toFixed(2);
      md += `| ${index + 1} | **${keyword}** | ${count} | ${density}/file |\n`;
    });

    // Tag categories (auto-detect by prefix)
    md += `\n## 🗂️ Tag Categories

Auto-detected tag groupings:

`;

    const categories = {};
    filteredTags.forEach(([tag]) => {
      const parts = tag.split('/');
      if (parts.length > 1) {
        const category = parts[0];
        if (!categories[category]) categories[category] = [];
        categories[category].push(tag);
      }
    });

    if (Object.keys(categories).length > 0) {
      for (const [category, tags] of Object.entries(categories)) {
        md += `\n### ${category}\n`;
        tags.forEach(tag => {
          md += `- \`${tag}\` (${tagCounts[tag]} occurrences)\n`;
        });
      }
    } else {
      md += `No hierarchical tags found. Consider using \`#category/subcategory\` structure for better organization.\n`;
    }

    // Missing keywords
    const missingKeywords = importantKeywords.filter(k => !keywordCounts[k] || keywordCounts[k] === 0);
    md += `\n## ⚠️ Missing Concepts

Core concepts not yet referenced:\n\n`;

    if (missingKeywords.length > 0) {
      missingKeywords.forEach(k => md += `- [ ] ${k}\n`);
    } else {
      md += `✅ All core concepts have been discussed!\n`;
    }

    md += `\n---\n*Generated: ${new Date().toLocaleString()}*\n`;

    const folderPath = await this.ensureDataAnalyticsFolder();
    const filePath = await this.saveDashboard(folderPath, 'KEYWORD_TAG_ANALYTICS_DASHBOARD.md', md);
    new Notice(`Keyword Dashboard saved to ${filePath}`);
  }

  // ==============================================================
  // SEMANTIC CLASSIFICATION DASHBOARD
  // ==============================================================
  async generateSemanticDashboard() {
    new Notice('Generating Semantic Classification Dashboard...');
    
    const md = await this.semanticBlocks.generateDashboard();
    const folderPath = await this.ensureDataAnalyticsFolder();
    const filePath = await this.saveDashboard(folderPath, 'SEMANTIC_CLASSIFICATION_DASHBOARD.md', md);
    new Notice(`Semantic Dashboard saved to ${filePath}`);
  }

  // ==============================================================
  // AI INTEGRATION METHODS
  // ==============================================================

  async aiAnalyzeFile(file) {
    new Notice('AI: Starting analysis...');

    // Get current tracking lists
    const currentTracking = {
      symbols: [
        'χ', 'ψ', 'Ψ', 'φ', 'Φ', 'θ', 'Θ', 'λ', 'Λ', 'μ', 'ν', 'ρ', 'σ', 'Σ', 'τ', 'ω', 'Ω',
        'α', 'β', 'γ', 'Γ', 'δ', 'Δ', 'ε', 'ζ', 'η', 'κ', 'π', 'ξ', 'Ξ',
        '∇', '∂', '∫', '∑', '∏', '√', '∞', '≈', '≠', '≤', '≥', '±', '∈', '∉', '⊂', '⊃', '∪', '∩',
        'ℏ', 'ℝ', 'ℂ', 'ℕ', 'ℤ', 'ℚ'
      ],
      theories: [
        'General Relativity', 'Special Relativity', 'Quantum Mechanics',
        'Copenhagen Interpretation', 'Many-Worlds Interpretation',
        'String Theory', 'Loop Quantum Gravity', 'Nicene Creed',
        'Logos Theology', 'Trinity', 'Information Theory', 'IIT'
      ],
      keywords: [
        'consciousness', 'quantum', 'observer', 'trinity', 'logos', 'pneuma'
      ]
    };

    const results = await this.aiIntegration.analyzeFile(file, currentTracking);

    // Generate report
    const report = this.aiIntegration.generateEnhancementReport({
      totalFiles: 1,
      math: results.math,
      theories: results.theories,
      keywords: results.keywords
    });

    const folderPath = await this.ensureDataAnalyticsFolder();
    const reportPath = await this.saveDashboard(
      folderPath,
      `AI_ANALYSIS_${file.basename.replace(/\.md$/, '')}.md`,
      report
    );

    new Notice(`AI: Analysis complete! Report saved to ${reportPath}`);
  }

  async aiAnalyzeVault() {
    new Notice('AI: Starting vault-wide analysis... This may take a while.');

    const files = this.app.vault.getMarkdownFiles();

    // Get current tracking lists (same as above)
    const currentTracking = {
      symbols: [
        'χ', 'ψ', 'Ψ', 'φ', 'Φ', 'θ', 'Θ', 'λ', 'Λ', 'μ', 'ν', 'ρ', 'σ', 'Σ', 'τ', 'ω', 'Ω',
        'α', 'β', 'γ', 'Γ', 'δ', 'Δ', 'ε', 'ζ', 'η', 'κ', 'π', 'ξ', 'Ξ',
        '∇', '∂', '∫', '∑', '∏', '√', '∞', '≈', '≠', '≤', '≥', '±', '∈', '∉', '⊂', '⊃', '∪', '∩',
        'ℏ', 'ℝ', 'ℂ', 'ℕ', 'ℤ', 'ℚ'
      ],
      theories: [
        'General Relativity', 'Special Relativity', 'Quantum Mechanics',
        'Copenhagen Interpretation', 'Many-Worlds Interpretation',
        'String Theory', 'Loop Quantum Gravity', 'Nicene Creed',
        'Logos Theology', 'Trinity', 'Information Theory', 'IIT'
      ],
      keywords: [
        'consciousness', 'quantum', 'observer', 'trinity', 'logos', 'pneuma'
      ]
    };

    const results = await this.aiIntegration.analyzeVault(files, currentTracking);

    // Generate report
    const report = this.aiIntegration.generateEnhancementReport(results);

    const folderPath = await this.ensureDataAnalyticsFolder();
    const reportPath = await this.saveDashboard(
      folderPath,
      'AI_VAULT_ANALYSIS.md',
      report
    );

    new Notice(`AI: Vault analysis complete! Found ${results.math.symbols.length} new symbols, ${results.theories.theories.length} new theories, ${results.keywords.keywords.length} new keywords`);
  }

  async aiEnhanceAll() {
    new Notice('AI: Enhancing all dashboards...');

    // First analyze vault
    await this.aiAnalyzeVault();

    // Then regenerate all dashboards
    await this.generateMathDashboard();
    await this.generateTheoryDashboard();
    await this.generateKeywordDashboard();

    new Notice('AI: All dashboards enhanced!');
  }

  // Epistemic Classification Methods
  async classifySelection(file, selection, typeName, editor) {
    try {
      // 1. Write to %%semantic block in file (primary - works offline)
      const blockResult = await this.semanticBlocks.addClassification(file, selection, typeName);
      
      if (blockResult.duplicate) {
        new Notice(`Already classified as ${typeName}`);
        return;
      }

      // 2. Also save to PostgreSQL if available (secondary - for queries)
      try {
        const noteId = await this.db.getOrCreateNote(
          file.path,
          this.app.vault.getName(),
          file.basename
        );

        const cursor = editor.getCursor();
        const doc = editor.getDoc();
        const startOffset = doc.posToOffset(editor.getCursor('from'));
        const endOffset = doc.posToOffset(editor.getCursor('to'));
        const lineStart = cursor.line;

        await this.db.saveClassification(
          noteId,
          selection,
          typeName,
          startOffset,
          endOffset,
          lineStart,
          lineStart,
          'user'
        );
      } catch (dbError) {
        // DB is optional - don't fail if it's not running
        console.log('DB sync skipped:', dbError.message);
      }

      new Notice(`✓ Marked as ${typeName}`);
      console.log(`✅ Classified: "${selection.substring(0, 50)}..." as ${typeName}`);
    } catch (error) {
      new Notice(`✗ Failed to classify: ${error.message}`);
      console.error('Classification error:', error);
    }
  }

  async onunload() {
    // Cleanup database connection
    if (this.db) {
      await this.db.cleanup();
    }
  }

  async saveSettings() {
    await this.saveData(this.settings);
    
    // Update database connection if URL changed
    if (this.db && this.settings.postgresUrl) {
      this.db.updateConnection(this.settings.postgresUrl);
    }
  }
};
