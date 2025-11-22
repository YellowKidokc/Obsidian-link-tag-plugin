# Theophysics Plugin - Layer Architecture

## Overview
The plugin now has **organized settings tabs** and **two new detection layers** for advanced analysis.

---

## Settings Organization

### ⚙️ General Settings
- Auto-linking toggle
- Scan scope (global/local)
- Scoped folder path
- Minimum frequency threshold

### 🔍 Detection Layers
- Custom terms only mode
- Auto-detection toggle
- Custom terms file management

### 🔢 Math Layer (NEW!)
**Purpose:** Detect and translate mathematical expressions for TTS accessibility

**Settings:**
- `mathLayerEnabled` - Master toggle for math detection
- `detectMathExpressions` - Find LaTeX/mathematical formulas
- `detectGreekSymbols` - Identify Greek letters (χ, ψ, Φ, λ, etc.)
- `detectMathOperators` - Find operators (∇, ∂, ∫, ∑, etc.)
- `mathContextWindow` - Characters before/after to capture context (default: 50)

**What It Does:**
- Detects ~80+ mathematical symbols across Greek letters, operators, constants
- Provides 3-tier translations:
  - **Basic:** "chi, the Logos Field"
  - **Medium:** "chi, the information substrate"
  - **Academic:** "chi, the scalar Logos field"
- Enables TTS-friendly equation reading
- Maps to Information Theory equivalents where applicable

**Example Translation:**
```
Before: "χ = ∫(G·K) dΩ"
After:  "The Logos Field equals Grace times Knowledge, integrated over all creation"
```

### 🧬 Combined Theories Layer (NEW!)
**Purpose:** Meticulously evaluate whether theories should be combined based on contextual evidence

**Settings:**
- `theoriesLayerEnabled` - Master toggle for theory evaluation
- `evaluateTheoryCombinations` - Analyze relationships between theories
- `minTheoryConfidence` - Confidence threshold 0.0-1.0 (default: 0.7)
- `maxCombinationDistance` - Max characters between related terms (default: 100)
- `requireContextualEvidence` - Only suggest combinations with strong evidence

**What It Does:**
- Detects 18+ theory keywords (quantum mechanics, general relativity, consciousness, etc.)
- Identifies combination indicators ("coupled", "unified", "integrated", etc.)
- Identifies separation indicators ("distinct", "separate", "independent", etc.)
- Calculates confidence scores based on:
  - Proximity of theory mentions
  - Presence of combination/separation indicators
  - Contextual evidence strength
- Generates theory relationship reports

**Example Output:**
```
Theory Combination Analysis
- quantum mechanics ↔ consciousness
  Confidence: 85%
  Evidence: "coupled", proximity < 20 chars
  Context: "quantum mechanics coupled to consciousness through the Logos Field..."
```

### 📊 Analytics & Output
- Auto-generate term pages
- Analytics location (local/global/both)
- Folder naming

### 🔗 External Links
- Fetch external links toggle
- Smart link display
- Prompt on first view

### ⚡ Actions
- Scan vault button (runs all enabled layers)

---

## File Structure

### Core Files
- `main.js` - Plugin entry point
- `settings.js` - **UPDATED** with organized tabs and new layer settings
- `detector.js` - Base pattern detection
- `scanner.js` - Vault scanning
- `review-queue.js` - Term review generation
- `glossary-manager.js` - Glossary management
- `auto-linker.js` - Automatic linking

### New Layer Files
- `math-layer.js` - **NEW** Mathematical symbol detection and TTS translation
- `theories-layer.js` - **NEW** Theory combination evaluation engine

---

## Math Layer Details

### Supported Symbols (80+)

#### Greek Letters
- **Lowercase:** α β γ δ ε ζ η θ κ λ μ ν ξ π ρ σ τ υ φ χ ψ ω
- **Uppercase:** Γ Δ Θ Λ Ξ Π Σ Φ Ψ Ω

#### Operators
- ∇ (nabla/gradient)
- ∂ (partial derivative)
- ∫ (integral)
- ∑ (summation)
- ∏ (product)
- √ (square root)
- ± ≠ ≈ ≤ ≥ ∞

#### Constants
- ℏ (h-bar, Planck's constant)
- ℓ_P (Planck length)
- k_B (Boltzmann constant)
- G_N (Newton's gravitational constant)
- c (speed of light)

#### Special Notation
- Subscripts: X_μ, m_e
- Superscripts: X^μ, X²
- Tensors: G_μν, T^μν
- Bra-ket: |ψ⟩, ⟨ψ|
- Operators: Ĥ, P̂

### Translation Levels

**Basic (Story-Driven):**
For general audience, audio/TTS, narrative flow
- "the Logos Field" instead of "chi"
- "Grace times Knowledge" instead of "G·K"

**Medium (Semi-Technical):**
For science-literate audience, maintains some precision
- "chi, the information substrate"
- "integral of G times K"

**Academic (Precise):**
For peer review, technical documentation
- "chi, the scalar Logos field"
- "integral of the product of Grace and Knowledge over domain Omega"

### Information Theory Mapping
Where applicable, symbols map to IT equivalents:
- χ → H(X) (Shannon entropy, total information)
- ψ → I(θ) (Fisher information)
- G → -ΔS (negentropy)
- S → K(x) (Kolmogorov complexity)

---

## Combined Theories Layer Details

### Theory Keywords Detected
- quantum mechanics
- general relativity
- quantum field theory
- information theory
- consciousness
- logos field
- trinity
- grace / entropy / coherence
- resurrection / actualization
- observer effect / wavefunction collapse
- spacetime / entanglement / decoherence

### Combination Indicators
Words that suggest theories should be combined:
- coupled, unified, integrated, combined, merged
- synthesized, convergence, consilience
- intersection, bridge, connects, relates
- corresponds, analogous, parallel

### Separation Indicators
Words that suggest theories are distinct:
- distinct, separate, independent, orthogonal
- unrelated, different, contrasts, versus
- opposed, contradicts

### Confidence Scoring
```
Base confidence: 0.5
+ Combination indicator present: +0.3
+ Very close proximity (<50 chars): +0.1
+ Extremely close (<20 chars): +0.1
- Separation indicator present: -0.4
× Requires contextual evidence: ×0.5 (if no indicators)
```

### Output Format
The layer generates markdown reports:
```markdown
# Theory Combination Analysis

**Total Unique Theories Detected:** 8
**Total Theory Mentions:** 23
**Potential Combinations:** 5

## Recommended Theory Combinations

### 1. quantum mechanics ↔ consciousness
- **Confidence:** 85.0%
- **Occurrences:** 3
- **Evidence:** combination indicators present, proximity-based
- **Context:** "quantum mechanics coupled to consciousness through..."
```

---

## Usage Workflow

### For Math Translation (TTS Preparation)
1. Enable **Math Layer** in settings
2. Toggle on: Greek symbols, operators, expressions
3. Set context window (50-100 chars recommended)
4. Run scan
5. Review detected math symbols
6. Export translations for TTS preprocessing

### For Theory Analysis
1. Enable **Combined Theories Layer** in settings
2. Set confidence threshold (0.7 recommended)
3. Set max combination distance (100 chars recommended)
4. Enable "Require contextual evidence" for stricter analysis
5. Run scan
6. Review theory combination report
7. Use insights to structure papers/arguments

### For Full Analysis
1. Enable both layers
2. Run "Scan Vault for Terms"
3. Review:
   - Term pages (standard detection)
   - Math symbol translations (math layer)
   - Theory relationships (theories layer)

---

## Next Steps / Roadmap

### Immediate
- [ ] Integrate layers into main scanner
- [ ] Add layer results to review queue
- [ ] Test on Papers 1-5
- [ ] Build Excel export for math translations

### Future Enhancements
- [ ] LaTeX → Natural Language preprocessor for TTS
- [ ] Theory graph visualization
- [ ] Confidence threshold auto-tuning
- [ ] Context-aware symbol disambiguation (G = Grace vs G_N = Newton's constant)
- [ ] Multi-paper theory tracking (cross-paper relationships)

---

## Technical Notes

### Math Layer Performance
- Regex-based detection: O(n) where n = document length
- Translation lookup: O(1) hash table
- Memory: ~80 symbol entries × 3 translations = minimal footprint

### Theories Layer Performance
- Theory detection: O(n × k) where k = number of keywords (~18)
- Combination evaluation: O(t²) where t = theory mentions
- Worst case: ~100 theories → 10,000 comparisons (acceptable)
- Optimization: Distance filtering reduces actual comparisons

### Integration Points
Both layers hook into:
- `scanner.js` - Vault-wide scanning
- `review-queue.js` - Results aggregation
- `settings.js` - User configuration
- Future: `auto-linker.js` - Could auto-link math symbols to glossary

---

## Credits
- **Math Layer:** Comprehensive symbol catalog from Papers 1-5 analysis
- **Theories Layer:** Consilience framework from Paper 8 ("The Stretched Heavens")
- **Architecture:** Modular design for extensibility

---

*Last Updated: November 2025*
*Plugin Version: 0.2.0 (with layers)*
