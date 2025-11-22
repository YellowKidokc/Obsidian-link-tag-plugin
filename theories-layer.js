// ===== COMBINED THEORIES LAYER =====
// Meticulously evaluates whether theories should be combined based on context

const THEORY_KEYWORDS = [
  'quantum mechanics',
  'general relativity',
  'quantum field theory',
  'information theory',
  'consciousness',
  'logos field',
  'trinity',
  'grace',
  'entropy',
  'coherence',
  'resurrection',
  'actualization',
  'observer effect',
  'wavefunction collapse',
  'spacetime',
  'entanglement',
  'decoherence',
  'superposition'
];

const COMBINATION_INDICATORS = [
  'coupled',
  'unified',
  'integrated',
  'combined',
  'merged',
  'synthesized',
  'convergence',
  'consilience',
  'intersection',
  'bridge',
  'connects',
  'relates',
  'corresponds',
  'analogous',
  'parallel'
];

const SEPARATION_INDICATORS = [
  'distinct',
  'separate',
  'independent',
  'orthogonal',
  'unrelated',
  'different',
  'contrasts',
  'versus',
  'opposed',
  'contradicts'
];

function detectTheories(content) {
  const theories = [];
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    const lower = line.toLowerCase();
    THEORY_KEYWORDS.forEach(keyword => {
      if (lower.includes(keyword)) {
        theories.push({
          theory: keyword,
          line: index + 1,
          context: line.trim()
        });
      }
    });
  });
  
  return theories;
}

function evaluateTheoryCombination(content, settings) {
  if (!settings.theoriesLayerEnabled || !settings.evaluateTheoryCombinations) {
    return [];
  }
  
  const theories = detectTheories(content);
  const combinations = [];
  
  // Group theories by proximity
  for (let i = 0; i < theories.length; i++) {
    for (let j = i + 1; j < theories.length; j++) {
      const theory1 = theories[i];
      const theory2 = theories[j];
      
      // Calculate distance in characters
      const distance = Math.abs(theory1.line - theory2.line);
      
      if (distance <= settings.maxCombinationDistance) {
        // Extract context window
        const startLine = Math.max(0, Math.min(theory1.line, theory2.line) - 2);
        const endLine = Math.max(theory1.line, theory2.line) + 2;
        const contextLines = content.split('\n').slice(startLine, endLine);
        const contextText = contextLines.join(' ').toLowerCase();
        
        // Check for combination indicators
        const hasCombinationIndicator = COMBINATION_INDICATORS.some(indicator => 
          contextText.includes(indicator)
        );
        
        const hasSeparationIndicator = SEPARATION_INDICATORS.some(indicator => 
          contextText.includes(indicator)
        );
        
        // Calculate confidence score
        let confidence = 0.5; // Base confidence
        
        if (hasCombinationIndicator) confidence += 0.3;
        if (hasSeparationIndicator) confidence -= 0.4;
        if (distance < 50) confidence += 0.1; // Very close proximity
        if (distance < 20) confidence += 0.1; // Extremely close
        
        // Require contextual evidence if setting enabled
        if (settings.requireContextualEvidence && !hasCombinationIndicator) {
          confidence *= 0.5;
        }
        
        // Only suggest if above threshold
        if (confidence >= settings.minTheoryConfidence) {
          combinations.push({
            theory1: theory1.theory,
            theory2: theory2.theory,
            confidence: confidence,
            distance: distance,
            shouldCombine: confidence >= settings.minTheoryConfidence,
            evidence: hasCombinationIndicator ? 'combination indicators present' : 'proximity-based',
            context: contextText.substring(0, 200)
          });
        }
      }
    }
  }
  
  return combinations;
}

function analyzeTheoryRelationships(content, settings) {
  const theories = detectTheories(content);
  const combinations = evaluateTheoryCombination(content, settings);
  
  // Build relationship graph
  const relationships = new Map();
  
  combinations.forEach(combo => {
    const key = `${combo.theory1}|${combo.theory2}`;
    if (!relationships.has(key)) {
      relationships.set(key, {
        theories: [combo.theory1, combo.theory2],
        confidence: combo.confidence,
        occurrences: 1,
        evidence: [combo.evidence],
        contexts: [combo.context]
      });
    } else {
      const rel = relationships.get(key);
      rel.occurrences++;
      rel.confidence = Math.max(rel.confidence, combo.confidence);
      rel.evidence.push(combo.evidence);
      rel.contexts.push(combo.context);
    }
  });
  
  return {
    totalTheories: new Set(theories.map(t => t.theory)).size,
    theoryOccurrences: theories.length,
    potentialCombinations: combinations.length,
    relationships: Array.from(relationships.values()).sort((a, b) => b.confidence - a.confidence)
  };
}

function generateTheoryCombinationReport(content, settings) {
  const analysis = analyzeTheoryRelationships(content, settings);
  
  let report = `# Theory Combination Analysis\n\n`;
  report += `**Total Unique Theories Detected:** ${analysis.totalTheories}\n`;
  report += `**Total Theory Mentions:** ${analysis.theoryOccurrences}\n`;
  report += `**Potential Combinations:** ${analysis.potentialCombinations}\n\n`;
  
  if (analysis.relationships.length > 0) {
    report += `## Recommended Theory Combinations\n\n`;
    
    analysis.relationships.forEach((rel, index) => {
      report += `### ${index + 1}. ${rel.theories[0]} ↔ ${rel.theories[1]}\n`;
      report += `- **Confidence:** ${(rel.confidence * 100).toFixed(1)}%\n`;
      report += `- **Occurrences:** ${rel.occurrences}\n`;
      report += `- **Evidence:** ${rel.evidence.join(', ')}\n`;
      report += `- **Context:** "${rel.contexts[0].substring(0, 150)}..."\n\n`;
    });
  } else {
    report += `## No Strong Theory Combinations Detected\n\n`;
    report += `The theories in this document appear to be discussed independently or the confidence threshold is too high.\n`;
  }
  
  return report;
}

module.exports = {
  THEORY_KEYWORDS,
  COMBINATION_INDICATORS,
  SEPARATION_INDICATORS,
  detectTheories,
  evaluateTheoryCombination,
  analyzeTheoryRelationships,
  generateTheoryCombinationReport
};
