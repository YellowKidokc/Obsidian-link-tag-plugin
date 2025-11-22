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
    const pattern = new RegExp(`\\[\\[[^\\]]*${this.escapeRegExp(term)}[^\\]]*\\\\]`, 'i');
    const mdPattern = new RegExp(`\\[[^\\]]*${this.escapeRegExp(term)}[^\\]]*\\]\([^)]+\)`, 'i');
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

module.exports = {
  AutoLinker
};
