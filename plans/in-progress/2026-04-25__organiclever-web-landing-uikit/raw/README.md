# Raw Design Files — Landing Page + UI Kit

Source: Claude Design handoff bundle exported from `https://api.anthropic.com/v1/design/h/JJ1lz9FxESB1EHhRZmkZIA`.

These are the original prototype files. Use them as pixel-accurate implementation references.
Do **not** copy the prototype's internal structure — recreate visual output in Next.js/TypeScript.

## Files

| File                  | What it contains                                                                                                                                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `index.html`          | Full prototype: `LandingPage` React component (JSX via Babel), hash router, landing CSS (`l-*` classes), app bootstrap. The `LandingPage` function (line ~159) is the primary reference.                           |
| `colors_and_type.css` | Complete design token system: 6 hues (`--hue-terracotta/honey/sage/teal/sky/plum`) with ink + wash variants, warm neutral scale (`--warm-0` → `--warm-900`), dark mode, typography scale, radii, spacing, shadows. |

## Key design decisions confirmed from source

- **Hero**: single column (`gridTemplateColumns: '1fr'`, max-width 900, left-aligned)
- **Features grid**: 5 columns (`repeat(5, 1fr)` override in JSX; CSS default is 3-col)
- **Orbs**: `position: fixed` — stay in viewport during full-page scroll
- **Logo mark icon**: lever SVG (2 circles + diagonal line + 4 short paths), not a zap/bolt
- **Landing CSS vars** (`--l-*`) are landing-page-specific; lighter than the full design system hues
- **Principles table**: `gridTemplateColumns: '72px 1fr 1.5fr'`; row numbers formatted as `№ 01`
- **Rhythm chart**: `flex-direction: column-reverse` stacked bars; heights via `flex: <minutes>`
- **Rhythm stats boxes**: `background: 'white'` (not `var(--l-bg-2)`)
- **Week label**: hardcoded `"Sample · April 14–20"` (intentionally static)
- **§02 and §03 sections**: `paddingTop: 0` on the `l-features` container
- **Font**: Nunito (headings/UI) + Nunito Sans (body paragraphs) + JetBrains Mono (code)
