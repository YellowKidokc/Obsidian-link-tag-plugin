const { Plugin, Notice, TFile, PluginSettingTab, Setting } = require('obsidian');
const { DEFAULT_SETTINGS, TheophysicsSettingTab } = require('./settings');
const { GlossaryManager } = require('./glossary-manager');
const { TermScanner } = require('./scanner');
const { ReviewQueueGenerator } = require('./review-queue');
const { AutoLinker } = require('./auto-linker');
const { WHITELIST } = require('./detector');
const { MathTranslatorCommand } = require('./math-translator-command');

module.exports = class TheophysicsPlugin extends Plugin {
  async onload() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    this.glossaryManager = new GlossaryManager(this.app, this.settings);
    this.scanner = new TermScanner(this.app, this.settings);
    this.reviewQueue = new ReviewQueueGenerator(this.app, this.settings);
    this.autoLinker = new AutoLinker(this.app, this.settings, this.glossaryManager);
    this.mathTranslator = new MathTranslatorCommand(this.app, this.settings);

    this.addSettingTab(new TheophysicsSettingTab(this.app, this));

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
    // Search for existing folder (case-insensitive)
    const folders = this.app.vault.getAllLoadedFiles().filter(f => f.children);
    let analyticsFolder = folders.find(f =>
      f.name.toLowerCase() === 'data analytics' ||
      f.name.toLowerCase() === 'data analyst'
    );

    if (!analyticsFolder) {
      // Create it at root
      await this.app.vault.createFolder('Data Analytics');
      analyticsFolder = this.app.vault.getAbstractFileByPath('Data Analytics');
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
};
