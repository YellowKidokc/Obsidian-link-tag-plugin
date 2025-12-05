const { Plugin, Notice, TFile, PluginSettingTab, Setting, MarkdownView } = require('obsidian');
const { DEFAULT_SETTINGS, TheophysicsSettingTab } = require('./settings');
const { GlossaryManager } = require('./glossary-manager');
const { TermScanner } = require('./scanner');
const { ReviewQueueGenerator } = require('./review-queue');
const { AutoLinker } = require('./auto-linker');
const { DefinitionDashboard } = require('./definition-dashboard');
const { WHITELIST } = require('./detector');

module.exports = class TheophysicsPlugin extends Plugin {
  async onload() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    this.glossaryManager = new GlossaryManager(this.app, this.settings);
    this.scanner = new TermScanner(this.app, this.settings);
    this.reviewQueue = new ReviewQueueGenerator(this.app, this.settings);
    this.autoLinker = new AutoLinker(this.app, this.settings, this.glossaryManager);
    this.definitionDashboard = new DefinitionDashboard(this.app, this.settings);

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
      id: 'theophysics-scan-definitions',
      name: 'Definition Maintenance Mode (Definitions folder only)',
      callback: async () => await this.runDefinitionMaintenance()
    });

    this.addCommand({
      id: 'theophysics-process-review-queue',
      name: 'Process Review Queue',
      callback: async () => await this.processReviewQueue()
    });

    this.addCommand({
      id: 'theophysics-definition-dashboard',
      name: 'Build Definition Dashboard',
      callback: async () => {
        const path = await this.definitionDashboard.build();
        const file = this.app.vault.getAbstractFileByPath(path);
        if (file) {
          this.app.workspace.getLeaf(true).openFile(file);
          new Notice('Definition Dashboard refreshed.');
        }
      }
    });

    this.addCommand({
      id: 'theophysics-link-current',
      name: 'Link Current File',
      callback: async () => {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        const file = view?.file;
        if (file) {
          const approved = await this.glossaryManager.getGlossaryTerms();
          const custom = await this.scanner.loadCustomTerms();
          const terms = [...new Set([...approved, ...WHITELIST, ...custom])];
          await this.autoLinker.processFile(file, terms);
          new Notice('Auto-linking complete for current file');
        } else {
          new Notice('No active Markdown file to link.');
        }
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
    await this.definitionDashboard.build();
    new Notice(`Scan complete. Found ${result.terms.length} terms.`);
  }

  async runDefinitionMaintenance() {
    await this.ensureCustomTermsFile();
    const customTerms = await this.scanner.loadCustomTerms();
    const folder = this.settings.definitionsFolder;
    const result = await this.scanner.scanVault(customTerms, folder);
    await this.reviewQueue.generateQueue(result, customTerms);
    const path = await this.definitionDashboard.build();
    new Notice(`Definition Maintenance Mode finished. ${result.terms.length} terms found in ${folder}.`);
    const file = this.app.vault.getAbstractFileByPath(path);
    if (file) {
      this.app.workspace.getLeaf(true).openFile(file);
    }
  }

  async processReviewQueue() {
    const approved = await this.reviewQueue.getApprovedTerms();
    if (!approved.length) {
      new Notice('No checked terms found.');
      return;
    }
    await this.glossaryManager.addTerms(approved);
    await this.reviewQueue.clearQueue();
    new Notice('Glossary updated with approved terms and review queue cleared.');
  }
};
