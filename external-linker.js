function normalizeSource(source) {
  return {
    id: source.id,
    name: source.name,
    baseUrl: source.baseUrl,
    keywords: Array.isArray(source.keywords) ? source.keywords.map(k => String(k).toLowerCase()) : [],
    priority: Number.isFinite(source.priority) ? source.priority : 999
  };
}

function scoreSource(term, source) {
  const lower = term.toLowerCase();
  let score = 0;
  for (const keyword of source.keywords) {
    if (lower.includes(keyword)) {
      score += 4;
    }
  }

  if (/\b(theory|philosophy|ethics|ontology|metaphysics|logic)\b/i.test(term) && source.id.includes('encyclopedia')) {
    score += 3;
  }

  if (/\b(quantum|physics|relativity|equation|lagrangian|mechanics)\b/i.test(term) && source.id === 'arxiv') {
    score += 3;
  }

  // keep preferred priority ordering when scores tie
  score += Math.max(0, 10 - source.priority) * 0.01;
  return score;
}

function buildSearchUrl(baseUrl, term) {
  return `${baseUrl}${encodeURIComponent(term)}`;
}

function rankExternalLinks(term, sources, limit = 3) {
  const normalized = (Array.isArray(sources) ? sources : []).map(normalizeSource);
  const scored = normalized
    .map(source => ({
      source,
      score: scoreSource(term, source)
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.source.priority - b.source.priority;
    });

  const top = scored.slice(0, Math.max(1, limit)).map(item => ({
    name: item.source.name,
    url: buildSearchUrl(item.source.baseUrl, term)
  }));

  const hasWikipedia = top.some(link => /wikipedia/i.test(link.name));
  if (!hasWikipedia) {
    const wikipedia = normalized.find(source => source.id === 'wikipedia');
    if (wikipedia) {
      top.push({
        name: wikipedia.name,
        url: buildSearchUrl(wikipedia.baseUrl, term)
      });
    }
  }

  return top;
}

module.exports = {
  rankExternalLinks
};
