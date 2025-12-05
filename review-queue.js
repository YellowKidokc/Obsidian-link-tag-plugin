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

module.exports = {
  ReviewQueueGenerator
};
