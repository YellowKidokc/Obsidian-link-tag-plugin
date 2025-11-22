const DETECTION_PATTERNS = {
  equations: /([A-Z][\w])\s*=\s*/g,
  capitalizedPhrases: /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g,
  acronyms: /\b([A-Z]{2,})\b/g,
  biblical: /\b([A-Z][a-z]+\s+\d+:\d+(?:-\d+)?)\b/g,
  technical: /\b(\w+\s+(?:theorem|law|principle|equation|framework|field|coherence))\b/gi
};

const WHITELIST = [
  'Master Equation',
  'Lowe Coherence Lagrangian',
  'Ten Laws Framework',
  'PEAR Lab',
  'General Relativity',
  'Quantum Mechanics',
  'Logos field',
  'consciousness collapse'
];

const BLACKLIST = [
  'the', 'and', 'is', 'was', 'are', 'were', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'system', 'framework', 'process', 'method'
];

function shouldIgnore(term, extraWhitelist = []) {
  const lower = term.toLowerCase();
  const combinedWhitelist = [...WHITELIST, ...extraWhitelist.map(t => t.toLowerCase())];
  if (combinedWhitelist.includes(lower)) return false;
  if (BLACKLIST.includes(lower)) return true;
  if (term.length < 3) return true;
  return false;
}

function detectTerms(content, extraWhitelist = []) {
  const occurrences = [];
  const lines = content.split('\n');
  lines.forEach((line, index) => {
    if (!line.trim()) return;
    Object.entries(DETECTION_PATTERNS).forEach(([category, pattern]) => {
      const matches = line.matchAll(pattern);
      for (const match of matches) {
        const term = match[1];
        if (!term || shouldIgnore(term, extraWhitelist)) continue;
        occurrences.push({
          term,
          category,
          line: index + 1,
          context: line.trim()
        });
      }
    });
  });
  return occurrences;
}

module.exports = {
  DETECTION_PATTERNS,
  WHITELIST,
  BLACKLIST,
  detectTerms,
  shouldIgnore
};
