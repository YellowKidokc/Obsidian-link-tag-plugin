# Math Translation Feature - Usage Guide

## What It Does
Translates mathematical symbols and equations into natural language for TTS (text-to-speech) accessibility.

**Example:**
```
Before: χ = ∫(G·K) dΩ
After:  the Logos Field equals the integral of Grace times Knowledge over all of creation
```

---

## How to Use

### Step 1: Select Text with Math
1. Open any paper (e.g., Paper 5, sections 5.1-5.7)
2. **Select the text** you want to translate (can include regular text + equations)
3. The translator will leave regular words alone and only translate math symbols

### Step 2: Run Translation Command
Open the **Command Palette** (Ctrl/Cmd + P) and choose one of:

#### Option A: Basic/Story Level
**Command:** `Translate Math to Words (Basic/Story)`
- **Best for:** General audience, audiobooks, TTS
- **Example:** "chi, the Logos Field" instead of "χ"
- **Example:** "Grace times Knowledge" instead of "G·K"

#### Option B: Medium/Semi-Technical
**Command:** `Translate Math to Words (Medium/Semi-Tech)`
- **Best for:** Science-literate audience, educational content
- **Example:** "chi, the information substrate"
- **Example:** "integral of G times K"

#### Option C: Academic/Precise
**Command:** `Translate Math to Words (Academic/Precise)`
- **Best for:** Peer review, technical documentation
- **Example:** "chi, the scalar Logos field"
- **Example:** "integral of the product of Grace and Knowledge over domain Omega"

### Step 3: Get Results
The translation is **copied to your clipboard** automatically.
- Paste it wherever you need (TTS script, notes, etc.)
- Original text is unchanged

---

## What Gets Translated

### Greek Letters (40+)
- χ → "chi, the Logos Field"
- ψ → "psi, the consciousness wave"
- Φ → "Phi, the field"
- λ → "lambda, the coupling strength"
- And 36 more...

### Operators
- ∇ → "the gradient"
- ∂ → "the change in"
- ∫ → "adding up over" (basic) or "integral over" (medium)
- ∑ → "the sum of"
- √ → "square root of"

### Constants
- ℏ → "Planck's constant"
- c → "the speed of light"
- G_N → "Newton's constant"
- k_B → "Boltzmann's constant"

### LaTeX Expressions
- `$\chi = \int G \cdot K d\Omega$` → "chi equals the integral of G times K over Omega"
- `$$G_{\mu\nu} = 8\pi G T_{\mu\nu}$$` → "G mu nu equals 8 pi G times T mu nu"

### Subscripts/Superscripts
- X² → "X squared"
- X³ → "X cubed"
- m_e → "electron mass"
- G_N → "Newton's constant"

---

## Example Workflow

### Before (Section 5.1 with equations):
```markdown
## Mathematical Formalism

The Logos Field χ(x,t) is a scalar field coupled to spacetime geometry:

$$G_{\mu\nu} + \Lambda g_{\mu\nu} = \frac{8\pi G}{c^4}T_{\mu\nu} + \kappa\chi_{\mu\nu}$$

Where:
- $G_{\mu\nu}$ is the Einstein tensor
- $\Lambda$ is the cosmological constant
- $\chi_{\mu\nu}$ is the consciousness-information coupling tensor
```

### After (Basic Translation):
```markdown
## Mathematical Formalism

The Logos Field chi of x and t is a scalar field coupled to spacetime geometry:

spacetime curvature plus the cosmological constant times the metric equals 
8 pi times Newton's constant over the speed of light to the fourth, times 
the stress-energy of matter, plus kappa times the consciousness-information 
coupling tensor

Where:
- spacetime curvature is the Einstein tensor
- the cosmological constant is dark energy
- the consciousness-information coupling tensor represents how the Logos Field affects geometry
```

---

## Tips

### 1. Select Smartly
- **Select entire sections** (5.1-5.7) for batch translation
- **Include context** - the translator preserves regular text
- **Don't worry about formatting** - it handles LaTeX, Unicode, and plain text

### 2. Choose the Right Level
- **Basic** for audio/TTS → sounds natural when spoken
- **Medium** for teaching → balances clarity and precision
- **Academic** for papers → maintains technical accuracy

### 3. Iterate
- Try different levels to see which sounds best
- You can translate the same text multiple times
- Original is never changed (translation goes to clipboard)

### 4. Use for TTS Prep
1. Translate section to Basic level
2. Paste into TTS software (e.g., Natural Reader, Amazon Polly)
3. Listen - it now says "the Logos Field" instead of "chi"
4. Adjust if needed and re-translate

---

## Keyboard Shortcuts (Optional)
You can assign hotkeys in Obsidian settings:
1. Settings → Hotkeys
2. Search "Translate Math"
3. Assign keys (e.g., Ctrl+Shift+M for Basic)

---

## What Doesn't Get Translated
- Regular English words (untouched)
- Proper nouns (Einstein, Newton, etc.)
- Numbers (unless part of an expression)
- Markdown formatting (headers, lists, etc.)

---

## Troubleshooting

### "No active markdown file"
- Make sure you're in a markdown (.md) file
- Click into the editor before running command

### "Please select text"
- You must select text first (click and drag)
- Empty selections won't work

### Translation looks wrong
- Check which level you used (Basic vs Medium vs Academic)
- Some context-dependent symbols (G, R, T) may need manual review
- Report issues - we're still cataloging edge cases!

---

## Future Enhancements
- [ ] Modal dialog to choose action (replace, new note, or clipboard)
- [ ] Context-aware disambiguation (G = Grace vs G_N = Newton)
- [ ] Batch translate entire files
- [ ] Export to TTS-ready format
- [ ] Custom translation rules per user

---

## Technical Details

### Supported Formats
- **LaTeX inline:** `$...$`
- **LaTeX display:** `$$...$$`
- **Unicode symbols:** χ, ψ, ∇, ∫, etc.
- **Mixed text:** Regular words + math symbols

### Translation Table
See `MATH_TRANSLATION_TABLE.csv` for complete symbol catalog (95+ entries)

### Performance
- Instant for selections up to 10,000 characters
- Handles entire papers (50,000+ chars) in < 1 second

---

*Last Updated: November 2025*
*Feature: Math Translation Layer v1.0*
