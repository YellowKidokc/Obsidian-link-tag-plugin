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
  minFrequency: 3,
  customTerms: [],
  customTermsFile: 'Theophysics_Custom_Terms.md',
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
  }
}

module.exports = {
  DEFAULT_SETTINGS,
  TheophysicsSettingTab
};
