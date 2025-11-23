const { PluginSettingTab, Setting } = require("obsidian");

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
  mathContextWindow: 50, // characters before/after to capture context
  
  // Combined Theories Layer Settings
  theoriesLayerEnabled: true,
  evaluateTheoryCombinations: true,
  minTheoryConfidence: 0.7,
  maxCombinationDistance: 100, // characters between related terms
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
  // New analytics settings
  analyticsFolder: 'Data Analytics',
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
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl('h1', { text: 'Theophysics Research Automation' });

    // =================================================================
    // GENERAL SETTINGS
    // =================================================================
    containerEl.createEl('h2', { text: '⚙️ General Settings' });

    // ===== GENERAL SETTINGS =====
    containerEl.createEl('h3', { text: '⚙️ General Settings' });
    
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

    // ===== DETECTION LAYERS =====
    containerEl.createEl('h3', { text: '🔍 Detection Layers' });
    
    new Setting(containerEl)
      .setName('Use custom terms only')
      .setDesc('Only search for terms from your custom terms file (faster, more precise)')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.useCustomTermsOnly)
        .onChange(async (value) => {
          this.plugin.settings.useCustomTermsOnly = value;
          await this.plugin.saveSettings();
          this.display();
        }));

    if (!this.plugin.settings.useCustomTermsOnly) {
      new Setting(containerEl)
        .setName('Use auto-detection')
        .setDesc('Automatically detect technical terms, equations, and patterns')
        .addToggle(toggle => toggle
          .setValue(this.plugin.settings.useAutoDetection)
          .onChange(async (value) => {
            this.plugin.settings.useAutoDetection = value;
            await this.plugin.saveSettings();
          }));
    }

    new Setting(containerEl)
      .setName('Custom terms file')
      .setDesc('Markdown file where you manually add terms to track')
      .addText(text => text
        .setPlaceholder('Theophysics_Custom_Terms.md')
        .setValue(this.plugin.settings.customTermsFile)
        .onChange(async (value) => {
          this.plugin.settings.customTermsFile = value || DEFAULT_SETTINGS.customTermsFile;
          await this.plugin.saveSettings();
        }))
      .addButton(button => button
        .setButtonText('Open')
        .onClick(async () => {
          await this.plugin.openCustomTermsFile();
        }));

    // ===== MATH LAYER =====
    containerEl.createEl('h3', { text: '🔢 Math Layer' });
    
    new Setting(containerEl)
      .setName('Enable math layer')
      .setDesc('Advanced mathematical expression detection and analysis')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.mathLayerEnabled)
        .onChange(async (value) => {
          this.plugin.settings.mathLayerEnabled = value;
          await this.plugin.saveSettings();
          this.display();
        }));

    if (this.plugin.settings.mathLayerEnabled) {
      new Setting(containerEl)
        .setName('Detect math expressions')
        .setDesc('Find mathematical formulas, equations, and expressions')
        .addToggle(toggle => toggle
          .setValue(this.plugin.settings.detectMathExpressions)
          .onChange(async (value) => {
            this.plugin.settings.detectMathExpressions = value;
            await this.plugin.saveSettings();
          }));

      new Setting(containerEl)
        .setName('Detect Greek symbols')
        .setDesc('Identify Greek letters used in mathematical notation (Ψ, Φ, Λ, etc.)')
        .addToggle(toggle => toggle
          .setValue(this.plugin.settings.detectGreekSymbols)
          .onChange(async (value) => {
            this.plugin.settings.detectGreekSymbols = value;
            await this.plugin.saveSettings();
          }));

      new Setting(containerEl)
        .setName('Detect math operators')
        .setDesc('Find mathematical operators and special notation')
        .addToggle(toggle => toggle
          .setValue(this.plugin.settings.detectMathOperators)
          .onChange(async (value) => {
            this.plugin.settings.detectMathOperators = value;
            await this.plugin.saveSettings();
          }));

      new Setting(containerEl)
        .setName('Math context window')
        .setDesc('Characters before/after math expressions to capture for context')
        .addText(text => text
          .setPlaceholder('50')
          .setValue(String(this.plugin.settings.mathContextWindow))
          .onChange(async (value) => {
            const num = parseInt(value, 10);
            if (!isNaN(num) && num > 0) {
              this.plugin.settings.mathContextWindow = num;
              await this.plugin.saveSettings();
            }
          }));
    }

    // ===== COMBINED THEORIES LAYER =====
    containerEl.createEl('h3', { text: '🧬 Combined Theories Layer' });
    
    new Setting(containerEl)
      .setName('Enable theories layer')
      .setDesc('Meticulously evaluate whether theories should be combined based on context')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.theoriesLayerEnabled)
        .onChange(async (value) => {
          this.plugin.settings.theoriesLayerEnabled = value;
          await this.plugin.saveSettings();
          this.display();
        }));

    if (this.plugin.settings.theoriesLayerEnabled) {
      new Setting(containerEl)
        .setName('Evaluate theory combinations')
        .setDesc('Analyze relationships between theories and suggest combinations')
        .addToggle(toggle => toggle
          .setValue(this.plugin.settings.evaluateTheoryCombinations)
          .onChange(async (value) => {
            this.plugin.settings.evaluateTheoryCombinations = value;
            await this.plugin.saveSettings();
          }));

      new Setting(containerEl)
        .setName('Minimum theory confidence')
        .setDesc('Confidence threshold (0.0-1.0) for suggesting theory combinations')
        .addText(text => text
          .setPlaceholder('0.7')
          .setValue(String(this.plugin.settings.minTheoryConfidence))
          .onChange(async (value) => {
            const num = parseFloat(value);
            if (!isNaN(num) && num >= 0 && num <= 1) {
              this.plugin.settings.minTheoryConfidence = num;
              await this.plugin.saveSettings();
            }
          }));

      new Setting(containerEl)
        .setName('Max combination distance')
        .setDesc('Maximum characters between related terms to consider for combination')
        .addText(text => text
          .setPlaceholder('100')
          .setValue(String(this.plugin.settings.maxCombinationDistance))
          .onChange(async (value) => {
            const num = parseInt(value, 10);
            if (!isNaN(num) && num > 0) {
              this.plugin.settings.maxCombinationDistance = num;
              await this.plugin.saveSettings();
            }
          }));

      new Setting(containerEl)
        .setName('Require contextual evidence')
        .setDesc('Only suggest combinations when strong contextual evidence exists')
        .addToggle(toggle => toggle
          .setValue(this.plugin.settings.requireContextualEvidence)
          .onChange(async (value) => {
            this.plugin.settings.requireContextualEvidence = value;
            await this.plugin.saveSettings();
          }));
    }

    // ===== ANALYTICS & OUTPUT =====
    containerEl.createEl('h3', { text: '📊 Analytics & Output' });
    
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
      .setName('Analytics location')
      .setDesc('Where to save term analysis pages')
      .addDropdown(dropdown => dropdown
        .addOption('local', 'Local (inside scanned folder)')
        .addOption('global', 'Global (vault root)')
        .addOption('both', 'Both (local + aggregated global)')
        .setValue(this.plugin.settings.analyticsLocation)
        .onChange(async (value) => {
          this.plugin.settings.analyticsLocation = value;
          await this.plugin.saveSettings();
        }));

    // ===== EXTERNAL LINKS =====
    containerEl.createEl('h3', { text: '🔗 External Links' });
    
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
    }

    // ===== ACTIONS =====
    containerEl.createEl('h3', { text: '⚡ Actions' });
    
    new Setting(containerEl)
      .setName('Scan vault now')
      .setDesc('Run full scan with all enabled detection layers')
      .addButton(button => button
        .setButtonText('Scan')
        .setCta()
        .onClick(async () => {
          await this.plugin.runFullScan();
        }));

    // =================================================================
    // DATA ANALYTICS & KEYWORDS
    // =================================================================
    containerEl.createEl('h2', { text: '📊 Data Analytics & Keywords' });

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
      .setName('Minimum tag frequency')
      .setDesc('Only show tags that appear at least this many times')
      .addText(text => text
        .setPlaceholder('2')
        .setValue(String(this.plugin.settings.minTagFrequency))
        .onChange(async (value) => {
          const num = parseInt(value, 10);
          if (!isNaN(num) && num > 0) {
            this.plugin.settings.minTagFrequency = num;
            await this.plugin.saveSettings();
          }
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

    // =================================================================
    // MATH TRANSLATION
    // =================================================================
    containerEl.createEl('h2', { text: '🔣 Math Translation' });

    containerEl.createEl('p', {
      text: 'Track mathematical symbols and equations across your vault.',
      cls: 'setting-item-description'
    });

    new Setting(containerEl)
      .setName('Math Translation Dashboard')
      .setDesc('Generate comprehensive analysis of mathematical symbols and equations')
      .addButton(button => button
        .setButtonText('Generate Dashboard')
        .setCta()
        .onClick(async () => {
          await this.plugin.generateMathDashboard();
        }));

    // =================================================================
    // THEORY INTEGRATION
    // =================================================================
    containerEl.createEl('h2', { text: '📚 Theory Integration' });

    containerEl.createEl('p', {
      text: 'Track references to 80+ frameworks across Physics, Theology, Mathematics, and Consciousness.',
      cls: 'setting-item-description'
    });

    new Setting(containerEl)
      .setName('Theory Integration Dashboard')
      .setDesc('Track framework references and integration metrics')
      .addButton(button => button
        .setButtonText('Generate Dashboard')
        .setCta()
        .onClick(async () => {
          await this.plugin.generateTheoryDashboard();
        }));

    // =================================================================
    // AI INTEGRATION LAYER
    // =================================================================
    containerEl.createEl('h2', { text: '🤖 AI Integration Layer' });

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
            const view = this.plugin.app.workspace.getActiveViewOfType(require('obsidian').MarkdownView);
            if (view && view.file) {
              await this.plugin.aiAnalyzeFile(view.file);
            } else {
              new (require('obsidian').Notice)('No file open');
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

      new Setting(containerEl)
        .setName('Enhance all dashboards')
        .setDesc('Run AI analysis then regenerate all dashboards with findings')
        .addButton(button => button
          .setButtonText('Enhance All')
          .setCta()
          .onClick(async () => {
            await this.plugin.aiEnhanceAll();
          }));

      containerEl.createEl('h3', { text: '⚙️ AI Configuration' });

      containerEl.createEl('p', {
        text: 'Configure how AI identifies and categorizes new discoveries.',
        cls: 'setting-item-description'
      });

      new Setting(containerEl)
        .setName('Detection confidence')
        .setDesc('Minimum confidence (0.0-1.0) for AI to suggest new items')
        .addText(text => text
          .setPlaceholder('0.7')
          .setValue(String(this.plugin.settings.aiConfidence || 0.7))
          .onChange(async (value) => {
            const num = parseFloat(value);
            if (!isNaN(num) && num >= 0 && num <= 1) {
              this.plugin.settings.aiConfidence = num;
              await this.plugin.saveSettings();
            }
          }));

      new Setting(containerEl)
        .setName('Auto-update tracking lists')
        .setDesc('Automatically add AI discoveries to tracking lists (experimental)')
        .addToggle(toggle => toggle
          .setValue(this.plugin.settings.aiAutoUpdate || false)
          .onChange(async (value) => {
            this.plugin.settings.aiAutoUpdate = value;
            await this.plugin.saveSettings();
          }));
    }
  }
}

module.exports = {
  DEFAULT_SETTINGS,
  TheophysicsSettingTab
};
