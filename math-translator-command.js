// ===== MATH TRANSLATOR COMMAND =====
// Translates selected text with math symbols to natural language for TTS

const { Notice, MarkdownView } = require('obsidian');
const { translateMathForTTS, GREEK_TRANSLATIONS, OPERATOR_TRANSLATIONS, CONSTANT_TRANSLATIONS } = require('./math-layer');

class MathTranslatorCommand {
  constructor(app, settings) {
    this.app = app;
    this.settings = settings;
  }

  // Main translation function - converts LaTeX and Unicode math to words
  translateSelection(text, level = 'basic') {
    if (!text || text.trim().length === 0) {
      return text;
    }

    let translated = text;

    // Step 1: Translate inline LaTeX math ($...$)
    translated = this.translateInlineLaTeX(translated, level);

    // Step 2: Translate display LaTeX math ($$...$$)
    translated = this.translateDisplayLaTeX(translated, level);

    // Step 3: Translate Unicode Greek symbols
    translated = this.translateGreekSymbols(translated, level);

    // Step 4: Translate Unicode operators
    translated = this.translateOperators(translated, level);

    // Step 5: Translate common patterns
    translated = this.translateCommonPatterns(translated, level);

    return translated;
  }

  translateInlineLaTeX(text, level) {
    // Match $...$ but not $$...$$
    const inlinePattern = /\$(?!\$)([^$]+)\$/g;
    
    return text.replace(inlinePattern, (match, latex) => {
      const translated = this.translateLaTeXExpression(latex.trim(), level);
      return translated;
    });
  }

  translateDisplayLaTeX(text, level) {
    // Match $$...$$
    const displayPattern = /\$\$([^$]+)\$\$/g;
    
    return text.replace(displayPattern, (match, latex) => {
      const translated = this.translateLaTeXExpression(latex.trim(), level);
      return `\n${translated}\n`;
    });
  }

  translateLaTeXExpression(latex, level) {
    let result = latex;

    // Common LaTeX commands
    const latexTranslations = {
      // Greek letters
      '\\chi': this.getTranslation('χ', level, GREEK_TRANSLATIONS),
      '\\psi': this.getTranslation('ψ', level, GREEK_TRANSLATIONS),
      '\\phi': this.getTranslation('φ', level, GREEK_TRANSLATIONS),
      '\\Phi': this.getTranslation('Φ', level, GREEK_TRANSLATIONS),
      '\\lambda': this.getTranslation('λ', level, GREEK_TRANSLATIONS),
      '\\Lambda': this.getTranslation('Λ', level, GREEK_TRANSLATIONS),
      '\\kappa': this.getTranslation('κ', level, GREEK_TRANSLATIONS),
      '\\epsilon': this.getTranslation('ε', level, GREEK_TRANSLATIONS),
      '\\Gamma': this.getTranslation('Γ', level, GREEK_TRANSLATIONS),
      '\\Omega': this.getTranslation('Ω', level, GREEK_TRANSLATIONS),
      '\\Theta': this.getTranslation('Θ', level, GREEK_TRANSLATIONS),
      '\\rho': this.getTranslation('ρ', level, GREEK_TRANSLATIONS),
      '\\sigma': this.getTranslation('σ', level, GREEK_TRANSLATIONS),
      '\\Sigma': this.getTranslation('Σ', level, GREEK_TRANSLATIONS),
      '\\alpha': this.getTranslation('α', level, GREEK_TRANSLATIONS),
      '\\beta': 'beta',
      '\\gamma': this.getTranslation('γ', level, GREEK_TRANSLATIONS),
      '\\delta': this.getTranslation('δ', level, GREEK_TRANSLATIONS),
      '\\mu': this.getTranslation('μ', level, GREEK_TRANSLATIONS),
      '\\nu': this.getTranslation('ν', level, GREEK_TRANSLATIONS),
      '\\pi': 'pi',
      '\\omega': this.getTranslation('ω', level, GREEK_TRANSLATIONS),
      '\\Psi': this.getTranslation('Ψ', level, GREEK_TRANSLATIONS),

      // Operators
      '\\nabla': this.getTranslation('∇', level, OPERATOR_TRANSLATIONS),
      '\\partial': this.getTranslation('∂', level, OPERATOR_TRANSLATIONS),
      '\\int': this.getTranslation('∫', level, OPERATOR_TRANSLATIONS),
      '\\sum': this.getTranslation('∑', level, OPERATOR_TRANSLATIONS),
      '\\prod': this.getTranslation('∏', level, OPERATOR_TRANSLATIONS),
      '\\sqrt': 'square root of',
      '\\pm': 'plus or minus',
      '\\times': 'times',
      '\\cdot': 'times',
      '\\div': 'divided by',
      '\\neq': 'not equal to',
      '\\approx': 'approximately',
      '\\leq': 'less than or equal to',
      '\\geq': 'greater than or equal to',
      '\\infty': 'infinity',

      // Constants
      '\\hbar': this.getTranslation('ℏ', level, CONSTANT_TRANSLATIONS),
      'c': 'the speed of light',
      'G_N': "Newton's constant",
      'k_B': "Boltzmann's constant",

      // Notation
      '\\frac': ' over ',
      '\\left': '',
      '\\right': '',
      '\\{': '',
      '\\}': '',
      '\\[': '',
      '\\]': '',
      '^': ' to the power of ',
      '_': ' sub ',
      '=': ' equals ',
      '+': ' plus ',
      '-': ' minus ',
      '\\langle': 'the average value of',
      '\\rangle': '',
      '|': '',
      '\\hat': ' operator'
    };

    // Apply translations
    for (const [latex, translation] of Object.entries(latexTranslations)) {
      const regex = new RegExp(latex.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      result = result.replace(regex, translation);
    }

    // Clean up extra spaces
    result = result.replace(/\s+/g, ' ').trim();

    return result;
  }

  translateGreekSymbols(text, level) {
    let result = text;
    
    for (const [symbol, translations] of Object.entries(GREEK_TRANSLATIONS)) {
      const translation = translations[level] || translations.basic;
      const regex = new RegExp(symbol, 'g');
      result = result.replace(regex, translation);
    }
    
    return result;
  }

  translateOperators(text, level) {
    let result = text;
    
    for (const [symbol, translations] of Object.entries(OPERATOR_TRANSLATIONS)) {
      const translation = translations[level] || translations.basic;
      const regex = new RegExp(symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      result = result.replace(regex, ` ${translation} `);
    }
    
    // Clean up extra spaces
    result = result.replace(/\s+/g, ' ').trim();
    
    return result;
  }

  translateCommonPatterns(text, level) {
    let result = text;

    // Common subscripts
    result = result.replace(/G_N/g, "Newton's constant");
    result = result.replace(/k_B/g, "Boltzmann's constant");
    result = result.replace(/m_e/g, "electron mass");
    result = result.replace(/m_S/g, "soul field mass");
    result = result.replace(/\ell_P/g, "Planck length");

    // Common superscripts
    result = result.replace(/\^2/g, " squared");
    result = result.replace(/\^3/g, " cubed");
    result = result.replace(/\^4/g, " to the fourth");
    result = result.replace(/\^{-1}/g, " inverse");

    // Fractions
    result = result.replace(/(\w+)\/(\w+)/g, "$1 over $2");

    return result;
  }

  getTranslation(symbol, level, translationTable) {
    const translations = translationTable[symbol];
    if (!translations) return symbol;
    return translations[level] || translations.basic;
  }

  // Execute the command on selected text
  async executeCommand(level = 'basic') {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    
    if (!activeView) {
      new Notice('No active markdown file');
      return;
    }

    const editor = activeView.editor;
    const selection = editor.getSelection();

    if (!selection || selection.trim().length === 0) {
      new Notice('Please select text containing math symbols to translate');
      return;
    }

    // Translate the selection
    const translated = this.translateSelection(selection, level);

    // Create a new note with the translation or replace selection
    const shouldReplace = await this.promptUserAction();

    if (shouldReplace === 'replace') {
      editor.replaceSelection(translated);
      new Notice('Math symbols translated in place');
    } else if (shouldReplace === 'new') {
      await this.createTranslationNote(selection, translated, level);
      new Notice('Translation created in new note');
    } else if (shouldReplace === 'copy') {
      await navigator.clipboard.writeText(translated);
      new Notice('Translation copied to clipboard');
    }
  }

  async promptUserAction() {
    // For now, just copy to clipboard
    // TODO: Add modal dialog for user choice
    return 'copy';
  }

  async createTranslationNote(original, translated, level) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `Math_Translation_${timestamp}.md`;
    
    const content = `# Math Translation (${level} level)
Generated: ${new Date().toLocaleString()}

## Original
\`\`\`
${original}
\`\`\`

## Translated
${translated}

---
*Generated by Theophysics Math Layer*
`;

    await this.app.vault.create(filename, content);
    
    const file = this.app.vault.getAbstractFileByPath(filename);
    if (file) {
      await this.app.workspace.getLeaf(true).openFile(file);
    }
  }
}

module.exports = {
  MathTranslatorCommand
};
