/*
 * THEOPHYSICS RESEARCH AUTOMATION - COMPLETE BUNDLE v2
 * Includes: Semantic Block Manager, Right-Click Classification, Dashboards
 */

const { Plugin, Notice, TFile, PluginSettingTab, Setting } = require('obsidian');

// =============================================================================
// SEMANTIC BLOCK MANAGER
// =============================================================================
class SemanticBlockManager {
  constructor(app) {
    this.app = app;
  }

  parseBlock(content) {
    const regex = /%%semantic\s*\n([\s\S]*?)\n%%/;
    const match = content.match(regex);
    if (!match) return null;
    try {
      return JSON.parse(match[1]);
    } catch (e) {
      console.warn('Failed to parse semantic block:', e);
      return { classifications: [], _parseError: true };
    }
  }

  generateBlock(data) {
    const json = JSON.stringify(data, null, 2);
    return `\n%%semantic\n${json}\n%%`;
  }

  async addClassification(file, selectedText, typeName) {
    const content = await this.app.vault.read(file);
    const existing = this.parseBlock(content);
    
    const newEntry = {
      content: selectedText.substring(0, 500),
      type: typeName,
      added: new Date().toISOString().split('T')[0]
    };

    let data, newContent;

    if (existing) {
      const isDupe = existing.classifications.some(
        c => c.content === newEntry.content && c.type === newEntry.type
      );
      if (isDupe) return { success: true, duplicate: true };

      existing.classifications.push(newEntry);
      data = existing;
      newContent = content.replace(/\n?%%semantic\s*\n[\s\S]*?\n%%/, this.generateBlock(data));
    } else {
      data = { classifications: [newEntry] };
      newContent = content.trimEnd() + '\n' + this.generateBlock(data);
    }

    await this.app.vault.modify(file, newContent);
    return { success: true, data, duplicate: false };
  }

  async getClassifications(file) {
    const content = await this.app.vault.read(file);
    const data = this.parseBlock(content);
    return data?.classifications || [];
  }

  async scanVault() {
    const files = this.app.vault.getMarkdownFiles();
    const results = new Map();
    for (const file of files) {
      const classifications = await this.getClassifications(file);
      if (classifications.length > 0) {
        results.set(file.path, classifications);
      }
    }
    return results;
  }

  getTypeIcon(type) {
    const icons = {
      axiom: '⚛️', theorem: '📐', postulate: '📜', terms: '📝',
      claim: '◇', evidence: '●', hypothesis: '❓',
      objection: '⚔️', response: '🛡️', synthesis: '🔄',
      relationship: '🔗', bridge: '🌉', implication: '➡️',
      equation: '∑', variable: '𝑥', law: '⚖️',
      dark: '🌑', light: '☀️', trinity: '△',
      external_link: '🔗', internal_link: '📎', forward_link: '⏩',
      coherence: '⟷', reference: '◈'
    };
    return icons[type] || '📌';
  }

  async generateDashboard() {
    const allData = await this.scanVault();
    const byType = {};
    let total = 0;

    for (const [path, classifications] of allData) {
      for (const c of classifications) {
        if (!byType[c.type]) byType[c.type] = [];
        byType[c.type].push({ ...c, file: path });
        total++;
      }
    }

    let md = `---\ncssclass: dashboard\ntags: [dashboard, semantic, classifications]\nupdated: ${new Date().toISOString()}\n---\n\n# 🏷️ Semantic Classification Dashboard\n\n## 📊 Overview\n\n| Metric | Value |\n|:-------|------:|\n| **Total Classifications** | ${total} |\n| **Files with Classifications** | ${allData.size} |\n| **Unique Types** | ${Object.keys(byType).length} |\n\n## 📖 By Type\n\n`;

    for (const [type, items] of Object.entries(byType).sort((a,b) => b[1].length - a[1].length)) {
      const icon = this.getTypeIcon(type);
      md += `\n### ${icon} ${type} (${items.length})\n\n| Content | File | Added |\n|:--------|:-----|:------|\n`;
      for (const item of items.slice(0, 20)) {
        const shortContent = item.content.substring(0, 60).replace(/\|/g, '\\|').replace(/\n/g, ' ');
        const fileName = item.file.split('/').pop().replace('.md', '');
        md += `| ${shortContent}${item.content.length > 60 ? '...' : ''} | [[${fileName}]] | ${item.added || '-'} |\n`;
      }
      if (items.length > 20) md += `\n*...and ${items.length - 20} more*\n`;
    }

    md += `\n---\n*Generated: ${new Date().toLocaleString()}*\n`;
    return md;
  }
}

// =============================================================================
// DETECTION PATTERNS
// =============================================================================
const DETECTION_PATTERNS = {
  equations: /([A-Z][\w]*)\s*=\s*/g,
  capitalizedPhrases: /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g,
  acronyms: /\b([A-Z]{2,})\b/g,
  biblical: /\b([A-Z][a-z]+\s+\d+:\d+(?:-\d+)?)\b/g,
  technical: /\b(\w+\s+(?:theorem|law|principle|equation|framework|field|coherence))\b/gi
};

const WHITELIST = [
  'Master Equation', 'Lowe Coherence Lagrangian', 'Ten Laws Framework', 'PEAR Lab',
  'General Relativity', 'Quantum Mechanics', 'Logos field', 'consciousness collapse',
  'χ', 'Ψ', 'Φ', 'Λ', 'pneumatological actualization', 'Trinity Observer Effect',
  'David Effect', 'consciousness-coupled collapse', 'quantum error correction'
];

const BLACKLIST = [
  'the', 'and', 'is', 'was', 'are', 'were', 'been', 'being', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'system', 'framework', 'process', 'method'
];

function shouldIgnore(term, extraWhitelist = []) {
  const lower = term.toLowerCase();
  const combinedWhitelist = [...WHITELIST, ...extraWhitelist.map(t => t.toLowerCase())];
  if (combinedWhitelist.includes(lower)) return false;
  if (BLACKLIST.includes(lower)) return true;
  if (term.length < 3) return true;
  return false;
}

function detectTerms(content, extraWhitelist = []) {
  const occurrences = [];
  const lines = content.split('\n');
  lines.forEach((line, index) => {
    if (!line.trim()) return;
    Object.entries(DETECTION_PATTERNS).forEach(([category, pattern]) => {
      const matches = line.matchAll(pattern);
      for (const match of matches) {
        const term = match[1];
        if (!term || shouldIgnore(term, extraWhitelist)) continue;
        occurrences.push({ term, category, line: index + 1, context: line.trim() });
      }
    });
  });
  return occurrences;
}


// =============================================================================
// GLOSSARY MANAGER
// =============================================================================
class GlossaryManager {
  constructor(app, settings) {
    this.app = app;
    this.settings = settings;
  }

  async ensureGlossaryExists() {
    const file = this.app.vault.getAbstractFileByPath(this.settings.glossaryFile);
    if (!file) {
      const folder = this.settings.glossaryFile.split('/').slice(0, -1).join('/');
      if (folder) {
        const folderFile = this.app.vault.getAbstractFileByPath(folder);
        if (!folderFile) await this.app.vault.createFolder(folder);
      }
      await this.app.vault.create(this.settings.glossaryFile, '# Central Glossary\n\n');
    }
  }

  async getGlossaryTerms() {
    const file = this.app.vault.getAbstractFileByPath(this.settings.glossaryFile);
    if (!file) return [];
    const content = await this.app.vault.read(file);
    const terms = [];
    const lines = content.split('\n');
    for (const line of lines) {
      const match = line.match(/^##\s+(.+)$/);
      if (match) terms.push(match[1].trim());
    }
    return terms;
  }

  async addTerms(terms) {
    const file = this.app.vault.getAbstractFileByPath(this.settings.glossaryFile);
    if (!file) return;
    let content = await this.app.vault.read(file);
    const existing = await this.getGlossaryTerms();
    for (const term of terms) {
      if (!existing.includes(term)) {
        content += `\n## ${term}\n\n*Definition pending*\n`;
      }
    }
    await this.app.vault.modify(file, content);
  }
}

// =============================================================================
// TERM SCANNER
// =============================================================================
class TermScanner {
  constructor(app, settings) {
    this.app = app;
    this.settings = settings;
  }

  async loadCustomTerms() {
    const file = this.app.vault.getAbstractFileByPath(this.settings.customTermsFile);
    if (!file) return [];
    const content = await this.app.vault.read(file);
    return content.split('\n')
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('#'));
  }

  async scanVault(customTerms = []) {
    const files = this.app.vault.getMarkdownFiles();
    const allTerms = new Map();
    
    for (const file of files) {
      if (this.settings.excludedFolders.some(f => file.path.includes(f))) continue;
      const content = await this.app.vault.read(file);
      const detected = detectTerms(content, customTerms);
      for (const d of detected) {
        if (!allTerms.has(d.term)) {
          allTerms.set(d.term, { term: d.term, category: d.category, count: 0, files: [] });
        }
        const entry = allTerms.get(d.term);
        entry.count++;
        if (!entry.files.includes(file.path)) entry.files.push(file.path);
      }
    }
    
    return { terms: Array.from(allTerms.values()).sort((a, b) => b.count - a.count) };
  }
}

// =============================================================================
// REVIEW QUEUE GENERATOR
// =============================================================================
class ReviewQueueGenerator {
  constructor(app, settings) {
    this.app = app;
    this.settings = settings;
  }

  async generateQueue(scanResult, customTerms) {
    let content = `# Review Queue\n\nGenerated: ${new Date().toLocaleString()}\n\n## Terms to Review\n\n`;
    for (const t of scanResult.terms.slice(0, 100)) {
      content += `- [ ] **${t.term}** (${t.count} occurrences) [${t.category}]\n`;
    }
    
    const file = this.app.vault.getAbstractFileByPath(this.settings.reviewQueueFile);
    if (file) {
      await this.app.vault.modify(file, content);
    } else {
      await this.app.vault.create(this.settings.reviewQueueFile, content);
    }
  }

  async getApprovedTerms() {
    const file = this.app.vault.getAbstractFileByPath(this.settings.reviewQueueFile);
    if (!file) return [];
    const content = await this.app.vault.read(file);
    const approved = [];
    for (const line of content.split('\n')) {
      const match = line.match(/^- \[x\] \*\*(.+?)\*\*/i);
      if (match) approved.push(match[1]);
    }
    return approved;
  }
}

// =============================================================================
// AUTO LINKER
// =============================================================================
class AutoLinker {
  constructor(app, settings, glossaryManager) {
    this.app = app;
    this.settings = settings;
    this.glossaryManager = glossaryManager;
  }

  async processFile(file, terms) {
    let content = await this.app.vault.read(file);
    let modified = false;
    
    for (const term of terms) {
      const regex = new RegExp(`(?<!\\[\\[)\\b(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b(?!\\]\\])`, 'gi');
      if (regex.test(content)) {
        content = content.replace(regex, `[[${term}|$1]]`);
        modified = true;
      }
    }
    
    if (modified) {
      await this.app.vault.modify(file, content);
    }
  }
}


// =============================================================================
// DEFAULT SETTINGS
// =============================================================================
const DEFAULT_SETTINGS = {
  autoLinking: true,
  linkToGlossary: true,
  minFrequency: 3,
  excludedFolders: ['Assets', 'assets', '_Assets', '.obsidian', 'audio', 'Audio'],
  glossaryFile: 'Glossary/Central_Glossary.md',
  reviewQueueFile: '_Review_Queue.md',
  customTermsFile: '_Custom_Terms.md',
  analyticsFolder: 'Data Analytics'
};

// =============================================================================
// SETTINGS TAB
// =============================================================================
class TheophysicsSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl('h2', { text: 'Theophysics Research Automation' });

    new Setting(containerEl)
      .setName('Auto-linking')
      .setDesc('Automatically link detected terms')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.autoLinking)
        .onChange(async (value) => {
          this.plugin.settings.autoLinking = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Glossary file')
      .setDesc('Path to the central glossary')
      .addText(text => text
        .setValue(this.plugin.settings.glossaryFile)
        .onChange(async (value) => {
          this.plugin.settings.glossaryFile = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Custom terms file')
      .setDesc('Path to custom terms list')
      .addText(text => text
        .setValue(this.plugin.settings.customTermsFile)
        .onChange(async (value) => {
          this.plugin.settings.customTermsFile = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Analytics folder')
      .setDesc('Folder for generated dashboards')
      .addText(text => text
        .setValue(this.plugin.settings.analyticsFolder)
        .onChange(async (value) => {
          this.plugin.settings.analyticsFolder = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Excluded folders')
      .setDesc('Folders to skip (comma-separated)')
      .addTextArea(text => text
        .setValue(this.plugin.settings.excludedFolders.join(', '))
        .onChange(async (value) => {
          this.plugin.settings.excludedFolders = value.split(',').map(f => f.trim()).filter(f => f);
          await this.plugin.saveSettings();
        }));
  }
}


// =============================================================================
// MAIN PLUGIN CLASS
// =============================================================================
class TheophysicsPlugin extends Plugin {
  async onload() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    this.glossaryManager = new GlossaryManager(this.app, this.settings);
    this.scanner = new TermScanner(this.app, this.settings);
    this.reviewQueue = new ReviewQueueGenerator(this.app, this.settings);
    this.autoLinker = new AutoLinker(this.app, this.settings, this.glossaryManager);
    this.semanticBlocks = new SemanticBlockManager(this.app);

    this.addSettingTab(new TheophysicsSettingTab(this.app, this));

    // RIGHT-CLICK MENU FOR SEMANTIC CLASSIFICATION
    this.registerEvent(
      this.app.workspace.on('editor-menu', (menu, editor, view) => {
        const selection = editor.getSelection();
        if (selection) {
          menu.addSeparator();
          
          const types = [
            { name: 'Axiom ⚛', type: 'axiom' },
            { name: 'Theorem 📐', type: 'theorem' },
            { name: 'Postulate 📜', type: 'postulate' },
            { name: 'Claim ◇', type: 'claim' },
            { name: 'Evidence ●', type: 'evidence' },
            { name: 'Hypothesis ❓', type: 'hypothesis' },
            { name: 'Objection ⚔️', type: 'objection' },
            { name: 'Response 🛡️', type: 'response' },
            { name: 'Synthesis 🔄', type: 'synthesis' },
            { name: 'Bridge 🌉', type: 'bridge' },
            { name: 'Implication ➡️', type: 'implication' },
            { name: 'Equation ∑', type: 'equation' },
            { name: 'Variable 𝑥', type: 'variable' },
            { name: 'Law ⚖️', type: 'law' },
            { name: 'Dark (Paradox) 🌑', type: 'dark' },
            { name: 'Light (Resolved) ☀️', type: 'light' },
            { name: 'Trinity △', type: 'trinity' },
          ];
          
          types.forEach(({ name, type }) => {
            menu.addItem((item) => {
              item.setTitle(`Mark as ${name}`)
                .onClick(async () => {
                  await this.classifySelection(view.file, selection, type, editor);
                });
            });
          });
        }
      })
    );

    // Auto-link on file modification
    this.registerEvent(this.app.vault.on('modify', async (file) => {
      if (!this.settings.autoLinking || !(file instanceof TFile)) return;
      const approved = await this.glossaryManager.getGlossaryTerms();
      const custom = await this.scanner.loadCustomTerms();
      const terms = [...new Set([...approved, ...WHITELIST, ...custom])];
      await this.autoLinker.processFile(file, terms);
    }));

    // COMMANDS
    this.addCommand({
      id: 'theophysics-scan-vault',
      name: 'Scan Vault for Terms',
      callback: async () => {
        await this.ensureCustomTermsFile();
        const custom = await this.scanner.loadCustomTerms();
        const res = await this.scanner.scanVault(custom);
        await this.reviewQueue.generateQueue(res, custom);
        new Notice(`Scan Complete: Found ${res.terms.length} terms.`);
      }
    });

    this.addCommand({
      id: 'theophysics-process-review-queue',
      name: 'Process Review Queue',
      callback: async () => {
        const approved = await this.reviewQueue.getApprovedTerms();
        if (approved.length) {
          await this.glossaryManager.addTerms(approved);
          new Notice('Glossary Updated with Approved Terms');
        } else {
          new Notice('No checked terms found in review queue');
        }
      }
    });

    this.addCommand({
      id: 'theophysics-semantic-dashboard',
      name: 'Generate Semantic Classification Dashboard',
      callback: async () => {
        new Notice('Generating Semantic Classification Dashboard...');
        const md = await this.semanticBlocks.generateDashboard();
        const folderPath = await this.ensureDataAnalyticsFolder();
        await this.saveDashboard(folderPath, 'SEMANTIC_CLASSIFICATION_DASHBOARD.md', md);
        new Notice('Semantic Dashboard generated!');
      }
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

    this.app.workspace.onLayoutReady(async () => {
      await this.ensureCustomTermsFile();
      await this.glossaryManager.ensureGlossaryExists();
    });
  }

  async classifySelection(file, selection, typeName, editor) {
    try {
      const blockResult = await this.semanticBlocks.addClassification(file, selection, typeName);
      if (blockResult.duplicate) {
        new Notice(`Already classified as ${typeName}`);
        return;
      }
      new Notice(`✓ Marked as ${typeName}`);
      console.log(`✅ Classified: "${selection.substring(0, 50)}..." as ${typeName}`);
    } catch (error) {
      new Notice(`✗ Failed to classify: ${error.message}`);
      console.error('Classification error:', error);
    }
  }

  async ensureCustomTermsFile() {
    const file = this.app.vault.getAbstractFileByPath(this.settings.customTermsFile);
    if (!file) {
      const template = `# Custom Terms to Track\n# Add your terms below (one per line)\nMaster Equation\nLogos Field\nConsciousness Collapse\nχ (chi operator)\nΨ (psi - consciousness)\n`;
      await this.app.vault.create(this.settings.customTermsFile, template);
    }
  }

  async ensureDataAnalyticsFolder() {
    const targetName = this.settings.analyticsFolder || 'Data Analytics';
    const folders = this.app.vault.getAllLoadedFiles().filter(f => f.children);
    let analyticsFolder = folders.find(f => f.name.toLowerCase() === targetName.toLowerCase());
    if (!analyticsFolder) {
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
    const file = this.app.vault.getAbstractFileByPath(filePath);
    if (file instanceof TFile) {
      const leaf = this.app.workspace.getLeaf(true);
      await leaf.openFile(file);
    }
    return filePath;
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

module.exports = TheophysicsPlugin;
