const { Notice } = require('obsidian');

class AIIntegration {
  constructor(app, settings) {
    this.app = app;
    this.settings = settings;
  }

  /**
   * Analyze content and extract mathematical symbols not in current tracking list
   */
  async detectMathSymbols(content, currentSymbols = []) {
    // Pattern to find potential math symbols
    const patterns = [
      // Greek letters
      /[α-ωΑ-Ω]/g,
      // Mathematical operators
      /[∇∂∫∑∏√∞≈≠≤≥±∈∉⊂⊃∪∩]/g,
      // Special math symbols
      /[ℏℝℂℕℤℚ]/g,
      // Symbols in LaTeX blocks
      /\$\$([^$]+)\$\$/g,
      /\$([^$]+)\$/g
    ];

    const foundSymbols = new Set();

    patterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          // Clean LaTeX delimiters
          const cleaned = match.replace(/\$+/g, '').trim();
          if (cleaned && !currentSymbols.includes(cleaned)) {
            foundSymbols.add(cleaned);
          }
        });
      }
    });

    // Try to extract meanings from context
    const symbolMeanings = {};
    foundSymbols.forEach(symbol => {
      const meaningRegex = new RegExp(`${this.escapeRegExp(symbol)}\\s*[=:]\\s*([^\\n,.;]{3,50})`, 'i');
      const match = content.match(meaningRegex);
      if (match) {
        symbolMeanings[symbol] = match[1].trim();
      }
    });

    return {
      symbols: Array.from(foundSymbols),
      meanings: symbolMeanings
    };
  }

  /**
   * Analyze content and extract theories/frameworks not in current tracking list
   */
  async detectTheories(content, currentTheories = []) {
    // Common patterns for theory names
    const patterns = [
      // "X Theory"
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+Theory\b/g,
      // "X Interpretation"
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+Interpretation\b/g,
      // "X Principle"
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+Principle\b/g,
      // "X Model"
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+Model\b/g,
      // "X Theorem"
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+Theorem\b/g,
      // "Law of X"
      /\bLaw\s+of\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g,
      // Possessive forms like "Einstein's Relativity"
      /\b([A-Z][a-z]+)'s\s+([A-Z][a-z]+)\b/g
    ];

    const foundTheories = new Set();

    patterns.forEach(pattern => {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        const theory = match[0];
        if (!currentTheories.some(t => theory.toLowerCase().includes(t.toLowerCase()))) {
          foundTheories.add(theory);
        }
      }
    });

    // Detect framework categories
    const categories = this.categorizeTheories(Array.from(foundTheories));

    return {
      theories: Array.from(foundTheories),
      categories: categories
    };
  }

  /**
   * Analyze content and extract important keywords
   */
  async detectKeywords(content, currentKeywords = []) {
    // Remove common words
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
      'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
      'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this',
      'that', 'these', 'those', 'it', 'its', 'they', 'them', 'their'
    ]);

    // Extract capitalized terms (potential technical terms)
    const capitalizedPattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g;
    const matches = content.match(capitalizedPattern) || [];

    // Count frequency
    const frequency = {};
    matches.forEach(term => {
      const lower = term.toLowerCase();
      if (!stopWords.has(lower) && !currentKeywords.includes(lower)) {
        frequency[term] = (frequency[term] || 0) + 1;
      }
    });

    // Sort by frequency
    const sortedKeywords = Object.entries(frequency)
      .filter(([term, count]) => count >= 2) // Minimum 2 occurrences
      .sort(([, a], [, b]) => b - a)
      .map(([term]) => term);

    return {
      keywords: sortedKeywords.slice(0, 50), // Top 50
      frequency: frequency
    };
  }

  /**
   * Categorize theories into domains
   */
  categorizeTheories(theories) {
    const categories = {
      'Physics': [],
      'Theology': [],
      'Mathematics': [],
      'Consciousness': [],
      'Information': [],
      'Other': []
    };

    const physicsKeywords = ['quantum', 'relativity', 'particle', 'field', 'wave', 'energy', 'force'];
    const theologyKeywords = ['god', 'divine', 'logos', 'trinity', 'christ', 'pneuma', 'spirit'];
    const mathKeywords = ['theorem', 'proof', 'set', 'group', 'topology', 'analysis'];
    const consciousnessKeywords = ['consciousness', 'mind', 'awareness', 'perception', 'cognitive'];
    const infoKeywords = ['information', 'entropy', 'bit', 'data', 'complexity'];

    theories.forEach(theory => {
      const lower = theory.toLowerCase();

      if (physicsKeywords.some(k => lower.includes(k))) {
        categories['Physics'].push(theory);
      } else if (theologyKeywords.some(k => lower.includes(k))) {
        categories['Theology'].push(theory);
      } else if (mathKeywords.some(k => lower.includes(k))) {
        categories['Mathematics'].push(theory);
      } else if (consciousnessKeywords.some(k => lower.includes(k))) {
        categories['Consciousness'].push(theory);
      } else if (infoKeywords.some(k => lower.includes(k))) {
        categories['Information'].push(theory);
      } else {
        categories['Other'].push(theory);
      }
    });

    return categories;
  }

  /**
   * Generate AI enhancement report for a file
   */
  async analyzeFile(file, currentTracking = {}) {
    const content = await this.app.vault.read(file);

    new Notice(`AI: Analyzing ${file.basename}...`);

    // Detect new symbols
    const mathResults = await this.detectMathSymbols(
      content,
      currentTracking.symbols || []
    );

    // Detect new theories
    const theoryResults = await this.detectTheories(
      content,
      currentTracking.theories || []
    );

    // Detect new keywords
    const keywordResults = await this.detectKeywords(
      content,
      currentTracking.keywords || []
    );

    return {
      file: file.basename,
      math: mathResults,
      theories: theoryResults,
      keywords: keywordResults
    };
  }

  /**
   * Generate enhancement report across multiple files
   */
  async analyzeVault(files, currentTracking = {}) {
    const results = {
      totalFiles: files.length,
      math: { symbols: new Set(), meanings: {} },
      theories: { theories: new Set(), categories: {} },
      keywords: { keywords: new Set(), frequency: {} }
    };

    let processed = 0;

    for (const file of files) {
      try {
        const analysis = await this.analyzeFile(file, currentTracking);

        // Merge math results
        analysis.math.symbols.forEach(s => results.math.symbols.add(s));
        Object.assign(results.math.meanings, analysis.math.meanings);

        // Merge theory results
        analysis.theories.theories.forEach(t => results.theories.theories.add(t));
        Object.keys(analysis.theories.categories).forEach(cat => {
          if (!results.theories.categories[cat]) {
            results.theories.categories[cat] = new Set();
          }
          analysis.theories.categories[cat].forEach(t =>
            results.theories.categories[cat].add(t)
          );
        });

        // Merge keyword results
        analysis.keywords.keywords.forEach(k => results.keywords.keywords.add(k));
        Object.keys(analysis.keywords.frequency).forEach(k => {
          results.keywords.frequency[k] =
            (results.keywords.frequency[k] || 0) + analysis.keywords.frequency[k];
        });

        processed++;
        if (processed % 10 === 0) {
          new Notice(`AI: Processed ${processed}/${files.length} files...`);
        }
      } catch (err) {
        console.error(`Error analyzing ${file.basename}:`, err);
      }
    }

    // Convert Sets to Arrays
    results.math.symbols = Array.from(results.math.symbols);
    results.theories.theories = Array.from(results.theories.theories);
    Object.keys(results.theories.categories).forEach(cat => {
      results.theories.categories[cat] = Array.from(results.theories.categories[cat]);
    });
    results.keywords.keywords = Array.from(results.keywords.keywords);

    return results;
  }

  /**
   * Generate markdown report of AI findings
   */
  generateEnhancementReport(results) {
    let md = `---
cssclass: ai-report
tags: [ai, enhancement, analysis]
generated: ${new Date().toISOString()}
---

# 🤖 AI Enhancement Report

> **Smart Integration Layer** - Discovered elements not currently tracked

## 📊 Summary

| Category | New Discoveries |
|:---------|----------------:|
| **Math Symbols** | ${results.math.symbols.length} |
| **Theories** | ${results.theories.theories.length} |
| **Keywords** | ${results.keywords.keywords.length} |
| **Files Analyzed** | ${results.totalFiles} |

---

## 🔣 New Math Symbols Discovered

${results.math.symbols.length > 0 ? `
Found ${results.math.symbols.length} symbols not in current tracking list:

| Symbol | Meaning Found | Status |
|:------:|:--------------|:-------|
` : ''}`;

    results.math.symbols.forEach(symbol => {
      const meaning = results.math.meanings[symbol] || '*not detected*';
      md += `| **${symbol}** | ${meaning} | ⚠️ Not tracked |\n`;
    });

    if (results.math.symbols.length === 0) {
      md += `✅ All mathematical symbols are being tracked!\n`;
    }

    md += `\n---

## 📚 New Theories/Frameworks Discovered

${results.theories.theories.length > 0 ? `
Found ${results.theories.theories.length} theories not in current tracking list:
` : ''}`;

    if (results.theories.theories.length > 0) {
      Object.keys(results.theories.categories).forEach(category => {
        const theories = results.theories.categories[category];
        if (theories.length > 0) {
          md += `\n### ${category}\n\n`;
          theories.forEach(theory => {
            md += `- [ ] **${theory}** ⚠️ Not tracked\n`;
          });
        }
      });
    } else {
      md += `✅ All theories/frameworks are being tracked!\n`;
    }

    md += `\n---

## 🏷️ New Keywords Discovered

${results.keywords.keywords.length > 0 ? `
Found ${results.keywords.keywords.length} significant keywords not in tracking list:

| Rank | Keyword | Frequency | Status |
|:----:|:--------|----------:|:-------|
` : ''}`;

    results.keywords.keywords.slice(0, 50).forEach((keyword, index) => {
      const freq = results.keywords.frequency[keyword] || 0;
      md += `| ${index + 1} | **${keyword}** | ${freq} | ⚠️ Not tracked |\n`;
    });

    if (results.keywords.keywords.length === 0) {
      md += `✅ All important keywords are being tracked!\n`;
    }

    md += `\n---

## 📝 Recommendations

`;

    if (results.math.symbols.length > 0) {
      md += `### Math Layer\n- Add ${results.math.symbols.length} new symbols to tracking list\n- Run Math Dashboard again after updating\n\n`;
    }

    if (results.theories.theories.length > 0) {
      md += `### Theory Integration\n- Add ${results.theories.theories.length} new theories to tracking list\n- Run Theory Dashboard again after updating\n\n`;
    }

    if (results.keywords.keywords.length > 0) {
      md += `### Keyword Analytics\n- Add ${results.keywords.keywords.length} new keywords to tracking list\n- Run Keyword Dashboard again after updating\n\n`;
    }

    if (results.math.symbols.length === 0 &&
        results.theories.theories.length === 0 &&
        results.keywords.keywords.length === 0) {
      md += `✅ **All tracking lists are comprehensive!** No gaps detected.\n`;
    }

    md += `\n---\n*Generated: ${new Date().toLocaleString()}*\n`;

    return md;
  }

  escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

module.exports = {
  AIIntegration
};
