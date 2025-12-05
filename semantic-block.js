/**
 * SemanticBlockManager - Read/Write %%semantic blocks in Obsidian notes
 * 
 * Format:
 * %%semantic
 * {
 *   "classifications": [
 *     { "content": "exact text", "type": "axiom", "added": "2025-01-15" }
 *   ]
 * }
 * %%
 */

class SemanticBlockManager {
  constructor(app) {
    this.app = app;
  }

  /**
   * Parse existing %%semantic block from file content
   * Returns { classifications: [...] } or null if not found
   */
  parseBlock(content) {
    const regex = /%%semantic\s*\n([\s\S]*?)\n%%/;
    const match = content.match(regex);
    
    if (!match) return null;
    
    try {
      return JSON.parse(match[1]);
    } catch (e) {
      console.warn('Failed to parse semantic block:', e);
      return { classifications: [], _parseError: true };
    }
  }

  /**
   * Generate %%semantic block string from data
   */
  generateBlock(data) {
    const json = JSON.stringify(data, null, 2);
    return `\n%%semantic\n${json}\n%%`;
  }

  /**
   * Add a classification to a file
   * Creates block if doesn't exist, appends to existing if it does
   */
  async addClassification(file, selectedText, typeName) {
    const content = await this.app.vault.read(file);
    const existing = this.parseBlock(content);
    
    const newEntry = {
      content: selectedText.substring(0, 500), // Cap at 500 chars
      type: typeName,
      added: new Date().toISOString().split('T')[0]
    };

    let data;
    let newContent;

    if (existing) {
      // Check for duplicates
      const isDupe = existing.classifications.some(
        c => c.content === newEntry.content && c.type === newEntry.type
      );
      
      if (isDupe) {
        console.log('Classification already exists, skipping');
        return { success: true, duplicate: true };
      }

      existing.classifications.push(newEntry);
      data = existing;
      
      // Replace existing block
      newContent = content.replace(
        /\n?%%semantic\s*\n[\s\S]*?\n%%/,
        this.generateBlock(data)
      );
    } else {
      // Create new block at end of file
      data = { classifications: [newEntry] };
      newContent = content.trimEnd() + '\n' + this.generateBlock(data);
    }

    await this.app.vault.modify(file, newContent);
    
    return { success: true, data, duplicate: false };
  }

  /**
   * Remove a classification by content match
   */
  async removeClassification(file, contentToRemove) {
    const content = await this.app.vault.read(file);
    const existing = this.parseBlock(content);
    
    if (!existing) return { success: false, reason: 'no_block' };

    const before = existing.classifications.length;
    existing.classifications = existing.classifications.filter(
      c => c.content !== contentToRemove
    );
    
    if (existing.classifications.length === before) {
      return { success: false, reason: 'not_found' };
    }

    let newContent;
    if (existing.classifications.length === 0) {
      // Remove block entirely if empty
      newContent = content.replace(/\n?%%semantic\s*\n[\s\S]*?\n%%/, '');
    } else {
      newContent = content.replace(
        /\n?%%semantic\s*\n[\s\S]*?\n%%/,
        this.generateBlock(existing)
      );
    }

    await this.app.vault.modify(file, newContent);
    return { success: true };
  }

  /**
   * Get all classifications from a file
   */
  async getClassifications(file) {
    const content = await this.app.vault.read(file);
    const data = this.parseBlock(content);
    return data?.classifications || [];
  }

  /**
   * Scan entire vault for semantic blocks
   * Returns Map<filePath, classifications[]>
   */
  async scanVault() {
    const files = this.app.vault.getMarkdownFiles();
    const results = new Map();

    for (const file of files) {
      const classifications = await this.getClassifications(file);
      if (classifications.length > 0) {
        results.set(file.path, classifications);
      }
    }

    return results;
  }

  /**
   * Generate summary dashboard of all semantic classifications
   */
  async generateDashboard() {
    const allData = await this.scanVault();
    const byType = {};
    let total = 0;

    for (const [path, classifications] of allData) {
      for (const c of classifications) {
        if (!byType[c.type]) byType[c.type] = [];
        byType[c.type].push({ ...c, file: path });
        total++;
      }
    }

    let md = `---
cssclass: dashboard
tags: [dashboard, semantic, classifications]
updated: ${new Date().toISOString()}
---

# 🏷️ Semantic Classification Dashboard

> **Epistemic Map** of classified content across your vault

## 📊 Overview

| Metric | Value |
|:-------|------:|
| **Total Classifications** | ${total} |
| **Files with Classifications** | ${allData.size} |
| **Unique Types** | ${Object.keys(byType).length} |

## 📖 By Type

`;

    const typeOrder = [
      'axiom', 'theorem', 'postulate', 'terms',
      'claim', 'evidence', 'hypothesis',
      'objection', 'response', 'synthesis',
      'relationship', 'bridge', 'implication',
      'equation', 'variable', 'law',
      'dark', 'light', 'trinity',
      'external_link', 'internal_link', 'forward_link',
      'coherence', 'reference'
    ];

    // Sort by predefined order, then alphabetically for unknowns
    const sortedTypes = Object.keys(byType).sort((a, b) => {
      const ia = typeOrder.indexOf(a);
      const ib = typeOrder.indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });

    for (const type of sortedTypes) {
      const items = byType[type];
      const icon = this.getTypeIcon(type);
      
      md += `\n### ${icon} ${type} (${items.length})\n\n`;
      md += `| Content | File | Added |\n|:--------|:-----|:------|\n`;
      
      for (const item of items.slice(0, 20)) { // Limit per type
        const shortContent = item.content.substring(0, 60).replace(/\|/g, '\\|');
        const fileName = item.file.split('/').pop().replace('.md', '');
        md += `| ${shortContent}${item.content.length > 60 ? '...' : ''} | [[${fileName}]] | ${item.added || '-'} |\n`;
      }
      
      if (items.length > 20) {
        md += `\n*...and ${items.length - 20} more*\n`;
      }
    }

    md += `\n---\n*Generated: ${new Date().toLocaleString()}*\n`;

    return md;
  }

  getTypeIcon(type) {
    const icons = {
      axiom: '⚛️', theorem: '📐', postulate: '📜', terms: '📝',
      claim: '◇', evidence: '●', hypothesis: '❓',
      objection: '⚔️', response: '🛡️', synthesis: '🔄',
      relationship: '🔗', bridge: '🌉', implication: '➡️',
      equation: '∑', variable: '𝑥', law: '⚖️',
      dark: '🌑', light: '☀️', trinity: '△',
      external_link: '🔗', internal_link: '📎', forward_link: '⏩',
      coherence: '⟷', reference: '◈'
    };
    return icons[type] || '📌';
  }
}

module.exports = { SemanticBlockManager };
