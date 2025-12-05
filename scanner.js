const { detectTerms, WHITELIST } = require('./detector');

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

  async scanVault(customTerms = [], targetFolder = null) {
    const files = this.app.vault.getMarkdownFiles()
      .filter(f => !targetFolder || f.path.startsWith(`${targetFolder.replace(/\/$/, '')}/`));
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

module.exports = {
  TermScanner
};
