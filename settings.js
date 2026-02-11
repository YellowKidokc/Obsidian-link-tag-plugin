const { PluginSettingTab, Setting } = require("obsidian");

const DEFAULT_SETTINGS = {
  autoLinking: true,
  linkToGlossary: true,
  linkToExternal: false,
  detectScientific: true,
  detectBiblical: true,
  detectCitations: true,
  detectEquations: true,
  detectPersons: false,
  autoGenerateStubs: true,
  flagUndefined: true,
  showUsageCount: true,
  postgresSync: false,
  externalSources: [
    {
      id: 'stanford-encyclopedia',
      name: 'Stanford Encyclopedia of Philosophy',
      baseUrl: 'https://plato.stanford.edu/search/searcher.py?query=',
      keywords: ['philosophy', 'metaphysics', 'ethics', 'logic', 'ontology'],
      priority: 1
    },
    {
      id: 'internet-encyclopedia',
      name: 'Internet Encyclopedia of Philosophy',
      baseUrl: 'https://iep.utm.edu/?s=',
      keywords: ['philosophy', 'theology', 'epistemology', 'history'],
      priority: 2
    },
    {
      id: 'arxiv',
      name: 'arXiv',
      baseUrl: 'https://arxiv.org/search/?searchtype=all&query=',
      keywords: ['quantum', 'physics', 'relativity', 'lagrangian', 'equation'],
      priority: 3
    },
    {
      id: 'wikipedia',
      name: 'Wikipedia',
      baseUrl: 'https://en.wikipedia.org/wiki/Special:Search?search=',
      keywords: [],
      priority: 4
    }
  ],
  minFrequency: 3,
  customTerms: [],
  customTermsFile: 'Theophysics_Custom_Terms.md',
  definitionsFolder: 'Definitions',
  glossaryFile: 'Theophysics_Glossary.md',
  reviewQueueFile: '_term_review_queue.md',
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
      .setName('Link to external sources')
      .setDesc('Add ranked external reference links to glossary entries (Wikipedia used as fallback)')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.linkToExternal)
        .onChange(async (value) => {
          this.plugin.settings.linkToExternal = value;
          await this.plugin.saveSettings();
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
      .setName('Definitions folder')
      .setDesc('Run Definition Maintenance Mode only on notes in this folder')
      .addText(text => text
        .setPlaceholder('Definitions')
        .setValue(this.plugin.settings.definitionsFolder)
        .onChange(async (value) => {
          this.plugin.settings.definitionsFolder = value || DEFAULT_SETTINGS.definitionsFolder;
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
  }
}

module.exports = {
  DEFAULT_SETTINGS,
  TheophysicsSettingTab
};
