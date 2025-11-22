// ===== MATH LAYER DETECTOR =====
// Detects mathematical expressions, Greek symbols, operators for TTS translation

const MATH_PATTERNS = {
  // Greek letters (lowercase)
  greekLower: /[αβγδεζηθικλμνξοπρστυφχψω]/g,
  
  // Greek letters (uppercase)
  greekUpper: /[ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ]/g,
  
  // Common math operators
  operators: /[∇∂∫∑∏√±×÷≠≈≤≥∞]/g,
  
  // LaTeX-style expressions
  latex: /\$\$?[^$]+\$\$?/g,
  
  // Subscripts/superscripts in text
  subscripts: /_\{[^}]+\}|_[a-zA-Z0-9]/g,
  superscripts: /\^\{[^}]+\}|\^[a-zA-Z0-9]/g,
  
  // Common physics constants
  constants: /\b(ℏ|ℓ_P|k_B|G_N|c)\b/g,
  
  // Quantum notation
  braKet: /[⟨⟩]|\|[^|]+⟩|⟨[^|]+\|/g,
  
  // Tensors and indices
  tensorNotation: /[A-Z]_\{?\\?[μνρσαβγδ]\}?/g
};

// Translation table for Greek symbols
const GREEK_TRANSLATIONS = {
  // Lowercase
  'α': { basic: 'alpha', medium: 'alpha', academic: 'alpha, fine structure constant or coupling' },
  'β': { basic: 'beta', medium: 'beta', academic: 'beta parameter' },
  'γ': { basic: 'gamma', medium: 'gamma, decay rate', academic: 'gamma, decoherence coefficient' },
  'δ': { basic: 'delta', medium: 'delta, small change', academic: 'delta, variation or Dirac delta' },
  'ε': { basic: 'epsilon', medium: 'epsilon, small parameter', academic: 'epsilon, regularization constant' },
  'ζ': { basic: 'zeta', medium: 'zeta', academic: 'zeta function' },
  'η': { basic: 'eta', medium: 'eta', academic: 'eta, Minkowski metric' },
  'θ': { basic: 'theta', medium: 'theta, angle', academic: 'theta parameter' },
  'κ': { basic: 'kappa', medium: 'kappa, coupling constant', academic: 'kappa, gravitational coupling' },
  'λ': { basic: 'lambda', medium: 'lambda, wavelength or coupling', academic: 'lambda, regularization or self-interaction' },
  'μ': { basic: 'mu', medium: 'mu, spacetime index', academic: 'mu, covariant index' },
  'ν': { basic: 'nu', medium: 'nu, spacetime index', academic: 'nu, covariant index' },
  'ξ': { basic: 'xi', medium: 'xi', academic: 'xi parameter' },
  'π': { basic: 'pi', medium: 'pi, approximately 3.14159', academic: 'pi, the circle constant' },
  'ρ': { basic: 'rho', medium: 'rho, density', academic: 'rho, density field' },
  'σ': { basic: 'sigma', medium: 'sigma, standard deviation or sum', academic: 'sigma, statistical measure or summation' },
  'τ': { basic: 'tau', medium: 'tau, proper time', academic: 'tau, timelike parameter' },
  'υ': { basic: 'upsilon', medium: 'upsilon', academic: 'upsilon' },
  'φ': { basic: 'phi', medium: 'phi, scalar field', academic: 'phi, information density or scalar field' },
  'χ': { basic: 'chi, the Logos Field', medium: 'chi, the information substrate', academic: 'chi, the scalar Logos field' },
  'ψ': { basic: 'psi, the consciousness wave', medium: 'psi, the wavefunction', academic: 'psi, quantum state vector' },
  'ω': { basic: 'omega', medium: 'omega, angular frequency', academic: 'omega, frequency parameter' },
  
  // Uppercase
  'Γ': { basic: 'Gamma', medium: 'Gamma, decay rate', academic: 'capital Gamma, decoherence rate' },
  'Δ': { basic: 'Delta', medium: 'Delta, change in', academic: 'capital Delta, finite difference' },
  'Θ': { basic: 'Theta, the threshold', medium: 'Theta, critical value', academic: 'capital Theta, actualization threshold' },
  'Λ': { basic: 'Lambda, cosmological constant', medium: 'Lambda, dark energy', academic: 'capital Lambda, cosmological constant' },
  'Ξ': { basic: 'Xi', medium: 'Xi', academic: 'capital Xi' },
  'Π': { basic: 'Pi', medium: 'Pi, product or momentum', academic: 'capital Pi, conjugate momentum' },
  'Σ': { basic: 'Sigma, the sum', medium: 'Sigma, summation', academic: 'capital Sigma, summation operator' },
  'Φ': { basic: 'Phi, the field', medium: 'Phi, scalar field', academic: 'capital Phi, field or integrated information' },
  'Ψ': { basic: 'Psi, the soul field', medium: 'Psi, quantum field', academic: 'capital Psi, soul field or state vector' },
  'Ω': { basic: 'Omega, all of creation', medium: 'Omega, integration domain', academic: 'capital Omega, spacetime region' }
};

// Translation table for operators
const OPERATOR_TRANSLATIONS = {
  '∇': { basic: 'the gradient', medium: 'nabla, gradient operator', academic: 'nabla, covariant derivative' },
  '∇²': { basic: 'the curvature', medium: 'del squared, Laplacian', academic: 'Laplacian operator' },
  '∂': { basic: 'the change in', medium: 'partial derivative', academic: 'partial derivative operator' },
  '∫': { basic: 'adding up over', medium: 'integral over', academic: 'integration operator' },
  '∑': { basic: 'the sum of', medium: 'summation', academic: 'discrete summation' },
  '∏': { basic: 'the product of', medium: 'product', academic: 'discrete product operator' },
  '√': { basic: 'square root of', medium: 'square root', academic: 'radical, square root' },
  '±': { basic: 'plus or minus', medium: 'plus minus', academic: 'plus or minus' },
  '×': { basic: 'times', medium: 'cross product or times', academic: 'multiplication or cross product' },
  '÷': { basic: 'divided by', medium: 'division', academic: 'division operator' },
  '≠': { basic: 'not equal to', medium: 'not equals', academic: 'inequality' },
  '≈': { basic: 'approximately', medium: 'approximately equal', academic: 'asymptotic equality' },
  '≤': { basic: 'less than or equal to', medium: 'less than or equal', academic: 'inequality, less than or equal' },
  '≥': { basic: 'greater than or equal to', medium: 'greater than or equal', academic: 'inequality, greater than or equal' },
  '∞': { basic: 'infinity', medium: 'infinity', academic: 'infinite limit' }
};

// Translation table for constants
const CONSTANT_TRANSLATIONS = {
  'ℏ': { basic: "Planck's constant", medium: 'h-bar, reduced Planck constant', academic: 'h-bar equals 1.054 times 10 to the minus 34 joule seconds' },
  'ℓ_P': { basic: 'the Planck length', medium: 'ell sub P, Planck length', academic: 'Planck length, 1.616 times 10 to the minus 35 meters' },
  'k_B': { basic: "Boltzmann's constant", medium: 'k sub B, Boltzmann constant', academic: 'Boltzmann constant, 1.381 times 10 to the minus 23 joules per kelvin' },
  'G_N': { basic: "Newton's constant", medium: 'G sub N, gravitational constant', academic: 'Newton gravitational constant, 6.674 times 10 to the minus 11' },
  'c': { basic: 'the speed of light', medium: 'c, light speed', academic: 'c equals 299,792,458 meters per second' }
};

function detectMathSymbols(content, settings) {
  if (!settings.mathLayerEnabled) return [];
  
  const occurrences = [];
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    if (!line.trim()) return;
    
    // Detect Greek symbols
    if (settings.detectGreekSymbols) {
      const greekMatches = [...line.matchAll(MATH_PATTERNS.greekLower), ...line.matchAll(MATH_PATTERNS.greekUpper)];
      for (const match of greekMatches) {
        const symbol = match[0];
        const translation = GREEK_TRANSLATIONS[symbol];
        if (translation) {
          occurrences.push({
            term: symbol,
            category: 'greek_symbol',
            line: index + 1,
            context: line.trim(),
            translation: translation
          });
        }
      }
    }
    
    // Detect operators
    if (settings.detectMathOperators) {
      const opMatches = line.matchAll(MATH_PATTERNS.operators);
      for (const match of opMatches) {
        const symbol = match[0];
        const translation = OPERATOR_TRANSLATIONS[symbol];
        if (translation) {
          occurrences.push({
            term: symbol,
            category: 'math_operator',
            line: index + 1,
            context: line.trim(),
            translation: translation
          });
        }
      }
    }
    
    // Detect math expressions
    if (settings.detectMathExpressions) {
      const latexMatches = line.matchAll(MATH_PATTERNS.latex);
      for (const match of latexMatches) {
        occurrences.push({
          term: match[0],
          category: 'math_expression',
          line: index + 1,
          context: line.trim()
        });
      }
    }
  });
  
  return occurrences;
}

function translateMathForTTS(text, level = 'basic') {
  let translated = text;
  
  // Translate Greek symbols
  for (const [symbol, trans] of Object.entries(GREEK_TRANSLATIONS)) {
    const regex = new RegExp(symbol, 'g');
    translated = translated.replace(regex, trans[level]);
  }
  
  // Translate operators
  for (const [symbol, trans] of Object.entries(OPERATOR_TRANSLATIONS)) {
    const regex = new RegExp(symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    translated = translated.replace(regex, trans[level]);
  }
  
  // Translate constants
  for (const [symbol, trans] of Object.entries(CONSTANT_TRANSLATIONS)) {
    const regex = new RegExp(symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    translated = translated.replace(regex, trans[level]);
  }
  
  return translated;
}

module.exports = {
  MATH_PATTERNS,
  GREEK_TRANSLATIONS,
  OPERATOR_TRANSLATIONS,
  CONSTANT_TRANSLATIONS,
  detectMathSymbols,
  translateMathForTTS
};
