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

module.exports = {
  GlossaryManager
};
