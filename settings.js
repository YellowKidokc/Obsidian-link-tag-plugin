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
  
  // Postgres Sync
  postgresSync: false,
  postgresUrl: 'postgresql://postgres:Moss9pep28$@192.168.1.93:5432/memory',
  postgresSyncInterval: 300, // seconds (5 minutes)
  
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
  aiAutoUpdate: false,
  claudeApiKey: '',
  openaiApiKey: '',
  
  // Dashboard Settings
  showDashboardNotifications: true,
  autoCreateAnalyticsFolder: true
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
      { id: 'general', name: '⚙️ General', icon: '⚙️' },
      { id: 'math', name: '🔣 Math Translation', icon: '🔣' },
      { id: 'theory', name: '📚 Theory Integration', icon: '📚' },
      { id: 'analytics', name: '📊 Analytics', icon: '📊' },
      { id: 'ai', name: '🤖 AI Integration', icon: '🤖' },
      { id: 'advanced', name: '🔧 Advanced', icon: '🔧' }
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

    containerEl.createEl('h2', { text: 'Detection Layers' });
    
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

    containerEl.createEl('h2', { text: 'Math Layer' });
    
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

    containerEl.createEl('h2', { text: 'Combined Theories Layer' });
    
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

    containerEl.createEl('h2', { text: 'Analytics & Output' });
    
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

    containerEl.createEl('h2', { text: 'External Links' });
    
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

    containerEl.createEl('h2', { text: 'Folder Configuration' });
    
    new Setting(containerEl)
      .setName('Global analytics folder')
      .setDesc('Main folder for all dashboards and analytics (created automatically)')
      .addText(text => text
        .setPlaceholder('Data Analytics')
        .setValue(this.plugin.settings.analyticsFolder)
        .onChange(async (value) => {
          this.plugin.settings.analyticsFolder = value || DEFAULT_SETTINGS.analyticsFolder;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Local analytics folder')
      .setDesc('Folder name for local analytics within scoped folders')
      .addText(text => text
        .setPlaceholder('_Data_Analytics')
        .setValue(this.plugin.settings.globalAnalyticsFolder)
        .onChange(async (value) => {
          this.plugin.settings.globalAnalyticsFolder = value || DEFAULT_SETTINGS.globalAnalyticsFolder;
          await this.plugin.saveSettings();
        }));

    containerEl.createEl('h2', { text: 'Actions' });
    
    containerEl.createEl('p', {
      text: '⚠️ First generate all dashboards here to create the Data Analytics folder. Then use individual tabs to update specific dashboards.',
      cls: 'setting-item-description'
    });

    new Setting(containerEl)
      .setName('Scan vault now')
      .setDesc('Run full scan with all enabled detection layers (shows progress)')
      .addButton(button => button
        .setButtonText('Scan Vault')
        .setCta()
        .onClick(async () => {
          await this.plugin.runFullScan();
        }));
  }

  displayMathTab(containerEl) {
    containerEl.createEl('h2', { text: 'Math Translation' });

    containerEl.createEl('p', {
      text: 'Track mathematical symbols and equations across your vault. Dashboard is saved in the Data Analytics folder.',
      cls: 'setting-item-description'
    });

    new Setting(containerEl)
      .setName('Generate/Update Math Translation Dashboard')
      .setDesc('Updates the math dashboard in the Data Analytics folder')
      .addButton(button => button
        .setButtonText('Update Dashboard')
        .setCta()
        .onClick(async () => {
          await this.plugin.generateMathDashboard();
        }));
  }

  displayTheoryTab(containerEl) {
    containerEl.createEl('h2', { text: 'Theory Integration' });

    containerEl.createEl('p', {
      text: 'Track references to 80+ frameworks across Physics, Theology, Mathematics, and Consciousness. Dashboard is saved in the Data Analytics folder.',
      cls: 'setting-item-description'
    });

    new Setting(containerEl)
      .setName('Generate/Update Theory Integration Dashboard')
      .setDesc('Updates the theory dashboard in the Data Analytics folder')
      .addButton(button => button
        .setButtonText('Update Dashboard')
        .setCta()
        .onClick(async () => {
          await this.plugin.generateTheoryDashboard();
        }));
  }

  displayAnalyticsTab(containerEl) {
    containerEl.createEl('h2', { text: 'Data Analytics & Keywords' });

    containerEl.createEl('p', {
      text: 'Configure keyword and tag tracking settings. Dashboards are saved in the Data Analytics folder.',
      cls: 'setting-item-description'
    });

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

    containerEl.createEl('h2', { text: 'Dashboard Generation' });

    new Setting(containerEl)
      .setName('Show notifications')
      .setDesc('Show popup notifications when dashboards are created or updated')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.showDashboardNotifications)
        .onChange(async (value) => {
          this.plugin.settings.showDashboardNotifications = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Generate/Update Keyword & Tag Dashboard')
      .setDesc('Updates the analytics dashboard in the Data Analytics folder')
      .addButton(button => button
        .setButtonText('Update Dashboard')
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

    containerEl.createEl('h3', { text: '🔑 API Keys' });

    new Setting(containerEl)
      .setName('Claude API Key')
      .setDesc('Your Anthropic Claude API key for AI analysis')
      .addText(text => text
        .setPlaceholder('sk-ant-...')
        .setValue(this.plugin.settings.claudeApiKey || '')
        .onChange(async (value) => {
          this.plugin.settings.claudeApiKey = value;
          await this.plugin.saveSettings();
        })
        .inputEl.setAttribute('type', 'password'));

    new Setting(containerEl)
      .setName('OpenAI API Key')
      .setDesc('Your OpenAI API key for AI analysis')
      .addText(text => text
        .setPlaceholder('sk-...')
        .setValue(this.plugin.settings.openaiApiKey || '')
        .onChange(async (value) => {
          this.plugin.settings.openaiApiKey = value;
          await this.plugin.saveSettings();
        })
        .inputEl.setAttribute('type', 'password'));

    containerEl.createEl('h3', { text: '⚙️ AI Settings' });

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

  displayAdvancedTab(containerEl) {
    containerEl.createEl('h2', { text: 'Advanced Settings' });

    containerEl.createEl('h3', { text: '🗄️ Database Configuration' });

    containerEl.createEl('p', {
      text: 'Connect to PostgreSQL database for epistemic classifications, timeline events, and analytics.',
      cls: 'setting-item-description'
    });

    // PostgreSQL Connection URL
    new Setting(containerEl)
      .setName('PostgreSQL Connection URL')
      .setDesc('Connection string for PostgreSQL database (e.g., postgresql://user:password@host:port/database)')
      .addText(text => text
        .setPlaceholder('postgresql://postgres:password@192.168.1.93:5432/memory')
        .setValue(this.plugin.settings.postgresUrl)
        .onChange(async (value) => {
          this.plugin.settings.postgresUrl = value;
          await this.plugin.saveSettings();
          // Reconnect to database with new URL
          if (this.plugin.db) {
            this.plugin.db.updateConnection(value);
          }
        })
      );

    // Test Connection Button
    new Setting(containerEl)
      .setName('Test Database Connection')
      .setDesc('Verify that the database connection is working')
      .addButton(button => button
        .setButtonText('Test Connection')
        .onClick(async () => {
          button.setDisabled(true);
          button.setButtonText('Testing...');

          try {
            const isConnected = await this.plugin.db.testConnection();
            if (isConnected) {
              new Notice('✓ Database connection successful!');
              button.setButtonText('Connected ✓');
            } else {
              new Notice('✗ Database connection failed. Check console for details.');
              button.setButtonText('Failed ✗');
            }
          } catch (error) {
            new Notice('✗ Database connection error: ' + error.message);
            button.setButtonText('Error ✗');
          }

          setTimeout(() => {
            button.setDisabled(false);
            button.setButtonText('Test Connection');
          }, 3000);
        })
      );

    // Initialize Schema Button
    new Setting(containerEl)
      .setName('Initialize Database Schema')
      .setDesc('Create tables and seed initial data (safe to run multiple times)')
      .addButton(button => button
        .setButtonText('Initialize Schema')
        .onClick(async () => {
          button.setDisabled(true);
          button.setButtonText('Initializing...');

          try {
            await this.plugin.db.initializeSchema();
            await this.plugin.db.seedEpistemicTypes();
            new Notice('✓ Database schema initialized successfully!');
            button.setButtonText('Initialized ✓');
          } catch (error) {
            new Notice('✗ Schema initialization failed: ' + error.message);
            button.setButtonText('Failed ✗');
            console.error('Schema initialization error:', error);
          }

          setTimeout(() => {
            button.setDisabled(false);
            button.setButtonText('Initialize Schema');
          }, 3000);
        })
      );

    // Auto-sync toggle
    new Setting(containerEl)
      .setName('Enable auto-sync')
      .setDesc('Automatically sync data to PostgreSQL at regular intervals')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.postgresSync)
        .onChange(async (value) => {
          this.plugin.settings.postgresSync = value;
          await this.plugin.saveSettings();
        }));

    containerEl.createEl('h3', { text: '📁 File Settings' });

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

    new Setting(containerEl)
      .setName('Flag undefined terms')
      .setDesc('Show warnings for terms without glossary entries')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.flagUndefined)
        .onChange(async (value) => {
          this.plugin.settings.flagUndefined = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Show usage count')
      .setDesc('Display term frequency in review queue')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.showUsageCount)
        .onChange(async (value) => {
          this.plugin.settings.showUsageCount = value;
          await this.plugin.saveSettings();
        }));
  }
}

module.exports = {
  DEFAULT_SETTINGS,
  TheophysicsSettingTab
};
