/*
 * THEOPHYSICS RESEARCH AUTOMATION - COMPLETE BUNDLE
 * Combines: Research Engine, Math Translator, Theory Scanner, and Settings
 */

const { Plugin, Notice, TFile, PluginSettingTab, Setting, MarkdownView } = require('obsidian');

// =============================================================================
// 1. DETECTOR MODULE (Regex Patterns)
// =============================================================================
const DETECTION_PATTERNS = {
  equations: /([A-Z][\w])\s*=\s*/g,
  capitalizedPhrases: /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g,
  acronyms: /\b([A-Z]{2,})\b/g,
  biblical: /\b([A-Z][a-z]+\s+\d+:\d+(?:-\d+)?)\b/g,
  technical: /\b(\w+\s+(?:theorem|law|principle|equation|framework|field|coherence))\b/gi
};

const WHITELIST = [
  'Master Equation', 'Lowe Coherence Lagrangian', 'Ten Laws Framework', 'PEAR Lab',
  'General Relativity', 'Quantum Mechanics', 'Logos field', 'consciousness collapse'
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
// 2. MATH LAYER MODULE
// =============================================================================
const GREEK_TRANSLATIONS = {
  'α': { basic: 'alpha', medium: 'alpha', academic: 'alpha, fine structure constant' },
  'β': { basic: 'beta', medium: 'beta', academic: 'beta parameter' },
  'γ': { basic: 'gamma', medium: 'gamma, decay rate', academic: 'gamma, decoherence coefficient' },
  'δ': { basic: 'delta', medium: 'delta', academic: 'delta, variation' },
  'ε': { basic: 'epsilon', medium: 'epsilon', academic: 'epsilon, regularization constant' },
  'θ': { basic: 'theta', medium: 'theta', academic: 'theta parameter' },
  'κ': { basic: 'kappa', medium: 'kappa', academic: 'kappa, gravitational coupling' },
  'λ': { basic: 'lambda', medium: 'lambda', academic: 'lambda, coupling constant' },
  'μ': { basic: 'mu', medium: 'mu', academic: 'mu index' },
  'ν': { basic: 'nu', medium: 'nu', academic: 'nu index' },
  'π': { basic: 'pi', medium: 'pi', academic: 'pi, circle constant' },
  'ρ': { basic: 'rho', medium: 'rho, density', academic: 'rho, density field' },
  'σ': { basic: 'sigma', medium: 'sigma', academic: 'sigma, standard deviation' },
  'τ': { basic: 'tau', medium: 'tau', academic: 'tau, proper time' },
  'φ': { basic: 'phi', medium: 'phi', academic: 'phi, scalar field' },
  'χ': { basic: 'chi, the Logos Field', medium: 'chi, the information substrate', academic: 'chi, the scalar Logos field' },
  'ψ': { basic: 'psi, the consciousness wave', medium: 'psi', academic: 'psi, wavefunction' },
  'ω': { basic: 'omega', medium: 'omega', academic: 'omega, angular frequency' },
  'Γ': { basic: 'Gamma', medium: 'Gamma', academic: 'capital Gamma, decay rate' },
  'Δ': { basic: 'Delta', medium: 'Delta', academic: 'capital Delta, difference' },
  'Θ': { basic: 'Theta, the threshold', medium: 'Theta', academic: 'capital Theta, actualization threshold' },
  'Λ': { basic: 'Lambda, cosmological constant', medium: 'Lambda', academic: 'capital Lambda, vacuum energy' },
  'Σ': { basic: 'Sigma, the sum', medium: 'Sigma', academic: 'capital Sigma, summation' },
  'Φ': { basic: 'Phi, the field', medium: 'Phi', academic: 'capital Phi, scalar field' },
  'Ψ': { basic: 'Psi, the soul field', medium: 'Psi', academic: 'capital Psi, quantum state' },
  'Ω': { basic: 'Omega, all creation', medium: 'Omega', academic: 'capital Omega, spacetime domain' }
};

const OPERATOR_TRANSLATIONS = {
  '∇': { basic: 'the gradient', medium: 'nabla', academic: 'covariant derivative' },
  '∇²': { basic: 'the curvature', medium: 'del squared', academic: 'Laplacian operator' },
  '∂': { basic: 'the change in', medium: 'partial', academic: 'partial derivative' },
  '∫': { basic: 'the integral of', medium: 'integral', academic: 'integral operator' },
  '∑': { basic: 'the sum of', medium: 'summation', academic: 'summation' },
  '√': { basic: 'square root of', medium: 'root', academic: 'radical' },
  '∞': { basic: 'infinity', medium: 'infinity', academic: 'infinite limit' }
};

const CONSTANT_TRANSLATIONS = {
  'ℏ': { basic: "Planck's constant", medium: 'h-bar', academic: 'reduced Planck constant' },
  'ℓ_P': { basic: 'the Planck length', medium: 'ell sub P', academic: 'Planck length scale' },
  'k_B': { basic: "Boltzmann's constant", medium: 'k sub B', academic: 'Boltzmann constant' },
  'G_N': { basic: "Newton's constant", medium: 'G sub N', academic: 'Gravitational constant' },
  'c': { basic: 'speed of light', medium: 'c', academic: 'c, light speed constant' }
};

class MathTranslatorCommand {
  constructor(app, settings) {
    this.app = app;
    this.settings = settings;
  }

  translateSelection(text, level = 'basic') {
    if (!text || text.trim().length === 0) return text;
    let translated = text;
    translated = this.translateInlineLaTeX(translated, level);
    translated = this.translateDisplayLaTeX(translated, level);
    translated = this.translateGreekSymbols(translated, level);
    translated = this.translateOperators(translated, level);
    translated = this.translateCommonPatterns(translated, level);
    return translated;
  }

  translateInlineLaTeX(text, level) {
    return text.replace(/\$(?!\$)([^$]+)\$/g, (match, latex) => this.translateLaTeXExpression(latex.trim(), level));
  }

  translateDisplayLaTeX(text, level) {
    return text.replace(/\$\$([^$]+)\$\$/g, (match, latex) => `\n${this.translateLaTeXExpression(latex.trim(), level)}\n`);
  }

  translateLaTeXExpression(latex, level) {
    let result = latex;
    const latexTranslations = {
      '\\chi': this.getTranslation('χ', level, GREEK_TRANSLATIONS),
      '\\psi': this.getTranslation('ψ', level, GREEK_TRANSLATIONS),
      '\\phi': this.getTranslation('φ', level, GREEK_TRANSLATIONS),
      '\\Phi': this.getTranslation('Φ', level, GREEK_TRANSLATIONS),
      '\\lambda': this.getTranslation('λ', level, GREEK_TRANSLATIONS),
      '\\Lambda': this.getTranslation('Λ', level, GREEK_TRANSLATIONS),
      '\\kappa': this.getTranslation('κ', level, GREEK_TRANSLATIONS),
      '\\epsilon': this.getTranslation('ε', level, GREEK_TRANSLATIONS),
      '\\Gamma': this.getTranslation('Γ', level, GREEK_TRANSLATIONS),
      '\\Omega': this.getTranslation('Ω', level, GREEK_TRANSLATIONS),
      '\\Theta': this.getTranslation('Θ', level, GREEK_TRANSLATIONS),
      '\\rho': this.getTranslation('ρ', level, GREEK_TRANSLATIONS),
      '\\sigma': this.getTranslation('σ', level, GREEK_TRANSLATIONS),
      '\\Sigma': this.getTranslation('Σ', level, GREEK_TRANSLATIONS),
      '\\alpha': this.getTranslation('α', level, GREEK_TRANSLATIONS),
      '\\gamma': this.getTranslation('γ', level, GREEK_TRANSLATIONS),
      '\\delta': this.getTranslation('δ', level, GREEK_TRANSLATIONS),
      '\\mu': this.getTranslation('μ', level, GREEK_TRANSLATIONS),
      '\\nu': this.getTranslation('ν', level, GREEK_TRANSLATIONS),
      '\\omega': this.getTranslation('ω', level, GREEK_TRANSLATIONS),
      '\\Psi': this.getTranslation('Ψ', level, GREEK_TRANSLATIONS),
      '\\nabla': this.getTranslation('∇', level, OPERATOR_TRANSLATIONS),
      '\\partial': this.getTranslation('∂', level, OPERATOR_TRANSLATIONS),
      '\\int': this.getTranslation('∫', level, OPERATOR_TRANSLATIONS),
      '\\sum': this.getTranslation('∑', level, OPERATOR_TRANSLATIONS),
      '\\sqrt': 'square root of', '\\pm': 'plus or minus', '\\cdot': 'times',
      '\\neq': 'not equal to', '\\approx': 'approximately', '\\infty': 'infinity',
      '\\hbar': this.getTranslation('ℏ', level, CONSTANT_TRANSLATIONS),
      'c': 'the speed of light', 'G_N': "Newton's constant", 'k_B': "Boltzmann's constant",
      '\\frac': ' over ', '^': ' to the power of ', '_': ' sub ', '=': ' equals ',
      '\\langle': 'the average value of', '\\rangle': '', '\\hat': ' operator'
    };

    for (const [l, t] of Object.entries(latexTranslations)) {
      const regex = new RegExp(l.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      result = result.replace(regex, t);
    }
    return result.replace(/\s+/g, ' ').trim();
  }

  translateGreekSymbols(text, level) {
    let result = text;
    for (const [symbol, trans] of Object.entries(GREEK_TRANSLATIONS)) {
      const regex = new RegExp(symbol, 'g');
      result = result.replace(regex, trans[level] || trans.basic);
    }
    return result;
  }

  translateOperators(text, level) {
    let result = text;
    for (const [symbol, trans] of Object.entries(OPERATOR_TRANSLATIONS)) {
      const regex = new RegExp(symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      result = result.replace(regex, ` ${trans[level] || trans.basic} `);
    }
    return result.replace(/\s+/g, ' ').trim();
  }

  translateCommonPatterns(text, level) {
    let result = text;
    result = result.replace(/G_N/g, "Newton's constant");
    result = result.replace(/k_B/g, "Boltzmann's constant");
    result = result.replace(/m_e/g, "electron mass");
    result = result.replace(/m_S/g, "soul field mass");
    result = result.replace(/\ell_P/g, "Planck length");
    result = result.replace(/\^2/g, " squared");
    result = result.replace(/\^3/g, " cubed");
    return result;
  }

  getTranslation(symbol, level, table) {
    const t = table[symbol];
    return t ? (t[level] || t.basic) : symbol;
  }

  async executeCommand(level = 'basic') {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!activeView) {
      new Notice('No active markdown file');
      return;
    }
    const editor = activeView.editor;
    const selection = editor.getSelection();
    if (!selection || selection.trim().length === 0) {
      new Notice('Please select text containing math symbols to translate');
      return;
    }
    const translated = this.translateSelection(selection, level);
    await navigator.clipboard.writeText(translated);
    new Notice(`Math translation (${level}) copied to clipboard!`);
  }
}

// =============================================================================
// 3. HELPER CLASSES
// =============================================================================

class GlossaryManager {
  constructor(app, settings) {
    this.app = app;
    this.settings = settings;
    this.glossaryPath = settings.glossaryFile;
  }

  async ensureGlossaryExists() {
    const file = this.app.vault.getAbstractFileByPath(this.glossaryPath);
    if (file) return;
    await this.app.vault.create(this.glossaryPath, `# Theophysics Central Glossary\n\n`);
  }

  async addTerms(terms) {
    await this.ensureGlossaryExists();
    const file = this.app.vault.getAbstractFileByPath(this.glossaryPath);
    const content = await this.app.vault.read(file);
    let updated = content;
    for (const term of terms) {
      if (!content.includes(`## ${term}`)) {
        updated += `\n## ${term}\nFrequency: (New)\nBrief: [Add description]\n\n`;
      }
    }
    if (updated !== content) await this.app.vault.modify(file, updated);
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
    return `[[${page}#${term}|${display}]]`;
  }
}

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
      .filter(line => line && !line.startsWith('#') && !line.startsWith('//'));
  }

  async scanVault(customTerms = []) {
    let files = this.app.vault.getMarkdownFiles();
    
    if (this.settings.scanScope === 'local' && this.settings.scopedFolder) {
      const scopePath = this.settings.scopedFolder.replace(/\\/g, '/');
      files = files.filter(f => f.path.startsWith(scopePath));
    }
    
    const whitelist = [...WHITELIST, ...customTerms];
    const allOccurrences = [];
    
    for (const file of files) {
      if (this.settings.excludedFolders.some(ex => file.path.includes(ex))) continue;
      
      const content = await this.app.vault.read(file);
      let occurrences = [];
      if (!this.settings.useCustomTermsOnly) occurrences = detectTerms(content, whitelist);
      
      customTerms.forEach(term => {
        if (content.includes(term)) occurrences.push({term, file: file.path});
      });
      
      allOccurrences.push(...occurrences.map(o => ({...o, file: file.path})));
    }

    const frequency = new Map();
    for (const occ of allOccurrences) {
      const key = occ.term;
      if (!frequency.has(key)) frequency.set(key, { term: key, count: 0, files: new Set() });
      const entry = frequency.get(key);
      entry.count += 1;
      entry.files.add(occ.file);
    }

    const list = [...frequency.values()]
      .filter(item => item.count >= this.settings.minFrequency)
      .sort((a, b) => b.count - a.count);

    return { terms: list };
  }
}

class ReviewQueueGenerator {
  constructor(app, settings) {
    this.app = app;
    this.settings = settings;
    this.queuePath = settings.reviewQueueFile;
  }

  async generateQueue(scanResult, customTerms) {
    const { terms } = scanResult;
    let content = `# Terms Detected\n\n`;
    const customSet = new Set(customTerms.map(t => t.toLowerCase()));
    
    content += `## From Custom List\n`;
    terms.filter(t => customSet.has(t.term.toLowerCase())).forEach(t => {
      content += `- [ ] **${t.term}** (${t.count})\n`;
    });

    content += `\n## Auto-Detected\n`;
    terms.filter(t => !customSet.has(t.term.toLowerCase())).forEach(t => {
      content += `- [ ] **${t.term}** (${t.count})\n`;
    });

    const file = this.app.vault.getAbstractFileByPath(this.queuePath);
    if (file) await this.app.vault.modify(file, content);
    else await this.app.vault.create(this.queuePath, content);
  }

  async getApprovedTerms() {
    const file = this.app.vault.getAbstractFileByPath(this.queuePath);
    if (!file) return [];
    const content = await this.app.vault.read(file);
    const matches = content.matchAll(/^- \[x\] \*\*(.+?)\*\*/gmi);
    return [...matches].map(m => m[1]);
  }
}

class AutoLinker {
  constructor(app, settings, glossaryManager) {
    this.app = app;
    this.settings = settings;
    this.glossaryManager = glossaryManager;
  }

  async processFile(file, terms) {
    if ([this.settings.glossaryFile, this.settings.reviewQueueFile, this.settings.customTermsFile].includes(file.path)) return;
    const content = await this.app.vault.read(file);
    const lines = content.split('\n');
    const processed = [];
    
    for (const line of lines) {
      if (line.trim().startsWith('```') || line.trim().startsWith('---')) {
        processed.push(line);
        continue;
      }
      let result = line;
      for (const term of terms) {
        const regex = new RegExp(`\\b(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, 'i');
        const match = result.match(regex);
        if (match && !result.includes(`[[`)) {
          const link = this.glossaryManager.generateGlossaryLink(term, match[1]);
          result = result.replace(regex, link);
        }
      }
      processed.push(result);
    }
    const newContent = processed.join('\n');
    if (newContent !== content) await this.app.vault.modify(file, newContent);
  }
}

// =============================================================================
// 4. SETTINGS & MAIN CLASS
// =============================================================================

const DEFAULT_SETTINGS = {
  // General Settings
  autoLinking: true,
  linkToGlossary: true,
  linkToExternal: false,
  minFrequency: 3,
  scanScope: 'global',
  scopedFolder: '',
  excludedFolders: ['Assets', 'assets', '_Assets', '.obsidian', 'audio', 'Audio'],
  
  // Detection Layers
  useAutoDetection: true,
  useCustomTermsOnly: false,
  detectScientific: true,
  detectBiblical: true,
  detectCitations: true,
  detectEquations: true,
  detectPersons: false,
  
  // Math Layer Settings
  mathLayerEnabled: true,
  detectMathExpressions: true,
  detectGreekSymbols: true,
  detectMathOperators: true,
  mathContextWindow: 50,
  
  // Combined Theories Layer Settings
  theoriesLayerEnabled: true,
  evaluateTheoryCombinations: true,
  minTheoryConfidence: 0.7,
  maxCombinationDistance: 100,
  requireContextualEvidence: true,
  
  // Analytics & Output
  autoGenerateStubs: true,
  autoGenerateTermPages: true,
  analyticsLocation: 'local',
  analyticsFolder: '_Data_Analytics',
  globalAnalyticsFolder: '_Data_Analytics_Global',
  termPagesFolder: '_Term_Pages',
  
  // External Links
  fetchExternalLinks: true,
  smartLinkDisplay: true,
  promptOnFirstView: true,
  linkPreferences: {},
  
  // Files
  customTerms: [],
  customTermsFile: 'Theophysics_Custom_Terms.md',
  glossaryFile: 'Theophysics_Glossary.md',
  reviewQueueFile: '_term_review_queue.md',
  
  // Advanced
  flagUndefined: true,
  showUsageCount: true,
  postgresSync: false,
  whitelist: [],
  blacklist: [],
  trackKeywords: true,
  trackTags: true,
  minTagFrequency: 2,
  
  // AI Integration
  aiEnabled: false,
  aiConfidence: 0.7,
  aiAutoUpdate: false
};

class TheophysicsSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
    this.activeTab = 'general';
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl('h1', { text: 'Theophysics Research Automation' });

    // Create tab navigation
    const tabNav = containerEl.createDiv({ cls: 'theophysics-tab-nav' });
    
    const tabs = [
      { id: 'general', name: '⚙️ General' },
      { id: 'math', name: '🔣 Math Translation' },
      { id: 'theory', name: '📚 Theory Integration' },
      { id: 'analytics', name: '📊 Analytics' },
      { id: 'ai', name: '🤖 AI Integration' },
      { id: 'advanced', name: '🔧 Advanced' }
    ];

    tabs.forEach(tab => {
      const tabButton = tabNav.createEl('button', {
        text: tab.name,
        cls: this.activeTab === tab.id ? 'theophysics-tab-active' : 'theophysics-tab'
      });
      tabButton.addEventListener('click', () => {
        this.activeTab = tab.id;
        this.display();
      });
    });

    // Create tab content container
    const tabContent = containerEl.createDiv({ cls: 'theophysics-tab-content' });

    // Display active tab content
    switch (this.activeTab) {
      case 'general':
        this.displayGeneralTab(tabContent);
        break;
      case 'math':
        this.displayMathTab(tabContent);
        break;
      case 'theory':
        this.displayTheoryTab(tabContent);
        break;
      case 'analytics':
        this.displayAnalyticsTab(tabContent);
        break;
      case 'ai':
        this.displayAITab(tabContent);
        break;
      case 'advanced':
        this.displayAdvancedTab(tabContent);
        break;
    }
  }

  displayGeneralTab(containerEl) {
    containerEl.createEl('h2', { text: 'General Settings' });
    
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
            this.plugin.settings.scopedFolder = value.trim().replace(/^[\/\\]+|[\/\\]+$/g, '').replace(/\\/g, '/');
            await this.plugin.saveSettings();
          }));
    }

    new Setting(containerEl)
      .setName('Minimum frequency')
      .setDesc('Only include terms that appear at least this many times')
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

    containerEl.createEl('h2', { text: 'Actions' });
    
    new Setting(containerEl)
      .setName('Scan vault now')
      .setDesc('Run full scan with all enabled detection layers')
      .addButton(button => button
        .setButtonText('Scan')
        .setCta()
        .onClick(async () => {
          await this.plugin.runFullScan();
        }));
  }

  displayMathTab(containerEl) {
    containerEl.createEl('h2', { text: 'Math Translation' });

    containerEl.createEl('p', {
      text: 'Track mathematical symbols and equations across your vault.',
      cls: 'setting-item-description'
    });

    new Setting(containerEl)
      .setName('Enable math layer')
      .setDesc('Enable mathematical symbol detection and translation')
      .addToggle(t => t
        .setValue(this.plugin.settings.mathLayerEnabled)
        .onChange(async v => {
          this.plugin.settings.mathLayerEnabled = v;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Math Translation Dashboard')
      .setDesc('Generate comprehensive analysis of mathematical symbols and equations')
      .addButton(button => button
        .setButtonText('Generate Dashboard')
        .setCta()
        .onClick(async () => {
          await this.plugin.generateMathDashboard();
        }));
  }

  displayTheoryTab(containerEl) {
    containerEl.createEl('h2', { text: 'Theory Integration' });

    containerEl.createEl('p', {
      text: 'Track references to 80+ frameworks across Physics, Theology, Mathematics, and Consciousness.',
      cls: 'setting-item-description'
    });

    new Setting(containerEl)
      .setName('Enable theories layer')
      .setDesc('Enable theory integration tracking')
      .addToggle(t => t
        .setValue(this.plugin.settings.theoriesLayerEnabled)
        .onChange(async v => {
          this.plugin.settings.theoriesLayerEnabled = v;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Theory Integration Dashboard')
      .setDesc('Track framework references and integration metrics')
      .addButton(button => button
        .setButtonText('Generate Dashboard')
        .setCta()
        .onClick(async () => {
          await this.plugin.generateTheoryDashboard();
        }));
  }

  displayAnalyticsTab(containerEl) {
    containerEl.createEl('h2', { text: 'Data Analytics & Keywords' });

    new Setting(containerEl)
      .setName('Analytics folder')
      .setDesc('Folder where all dashboards will be saved (auto-created if missing)')
      .addText(text => text
        .setPlaceholder('Data Analytics')
        .setValue(this.plugin.settings.analyticsFolder)
        .onChange(async (value) => {
          this.plugin.settings.analyticsFolder = value || DEFAULT_SETTINGS.analyticsFolder;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Track keywords')
      .setDesc('Enable keyword frequency tracking across vault')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.trackKeywords)
        .onChange(async (value) => {
          this.plugin.settings.trackKeywords = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Track tags')
      .setDesc('Enable tag analytics and frequency tracking')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.trackTags)
        .onChange(async (value) => {
          this.plugin.settings.trackTags = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Keyword & Tag Analytics Dashboard')
      .setDesc('Generate comprehensive tag and keyword frequency analysis')
      .addButton(button => button
        .setButtonText('Generate Dashboard')
        .setCta()
        .onClick(async () => {
          await this.plugin.generateKeywordDashboard();
        }));
  }

  displayAITab(containerEl) {
    containerEl.createEl('h2', { text: 'AI Integration Layer' });

    containerEl.createEl('p', {
      text: 'Smart assistant that reads your papers and automatically finds missing symbols, theories, and keywords to enhance your dashboards.',
      cls: 'setting-item-description'
    });

    new Setting(containerEl)
      .setName('Enable AI integration')
      .setDesc('Allow AI to analyze your vault and suggest improvements to tracking lists')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.aiEnabled || false)
        .onChange(async (value) => {
          this.plugin.settings.aiEnabled = value;
          await this.plugin.saveSettings();
          this.display();
        }));

    if (this.plugin.settings.aiEnabled) {
      containerEl.createEl('h3', { text: '🔍 AI Analysis Actions' });

      new Setting(containerEl)
        .setName('Analyze current file')
        .setDesc('AI scans current file for missing symbols, theories, and keywords')
        .addButton(button => button
          .setButtonText('Analyze File')
          .setCta()
          .onClick(async () => {
            const view = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
            if (view && view.file) {
              await this.plugin.aiAnalyzeFile(view.file);
            } else {
              new Notice('No file open');
            }
          }));

      new Setting(containerEl)
        .setName('Analyze entire vault')
        .setDesc('AI scans all files and generates comprehensive enhancement report')
        .addButton(button => button
          .setButtonText('Analyze Vault')
          .setCta()
          .onClick(async () => {
            await this.plugin.aiAnalyzeVault();
          }));
    }
  }

  displayAdvancedTab(containerEl) {
    containerEl.createEl('h2', { text: 'Advanced Settings' });

    new Setting(containerEl)
      .setName('Glossary file')
      .setDesc('Main glossary file for term definitions')
      .addText(text => text
        .setPlaceholder('Theophysics_Glossary.md')
        .setValue(this.plugin.settings.glossaryFile)
        .onChange(async (value) => {
          this.plugin.settings.glossaryFile = value || DEFAULT_SETTINGS.glossaryFile;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Review queue file')
      .setDesc('File where term review queue is generated')
      .addText(text => text
        .setPlaceholder('_term_review_queue.md')
        .setValue(this.plugin.settings.reviewQueueFile)
        .onChange(async (value) => {
          this.plugin.settings.reviewQueueFile = value || DEFAULT_SETTINGS.reviewQueueFile;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Excluded folders')
      .setDesc('Comma-separated list of folders to exclude from scanning')
      .addTextArea(text => text
        .setPlaceholder('Assets, audio, .obsidian')
        .setValue(this.plugin.settings.excludedFolders.join(', '))
        .onChange(async (value) => {
          this.plugin.settings.excludedFolders = value.split(',').map(f => f.trim()).filter(f => f);
          await this.plugin.saveSettings();
        }));
  }
}

class TheophysicsPlugin extends Plugin {
  async onload() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    this.glossaryManager = new GlossaryManager(this.app, this.settings);
    this.scanner = new TermScanner(this.app, this.settings);
    this.reviewQueue = new ReviewQueueGenerator(this.app, this.settings);
    this.autoLinker = new AutoLinker(this.app, this.settings, this.glossaryManager);
    this.mathTranslator = new MathTranslatorCommand(this.app, this.settings);

    this.addSettingTab(new TheophysicsSettingTab(this.app, this));

    // Event: Auto-link on file modification
    this.registerEvent(this.app.vault.on('modify', async (file) => {
      if (!this.settings.autoLinking || !(file instanceof TFile)) return;
      const approved = await this.glossaryManager.getGlossaryTerms();
      const custom = await this.scanner.loadCustomTerms();
      const terms = [...new Set([...approved, ...custom])];
      await this.autoLinker.processFile(file, terms);
    }));

    // Command: Scan Vault
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

    // Command: Process Review Queue
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

    // Command: Translate Math (Basic)
    this.addCommand({
      id: 'theophysics-translate-math-basic',
      name: 'Translate Math to Words (Basic/Story)',
      callback: async () => await this.mathTranslator.executeCommand('basic')
    });

    // Command: Translate Math (Medium)
    this.addCommand({
      id: 'theophysics-translate-math-medium',
      name: 'Translate Math to Words (Medium/Semi-Tech)',
      callback: async () => await this.mathTranslator.executeCommand('medium')
    });
    
    // Command: Translate Math (Academic)
    this.addCommand({
      id: 'theophysics-translate-math-academic',
      name: 'Translate Math to Words (Academic/Precise)',
      callback: async () => await this.mathTranslator.executeCommand('academic')
    });

    this.app.workspace.onLayoutReady(async () => {
      await this.ensureCustomTermsFile();
      await this.glossaryManager.ensureGlossaryExists();
    });
  }

  async ensureCustomTermsFile() {
    const file = this.app.vault.getAbstractFileByPath(this.settings.customTermsFile);
    if (!file) {
      const template = `# Custom Terms to Track\n# Add your terms below (one per line)\nMaster Equation\nGrace Function\nLogos Field\nConsciousness Collapse\n`;
      await this.app.vault.create(this.settings.customTermsFile, template);
    }
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

module.exports = TheophysicsPlugin;
