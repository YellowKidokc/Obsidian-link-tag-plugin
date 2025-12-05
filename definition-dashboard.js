class DefinitionDashboard {
  constructor(app, settings) {
    this.app = app;
    this.settings = settings;
    this.outputPath = 'Definition_Dashboard.md';
  }

  async build() {
    const glossary = await this.loadGlossary();
    const reviewQueue = await this.loadReviewQueue();

    const content = this.render(glossary, reviewQueue);
    const existing = this.app.vault.getAbstractFileByPath(this.outputPath);
    if (existing) {
      await this.app.vault.modify(existing, content);
    } else {
      await this.app.vault.create(this.outputPath, content);
    }
    return this.outputPath;
  }

  async loadGlossary() {
    const file = this.app.vault.getAbstractFileByPath(this.settings.glossaryFile);
    if (!file) {
      return { entries: [], total: 0 };
    }
    const content = await this.app.vault.read(file);
    const sections = content.split(/\n(?=##\s+)/g).filter(Boolean);
    const entries = sections.map(section => {
      const headingMatch = section.match(/^##\s+(.+)$/m);
      const term = headingMatch ? headingMatch[1].trim() : 'Unknown term';
      const hasBrief = /Brief:\s*(?!\[Add short description\])/i.test(section);
      const hasDefinition = /Full Definition:\s*(?!\[To be expanded\])/i.test(section);
      return {
        term,
        hasBrief,
        hasDefinition
      };
    });

    return {
      entries,
      total: entries.length,
      missingBrief: entries.filter(e => !e.hasBrief),
      missingDefinition: entries.filter(e => !e.hasDefinition)
    };
  }

  async loadReviewQueue() {
    const file = this.app.vault.getAbstractFileByPath(this.settings.reviewQueueFile);
    if (!file) return { pending: [] };
    const content = await this.app.vault.read(file);
    const unchecked = [...content.matchAll(/^- \[ \] \*\*(.+?)\*\*/gm)].map(m => m[1]);
    return { pending: unchecked };
  }

  render(glossary, reviewQueue) {
    const total = glossary.total;
    const missingBrief = glossary.missingBrief.length;
    const missingDefinition = glossary.missingDefinition.length;
    const pending = reviewQueue.pending.length;

    const lines = [];
    lines.push('# 📚 Definition Dashboard');
    lines.push('');
    lines.push('## Snapshot');
    lines.push(`- Glossary entries: **${total}**`);
    lines.push(`- Missing briefs: **${missingBrief}**`);
    lines.push(`- Missing full definitions: **${missingDefinition}**`);
    lines.push(`- Pending review queue items: **${pending}**`);
    lines.push('');

    lines.push('## Quality');
    lines.push(`Brief coverage: ${this.bar(total ? (total - missingBrief) / total : 0)}`);
    lines.push(`Definition coverage: ${this.bar(total ? (total - missingDefinition) / total : 0)}`);
    lines.push('');

    if (glossary.missingDefinition.length) {
      lines.push('### Missing Full Definitions');
      glossary.missingDefinition.slice(0, 20).forEach(entry => {
        lines.push(`- ${entry.term}`);
      });
      if (glossary.missingDefinition.length > 20) {
        lines.push(`…and ${glossary.missingDefinition.length - 20} more`);
      }
      lines.push('');
    }

    if (glossary.missingBrief.length) {
      lines.push('### Missing Brief Summaries');
      glossary.missingBrief.slice(0, 20).forEach(entry => {
        lines.push(`- ${entry.term}`);
      });
      if (glossary.missingBrief.length > 20) {
        lines.push(`…and ${glossary.missingBrief.length - 20} more`);
      }
      lines.push('');
    }

    lines.push('## Review Queue');
    if (reviewQueue.pending.length) {
      reviewQueue.pending.slice(0, 20).forEach(term => lines.push(`- ${term}`));
      if (reviewQueue.pending.length > 20) {
        lines.push(`…and ${reviewQueue.pending.length - 20} more`);
      }
    } else {
      lines.push('No pending items.');
    }
    lines.push('');

    lines.push('## How to Use');
    lines.push('- Check review queue items and process approved terms.');
    lines.push('- Fill in missing briefs and full definitions in the glossary.');
    lines.push('- Re-run Definition Maintenance Mode to refresh this dashboard.');
    lines.push('');

    return lines.join('\n');
  }

  bar(value) {
    const clamped = Math.max(0, Math.min(1, value));
    const filled = Math.round(clamped * 20);
    const empty = 20 - filled;
    return `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${(clamped * 100).toFixed(0)}%`;
  }
}

module.exports = { DefinitionDashboard };
