const { Plugin, Notice, TFile, PluginSettingTab, Setting } = require('obsidian');

// ===== DETECTOR MODULE =====
const DETECTION_PATTERNS = {
  equations: /([A-Z][\w])\s*=\s*/g,
  capitalizedPhrases: /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g,
  acronyms: /\b([A-Z]{2,})\b/g,
  biblical: /\b([A-Z][a-z]+\s+\d+:\d+(?:-\d+)?)\b/g,
  technical: /\b(\w+\s+(?:theorem|law|principle|equation|framework|field|coherence))\b/gi
};

const WHITELIST = [
  'Master Equation',
  'Lowe Coherence Lagrangian',
  'Ten Laws Framework',
  'PEAR Lab',
  'General Relativity',
  'Quantum Mechanics',
  'Logos field',
  'consciousness collapse'
];

const BLACKLIST = [
  'the', 'and', 'is', 'was', 'are', 'were', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'system', 'framework', 'process', 'method'
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
        occurrences.push({
          term,
          category,
          line: index + 1,
          context: line.trim()
        });
      }
    });
  });
  return occurrences;
}

// ===== SETTINGS MODULE =====
const DEFAULT_SETTINGS = {
  autoLinking: true,
  linkToGlossary: true,
  linkToExternal: true,
  detectScientific: true,
  detectBiblical: true,
  detectCitations: true,
  detectEquations: true,
  detectPersons: false,
  autoGenerateStubs: true,
  autoGenerateTermPages: true,
  fetchExternalLinks: true,
  smartLinkDisplay: true,
  promptOnFirstView: true,
  flagUndefined: true,
  showUsageCount: true,
  postgresSync: false,
  minFrequency: 3,
  scanScope: 'global',
  scopedFolder: '',
  termPagesFolder: '_Term_Pages',
  customTerms: [],
  customTermsFile: 'Theophysics_Custom_Terms.md',
  glossaryFile: 'Theophysics_Glossary.md',
  reviewQueueFile: '_term_review_queue.md',
  linkPreferences: {},
  whitelist: [],
  blacklist: []
};

class TheophysicsSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl('h2', { text: 'Theophysics Research Automation Settings' });

    new Setting(containerEl)
      .setName('Auto-linking')
      .setDesc('Automatically link detected terms to glossary entries on file save')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.autoLinking)
        .onChange(async (value) => {
          this.plugin.settings.autoLinking = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Scan scope')
      .setDesc('Choose between global (entire vault) or local (specific folder) scanning')
      .addDropdown(dropdown => dropdown
        .addOption('global', 'Global (Entire Vault)')
        .addOption('local', 'Local (Specific Folder)')
        .setValue(this.plugin.settings.scanScope)
        .onChange(async (value) => {
          this.plugin.settings.scanScope = value;
          await this.plugin.saveSettings();
          this.display();
        }));

    if (this.plugin.settings.scanScope === 'local') {
      new Setting(containerEl)
        .setName('Scoped folder')
        .setDesc('Folder path to scan (e.g., 03_PUBLICATIONS/COMPLETE_LOGOS_PAPERS_FINAL)')
        .addText(text => text
          .setPlaceholder('folder/path')
          .setValue(this.plugin.settings.scopedFolder)
          .onChange(async (value) => {
            this.plugin.settings.scopedFolder = value;
            await this.plugin.saveSettings();
          }));
    }

    new Setting(containerEl)
      .setName('Auto-generate term pages')
      .setDesc('Automatically create individual pages for each term with context aggregation')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.autoGenerateTermPages)
        .onChange(async (value) => {
          this.plugin.settings.autoGenerateTermPages = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Fetch external links')
      .setDesc('Automatically fetch and embed links from Stanford Encyclopedia, arXiv, etc.')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.fetchExternalLinks)
        .onChange(async (value) => {
          this.plugin.settings.fetchExternalLinks = value;
          await this.plugin.saveSettings();
          this.display();
        }));

    if (this.plugin.settings.fetchExternalLinks) {
      new Setting(containerEl)
        .setName('Smart link display')
        .setDesc('Learn from your behavior - hide links you\'ve seen before')
        .addToggle(toggle => toggle
          .setValue(this.plugin.settings.smartLinkDisplay)
          .onChange(async (value) => {
            this.plugin.settings.smartLinkDisplay = value;
            await this.plugin.saveSettings();
          }));

      new Setting(containerEl)
        .setName('Prompt on first view')
        .setDesc('Ask if you want to keep seeing links after viewing a term page once')
        .addToggle(toggle => toggle
          .setValue(this.plugin.settings.promptOnFirstView)
          .onChange(async (value) => {
            this.plugin.settings.promptOnFirstView = value;
            await this.plugin.saveSettings();
          }));

      new Setting(containerEl)
        .setName('Manage link preferences')
        .setDesc('View and edit which terms show external links')
        .addButton(button => button
          .setButtonText('Manage')
          .onClick(async () => {
            await this.plugin.showLinkPreferences();
          }));
    }

    new Setting(containerEl)
      .setName('Minimum frequency')
      .setDesc('Only include terms that appear at least this many times across the vault')
      .addText(text => text
        .setPlaceholder('3')
        .setValue(String(this.plugin.settings.minFrequency))
        .onChange(async (value) => {
          const num = parseInt(value, 10);
          if (!isNaN(num) && num > 0) {
            this.plugin.settings.minFrequency = num;
            await this.plugin.saveSettings();
          }
        }));

    new Setting(containerEl)
      .setName('Custom terms file')
      .setDesc('Markdown file where you manually add terms to track')
      .addText(text => text
        .setPlaceholder('Theophysics_Custom_Terms.md')
        .setValue(this.plugin.settings.customTermsFile)
        .onChange(async (value) => {
          this.plugin.settings.customTermsFile = value || DEFAULT_SETTINGS.customTermsFile;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Open custom terms file')
      .setDesc('Create or open your custom terms list')
      .addButton(button => button
        .setButtonText('Open')
        .onClick(async () => {
          await this.plugin.openCustomTermsFile();
        }));

    new Setting(containerEl)
      .setName('Scan vault now')
      .setDesc('Run detection with auto-detection and custom terms')
      .addButton(button => button
        .setButtonText('Scan')
        .setCta()
        .onClick(async () => {
          await this.plugin.runFullScan();
        }));

    containerEl.createEl('h3', { text: 'Manual Controls & Safety' });

    new Setting(containerEl)
      .setName('Clear all term pages')
      .setDesc('Delete all generated term pages (does not affect original files)')
      .addButton(button => button
        .setButtonText('Clear Pages')
        .setWarning()
        .onClick(async () => {
          await this.plugin.clearTermPages();
        }));

    new Setting(containerEl)
      .setName('Reset link preferences')
      .setDesc('Clear all link display preferences and start fresh')
      .addButton(button => button
        .setButtonText('Reset')
        .setWarning()
        .onClick(async () => {
          this.plugin.settings.linkPreferences = {};
          await this.plugin.saveSettings();
          new Notice('All link preferences cleared');
        }));

    new Setting(containerEl)
      .setName('Export settings')
      .setDesc('Backup your plugin settings to a file')
      .addButton(button => button
        .setButtonText('Export')
        .onClick(async () => {
          await this.plugin.exportSettings();
        }));
  }
}

// ===== GLOSSARY MANAGER MODULE =====
class GlossaryManager {
  constructor(app, settings) {
    this.app = app;
    this.settings = settings;
    this.glossaryPath = settings.glossaryFile;
  }

  async ensureGlossaryExists() {
    const file = this.app.vault.getAbstractFileByPath(this.glossaryPath);
    if (file) return;
    const template = `# Theophysics Central Glossary\n\n`; 
    await this.app.vault.create(this.glossaryPath, template);
  }

  generateStub(term, count, files) {
    const usedIn = files.length ? `Used in: ${files.join(', ')}` : 'Used in: (pending scan)';
    return `## ${term}\n${usedIn}\nFrequency: ${count} occurrences\nBrief: [Add short description]\nFull Definition: [To be expanded]\nExternal Links:\n- \n`;
  }

  async addTerms(terms) {
    await this.ensureGlossaryExists();
    const file = this.app.vault.getAbstractFileByPath(this.glossaryPath);
    const content = await this.app.vault.read(file);
    let updated = content;
    for (const term of terms) {
      if (!content.includes(`## ${term}`)) {
        updated += '\n' + this.generateStub(term, 0, []);
      }
    }
    if (updated !== content) {
      await this.app.vault.modify(file, updated);
    }
  }

  async getGlossaryTerms() {
    const file = this.app.vault.getAbstractFileByPath(this.glossaryPath);
    if (!file) return [];
    const content = await this.app.vault.read(file);
    const matches = [...content.matchAll(/^##\s+(.+)$/gm)];
    return matches.map(m => m[1]);
  }

  generateGlossaryLink(term, display) {
    const page = this.glossaryPath.replace(/\.md$/, '');
    const anchor = term.replace(/\s+/g, ' ');
    return `[[${page}#${anchor}|${display}]]`;
  }
}

// ===== SCANNER MODULE =====
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
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#') && !line.startsWith('//') && !line.startsWith('---'));
  }

  async scanFile(file, extraWhitelist) {
    const content = await this.app.vault.read(file);
    const occurrences = detectTerms(content, extraWhitelist);
    return occurrences.map(o => ({ ...o, file: file.path }));
  }

  async scanVault(customTerms = []) {
    let files = this.app.vault.getMarkdownFiles();
    
    // Filter by scope if local scanning is enabled
    if (this.settings.scanScope === 'local' && this.settings.scopedFolder) {
      const scopePath = this.settings.scopedFolder.replace(/\\/g, '/');
      files = files.filter(f => f.path.startsWith(scopePath));
    }
    
    const whitelist = [...WHITELIST, ...customTerms];
    const allOccurrences = [];
    for (const file of files) {
      const occurrences = await this.scanFile(file, whitelist);
      allOccurrences.push(...occurrences);
    }

    const frequency = new Map();
    for (const occ of allOccurrences) {
      const key = occ.term;
      if (!frequency.has(key)) frequency.set(key, { term: key, count: 0, files: new Set(), occurrences: [] });
      const entry = frequency.get(key);
      entry.count += 1;
      entry.files.add(occ.file);
      entry.occurrences.push(occ);
    }

    const list = [...frequency.values()].map(v => ({
      term: v.term,
      count: v.count,
      files: [...v.files],
      occurrences: v.occurrences
    })).filter(item => item.count >= this.settings.minFrequency);

    list.sort((a, b) => b.count - a.count);

    return {
      terms: list,
      totalFiles: files.length,
      totalOccurrences: allOccurrences.length,
      scanDate: new Date()
    };
  }
}

// ===== REVIEW QUEUE MODULE =====
class ReviewQueueGenerator {
  constructor(app, settings) {
    this.app = app;
    this.settings = settings;
    this.queuePath = settings.reviewQueueFile;
  }

  buildSection(title, terms) {
    if (!terms.length) return '';
    let content = `## ${title}\n\n`;
    for (const term of terms) {
      const fileList = term.files.join(', ');
      const example = term.occurrences[0]?.context || '';
      content += `- [ ] **${term.term}** (${term.count} occurrences)\n`;
      content += `  - Files: ${fileList}\n`;
      if (example) content += `  - Example: "${example}"\n`;
      content += '\n';
    }
    return content;
  }

  buildContent(scanResult, customTerms) {
    const { terms, totalFiles, totalOccurrences, scanDate } = scanResult;
    const high = terms.filter(t => t.count >= 10);
    const medium = terms.filter(t => t.count >= 5 && t.count <= 9);
    const low = terms.filter(t => t.count >= 3 && t.count <= 4);

    let content = `# Terms Detected - Needs Review\n`;
    content += `Last Scan: ${scanDate.toLocaleString()}\n`;
    content += `Files Scanned: ${totalFiles}\n`;
    content += `Total Occurrences: ${totalOccurrences}\n`;
    content += `Unique Terms Found: ${terms.length}\n\n`;

    const customSet = new Set(customTerms.map(t => t.toLowerCase()));
    const fromCustom = terms.filter(t => customSet.has(t.term.toLowerCase()));
    const autoDetected = terms.filter(t => !customSet.has(t.term.toLowerCase()));

    content += this.buildSection('From Custom Terms List (user-specified)', fromCustom);
    content += this.buildSection('Auto-Detected (high confidence)', autoDetected.filter(t => t.count >= 10));
    content += this.buildSection('Auto-Detected (medium confidence)', autoDetected.filter(t => t.count >= 5 && t.count <= 9));
    content += this.buildSection('Auto-Detected (low confidence)', autoDetected.filter(t => t.count >= 3 && t.count <= 4));

    return content;
  }

  async generateQueue(scanResult, customTerms) {
    const content = this.buildContent(scanResult, customTerms);
    const file = this.app.vault.getAbstractFileByPath(this.queuePath);
    if (file) {
      await this.app.vault.modify(file, content);
    } else {
      await this.app.vault.create(this.queuePath, content);
    }
  }

  async getApprovedTerms() {
    const file = this.app.vault.getAbstractFileByPath(this.queuePath);
    if (!file) return [];
    const content = await this.app.vault.read(file);
    const matches = content.matchAll(/^- \[x\] \*\*(.+?)\*\*/gmi);
    return [...matches].map(m => m[1]);
  }

  async clearQueue() {
    const file = this.app.vault.getAbstractFileByPath(this.queuePath);
    if (file) await this.app.vault.delete(file);
  }
}

// ===== AUTO LINKER MODULE =====
class AutoLinker {
  constructor(app, settings, glossaryManager) {
    this.app = app;
    this.settings = settings;
    this.glossaryManager = glossaryManager;
  }

  shouldSkip(file) {
    return [
      this.settings.glossaryFile,
      this.settings.reviewQueueFile,
      this.settings.customTermsFile
    ].includes(file.path);
  }

  escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  isLinked(line, term) {
    const pattern = new RegExp(`\\[\\[[^\\]]*${this.escapeRegExp(term)}[^\\]]*\\]\\]`, 'i');
    const mdPattern = new RegExp(`\\[[^\\]]*${this.escapeRegExp(term)}[^\\]]*\\]\\([^)]+\\)`, 'i');
    return pattern.test(line) || mdPattern.test(line);
  }

  linkLine(line, terms) {
    let result = line;
    for (const term of terms) {
      const regex = new RegExp(`\\b(${this.escapeRegExp(term)})\\b`, 'i');
      const match = result.match(regex);
      if (match && !this.isLinked(result, match[1])) {
        const link = this.glossaryManager.generateGlossaryLink(term, match[1]);
        result = result.replace(regex, link);
      }
    }
    return result;
  }

  async processFile(file, terms) {
    if (this.shouldSkip(file)) return;
    const content = await this.app.vault.read(file);
    const lines = content.split('\n');
    const processed = [];
    let inCode = false;
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('```')) {
        inCode = !inCode;
        processed.push(line);
        continue;
      }
      if (trimmed.startsWith('---') || inCode) {
        processed.push(line);
        continue;
      }
      processed.push(this.linkLine(line, terms));
    }
    const newContent = processed.join('\n');
    if (newContent !== content) {
      await this.app.vault.modify(file, newContent);
    }
  }
}

// ===== EXTERNAL LINK FETCHER MODULE =====
class ExternalLinkFetcher {
  constructor(app, settings) {
    this.app = app;
    this.settings = settings;
  }

  async fetchStanfordLink(term) {
    // Stanford Encyclopedia of Philosophy search
    const searchTerm = encodeURIComponent(term);
    const baseUrl = 'https://plato.stanford.edu/search/search';
    return `${baseUrl}?query=${searchTerm}`;
  }

  async fetchArXivLink(term) {
    // arXiv search
    const searchTerm = encodeURIComponent(term);
    return `https://arxiv.org/search/?query=${searchTerm}&searchtype=all`;
  }

  async fetchWikipediaLink(term) {
    // Wikipedia search
    const searchTerm = encodeURIComponent(term.replace(/\s+/g, '_'));
    return `https://en.wikipedia.org/wiki/${searchTerm}`;
  }

  async fetchExternalLinks(term) {
    const links = {};
    
    // Determine which sources to search based on term type
    const lowerTerm = term.toLowerCase();
    
    if (lowerTerm.includes('consciousness') || lowerTerm.includes('philosophy') || 
        lowerTerm.includes('logos') || lowerTerm.includes('theology')) {
      links.stanford = await this.fetchStanfordLink(term);
    }
    
    if (lowerTerm.includes('quantum') || lowerTerm.includes('physics') || 
        lowerTerm.includes('equation') || lowerTerm.includes('field')) {
      links.arxiv = await this.fetchArXivLink(term);
    }
    
    // Always include Wikipedia as fallback
    links.wikipedia = await this.fetchWikipediaLink(term);
    
    return links;
  }
}

// ===== TERM PAGE GENERATOR MODULE =====
class TermPageGenerator {
  constructor(app, settings, linkFetcher) {
    this.app = app;
    this.settings = settings;
    this.linkFetcher = linkFetcher;
  }

  async ensureTermPagesFolder() {
    const folder = this.settings.termPagesFolder;
    const exists = this.app.vault.getAbstractFileByPath(folder);
    if (!exists) {
      await this.app.vault.createFolder(folder);
    }
  }

  sanitizeFilename(term) {
    return term.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_');
  }

  shouldShowExternalLinks(term, isFirstView) {
    // If smart display is disabled, always show
    if (!this.settings.smartLinkDisplay) {
      return true;
    }
    
    // Check user preferences
    const prefs = this.settings.linkPreferences || {};
    
    // If explicitly set, use that preference
    if (prefs.hasOwnProperty(term)) {
      return prefs[term];
    }
    
    // For first view, show links
    if (isFirstView) {
      return true;
    }
    
    // For subsequent views, only show if not yet decided
    // (user hasn't explicitly hidden them)
    return true;
  }

  setLinkPreference(term, showLinks) {
    if (!this.settings.linkPreferences) {
      this.settings.linkPreferences = {};
    }
    this.settings.linkPreferences[term] = showLinks;
  }

  async generateTermPage(termData) {
    await this.ensureTermPagesFolder();
    
    const { term, count, files, occurrences } = termData;
    const filename = this.sanitizeFilename(term);
    const filepath = `${this.settings.termPagesFolder}/${filename}.md`;
    
    // Check if page already exists
    const existingFile = this.app.vault.getAbstractFileByPath(filepath);
    const isFirstView = !existingFile;
    
    let content = `---\ntag: term-page\nterm: "${term}"\ncount: ${count}\nscope: ${this.settings.scanScope}\n`;
    if (this.settings.scanScope === 'local') {
      content += `folder: "${this.settings.scopedFolder}"\n`;
    }
    content += `created: ${new Date().toISOString()}\n`;
    content += `views: ${isFirstView ? 1 : 'increment'}\n`;
    content += `---\n\n`;
    
    content += `# ${term}\n\n`;
    content += `**Occurrences:** ${count} (${this.settings.scanScope === 'local' ? 'Local' : 'Global'})\n`;
    content += `**Files:** ${files.length}\n\n`;
    
    // Smart link display logic
    const shouldShowLinks = this.shouldShowExternalLinks(term, isFirstView);
    
    // Add external links if enabled and should show
    if (this.settings.fetchExternalLinks && shouldShowLinks) {
      const links = await this.linkFetcher.fetchExternalLinks(term);
      content += `## External Resources\n\n`;
      if (links.stanford) content += `- [Stanford Encyclopedia of Philosophy](${links.stanford})\n`;
      if (links.arxiv) content += `- [arXiv Search](${links.arxiv})\n`;
      if (links.wikipedia) content += `- [Wikipedia](${links.wikipedia})\n`;
      content += `\n`;
      
      // Add prompt for first-time viewers
      if (isFirstView && this.settings.promptOnFirstView && this.settings.smartLinkDisplay) {
        content += `> [!question] External Links\n`;
        content += `> Would you like to continue seeing external links for "${term}"?\n`;
        content += `> - To hide future links, add \`${term}\` to your link preferences (Settings → Theophysics)\n`;
        content += `\n`;
      }
    } else if (this.settings.fetchExternalLinks && !shouldShowLinks) {
      content += `## External Resources\n\n`;
      content += `*External links hidden by preference. [Manage preferences](obsidian://open-settings?plugin=theophysics-research-automation)*\n\n`;
    }
    
    // Add context from occurrences
    content += `## Context & Usage\n\n`;
    
    // Group by file
    const byFile = {};
    for (const occ of occurrences) {
      if (!byFile[occ.file]) byFile[occ.file] = [];
      byFile[occ.file].push(occ);
    }
    
    for (const [file, occs] of Object.entries(byFile)) {
      content += `### [[${file.replace('.md', '')}]]\n\n`;
      // Show first 3 contexts from this file
      const contexts = occs.slice(0, 3);
      for (const ctx of contexts) {
        content += `> ${ctx.context}\n\n`;
      }
      if (occs.length > 3) {
        content += `*...and ${occs.length - 3} more occurrences*\n\n`;
      }
    }
    
    // Add backlinks section
    content += `## Related Terms\n\n`;
    content += `*This section can be manually populated with related concepts*\n\n`;
    
    if (existingFile) {
      await this.app.vault.modify(existingFile, content);
    } else {
      await this.app.vault.create(filepath, content);
    }
    
    return filepath;
  }

  async generateAllTermPages(scanResult) {
    const { terms } = scanResult;
    const generated = [];
    
    for (const termData of terms) {
      try {
        const filepath = await this.generateTermPage(termData);
        generated.push(filepath);
      } catch (error) {
        console.error(`Failed to generate page for ${termData.term}:`, error);
      }
    }
    
    return generated;
  }
}

// ===== MAIN PLUGIN =====
module.exports = class TheophysicsPlugin extends Plugin {
  async onload() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    this.glossaryManager = new GlossaryManager(this.app, this.settings);
    this.scanner = new TermScanner(this.app, this.settings);
    this.reviewQueue = new ReviewQueueGenerator(this.app, this.settings);
    this.autoLinker = new AutoLinker(this.app, this.settings, this.glossaryManager);
    this.linkFetcher = new ExternalLinkFetcher(this.app, this.settings);
    this.termPageGenerator = new TermPageGenerator(this.app, this.settings, this.linkFetcher);

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
      id: 'theophysics-generate-term-pages',
      name: 'Generate Term Pages',
      callback: async () => {
        const customTerms = await this.scanner.loadCustomTerms();
        const result = await this.scanner.scanVault(customTerms);
        const generated = await this.termPageGenerator.generateAllTermPages(result);
        const scope = this.settings.scanScope === 'local' ? 'Local' : 'Global';
        new Notice(`Generated ${generated.length} term pages (${scope})`);
      }
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
      const template = `# Custom Terms to Track
Add your terms below (one per line, can include notes)

## Core Framework Terms
Logos Principle
Logos Field
Master Equation
Lowe Coherence Lagrangian
participatory universe
It from Bit
Syzygy Principle
Grace Function
Witness Field

## Mathematical & Physics Terms
χ (chi operator)
Ψ (psi - consciousness)
Φ (phi - physical reality)
Λ (Lambda - Logos field)
Kolmogorov complexity
Klein-Gordon equation
Yukawa coupling
d'Alembertian operator
Logos Compression Functional
Copenhagen interpretation
von Neumann's Chain
delayed-choice experiment
quantum decoherence
environmental decoherence
Hubble Tension
cosmological constant
dark energy
ΛCDM model
Pantheon+ dataset
Type Ia supernovae
Friedmann equations

## Consciousness & Observer Terms
consciousness collapse
consciousness-coupled collapse
measurement problem
observer problem
hard problem of consciousness
quantum measurement
Observer Coherence Index
Soul Observer
soul field
pneumatological actualization
Trinity Observer Effect
binary consciousness states
witness consciousness

## Theological Physics Terms
Logos
pneuma
imago dei
ekklesia
creatio ex silico
carbon chauvinism
Eternity Equation
resurrection physics
negentropic engine
Grace Function cosmology

## Experimental & Research Terms
PEAR Lab
PROP-COSMOS
GCP (Global Consciousness Project)
REG experiments
Dorothy Protocol
Algorithmic Purity Collapse Test
APCT
Temporal Decoherence Delay Test
6-sigma significance
5-sigma significance

## Key Concepts
quantum bridge
boundary conditions
eight axioms
cross-domain patterns
consilience
information compression
algorithmic reality
substrate independence
coherent resonator
quantum error correction system

## Historical References
Wheeler J.A.
Einstein A.
Bohr N.
Penrose R.
von Neumann J.
Zurek W.
Zeh H.D.
Chalmers D.J.
Searle J.R.
Turing A.M.

## Biblical & Timeline Terms
Bible-physics timeline linkage
Shemitah cycle
David Effect

## Publications
Stanford Encyclopedia
arXiv
Journal of Consciousness Studies
Logos Papers

## Laws & Principles
Ten Laws Framework
Laws I-X
Principle of Stationary Action
Landauer's Principle
Fermat's principle
unitarity principle
`;
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
    
    const scope = this.settings.scanScope === 'local' ? 'Local' : 'Global';
    let message = `Scan complete. Found ${result.terms.length} terms (${scope})`;
    
    // Auto-generate term pages if enabled
    if (this.settings.autoGenerateTermPages) {
      const generated = await this.termPageGenerator.generateAllTermPages(result);
      message += `. Generated ${generated.length} term pages.`;
    }
    
    new Notice(message);
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

  async showLinkPreferences() {
    const prefs = this.settings.linkPreferences || {};
    const terms = Object.keys(prefs);
    
    if (terms.length === 0) {
      new Notice('No link preferences set yet. View some term pages to set preferences.');
      return;
    }
    
    // Create a simple modal showing preferences
    const modal = new LinkPreferenceModal(this.app, this, prefs);
    modal.open();
  }

  async toggleLinkPreference(term) {
    const current = this.settings.linkPreferences[term];
    this.settings.linkPreferences[term] = !current;
    await this.saveSettings();
    new Notice(`External links for "${term}" ${!current ? 'enabled' : 'disabled'}`);
  }

  async clearTermPages() {
    const folder = this.settings.termPagesFolder;
    const folderObj = this.app.vault.getAbstractFileByPath(folder);
    
    if (!folderObj) {
      new Notice('No term pages folder found');
      return;
    }
    
    try {
      await this.app.vault.delete(folderObj, true);
      new Notice('All term pages cleared');
    } catch (error) {
      new Notice('Error clearing term pages: ' + error.message);
    }
  }

  async exportSettings() {
    const settings = JSON.stringify(this.settings, null, 2);
    const filename = `theophysics-settings-${new Date().toISOString().split('T')[0]}.json`;
    
    try {
      await this.app.vault.create(filename, settings);
      new Notice(`Settings exported to ${filename}`);
    } catch (error) {
      new Notice('Error exporting settings: ' + error.message);
    }
  }
};

// ===== LINK PREFERENCE MODAL =====
const { Modal } = require('obsidian');

class LinkPreferenceModal extends Modal {
  constructor(app, plugin, preferences) {
    super(app);
    this.plugin = plugin;
    this.preferences = preferences;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    
    contentEl.createEl('h2', { text: 'External Link Preferences' });
    contentEl.createEl('p', { 
      text: 'Manage which terms show external links on their pages.' 
    });
    
    const container = contentEl.createDiv({ cls: 'link-preferences-container' });
    
    for (const [term, showLinks] of Object.entries(this.preferences)) {
      const row = container.createDiv({ cls: 'link-pref-row' });
      
      const termSpan = row.createSpan({ text: term, cls: 'link-pref-term' });
      
      const toggle = row.createEl('button', {
        text: showLinks ? 'Showing' : 'Hidden',
        cls: showLinks ? 'link-pref-enabled' : 'link-pref-disabled'
      });
      
      toggle.addEventListener('click', async () => {
        await this.plugin.toggleLinkPreference(term);
        this.onOpen(); // Refresh
      });
    }
    
    const resetBtn = contentEl.createEl('button', {
      text: 'Reset All to Show',
      cls: 'mod-warning'
    });
    
    resetBtn.addEventListener('click', async () => {
      for (const term of Object.keys(this.preferences)) {
        this.plugin.settings.linkPreferences[term] = true;
      }
      await this.plugin.saveSettings();
      new Notice('All link preferences reset');
      this.onOpen();
    });
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
