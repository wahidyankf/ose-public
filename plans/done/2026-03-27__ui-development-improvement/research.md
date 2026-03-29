# Research Notes: UI Development Improvement

## Sources Analyzed

- [impeccable.style](https://impeccable.style) — AI design skill by Paul Bakaus (~12k GitHub
  stars)
- [github.com/pbakaus/impeccable](https://github.com/pbakaus/impeccable) — Repository structure
  and skill architecture
- [Vercel Web Interface Guidelines](https://vercel.com/design/guidelines) — Programmatically
  enforceable UI rules
- [Vercel Geist Design System](https://vercel.com/geist/introduction) — Reference design system
- Industry research on design system governance (Salesforce, Mozilla, GitHub Primer, Stripe)
- Tailwind CSS v4 monorepo patterns (Turborepo docs, Tailwind blog)
- Visual regression and accessibility testing landscape (2025-2026)

## Key Findings

### 1. Impeccable.style — What It Actually Is

**Not** a CSS framework or linter. It is an **AI skill/prompt-enhancement layer** that gives AI
coding assistants structured design vocabulary so they produce distinctive, high-quality frontend
code instead of generic "AI slop."

**Structure** (7 reference modules):

| Module             | Coverage                                                              | Relevance to Us                                         |
| ------------------ | --------------------------------------------------------------------- | ------------------------------------------------------- |
| Typography         | Modular scales, font pairing, fluid sizing, OpenType features         | High — we have no type scale convention                 |
| Color and Contrast | OKLCH color space, palette construction, dark mode, tinted neutrals   | High — our tokens use HSL, not OKLCH                    |
| Spatial Design     | 4pt grid system, visual rhythm, container queries, asymmetry          | High — we have no spacing convention                    |
| Motion Design      | Exponential easing, duration guidelines, reduced-motion support       | Medium — limited animation in our apps                  |
| Interaction Design | Optimistic UI, state design, progressive disclosure, focus management | High — state coverage is inconsistent                   |
| Responsive Design  | Container queries, input detection, mobile-first, fluid design        | Medium — our apps are mostly desktop-first              |
| UX Writing         | Labels, errors, empty states, microcopy                               | Low — our apps are content-light (except ayokoding-web) |

**20 slash commands** for workflow: `/audit`, `/critique`, `/normalize`, `/polish`, `/distill`,
`/clarify`, `/optimize`, `/harden`, `/animate`, `/colorize`, `/bolder`, `/quieter`, `/delight`,
`/extract`, `/adapt`, `/onboard`, `/typeset`, `/arrange`, `/overdrive`,
`/teach-impeccable`

**Anti-pattern library** — explicit "don't" list including:

- Overused fonts (Inter, Roboto, Arial) — **we use Arial in organiclever-fe**
- Pure black/white (#000/#fff) — **our tokens avoid this (darkest is `0 0% 3.9%`)**
- The "AI color palette" (cyan-on-dark, purple-blue gradients) — not present in our apps
- Card-wrapped everything, nested cards — relevant to future dashboard development
- Identical card grids with icon+heading+text — relevant to future dashboard development
- Glassmorphism without purpose — not present in our apps
- Bounce/elastic easing — no animations in our apps yet
- Center-aligned everything — our apps use left-aligned layouts

**Measured impact**: 59% quality improvement (Tessl benchmarking) from vocabulary injection alone.

**Context system**: Requires `.impeccable.md` at project root with target audience, use cases,
and brand personality — information that cannot be inferred from code.

**Trade-off vs. building our own**: Impeccable provides proven, measured improvement with zero
effort — but it cannot reference our specific tokens (`--color-primary`, `--radius`), our Radix
composition patterns, or our per-app brand differences. See AD1 in tech-docs.md for the full
trade-off analysis.

### 2. Vercel Web Interface Guidelines — Enforceable Rules

Key rules that can be automated, with our current compliance:

| Rule                                                               | Automatable?                | Our Status                         |
| ------------------------------------------------------------------ | --------------------------- | ---------------------------------- |
| Minimum hit targets: 24px desktop, 44px mobile                     | ESLint custom rule          | Unknown — not measured             |
| Font size >= 16px on mobile inputs                                 | ESLint custom rule          | Likely compliant (shadcn defaults) |
| `prefers-reduced-motion` must be honored                           | ESLint + manual review      | No animations yet — N/A            |
| `font-variant-numeric: tabular-nums` for numerical data            | Manual review               | Not used anywhere                  |
| No color-only status indicators                                    | Manual review + agent check | Unknown                            |
| Every form control requires `<label>`, `autocomplete`, `inputmode` | eslint-plugin-jsx-a11y      | Not enforced                       |
| Child border-radius <= parent border-radius                        | Manual review               | Not measured                       |
| Use APCA over WCAG 2 for contrast                                  | Manual review               | Not measured                       |

### 3. Design System Governance Patterns

**Salesforce**: Ships `@salesforce-ux/eslint-plugin-slds` with `no-hardcoded-values-slds2` rule
forcing design token usage. **Trade-off**: Comprehensive but Salesforce-specific. We need a
simpler regex-based approach.

**Mozilla/Firefox**: Custom Stylelint rule `no-base-design-tokens` requiring semantic tokens
over base color variables. **Trade-off**: Stylelint is for CSS files; our enforcement point is
TSX files. Not directly applicable.

**GitHub Primer**: Custom erb-lint linters with autocorrection for migration tracking.
**Trade-off**: Ruby-specific tooling; the concept of migration tracking is valuable but the
implementation is not transferable.

**Stripe**: Architectural enforcement — TypeScript types expose only approved tokens; editor
autocomplete guides usage. **Trade-off**: Elegant but requires a build step to generate types
from tokens. Worth considering for Phase 2 (TypeScript token exports).

### 4. Tailwind v4 Monorepo Best Practices

- Define tokens centrally in shared `theme.css` using `@theme` directives
- Each package providing styled components needs its own `styles.css` importing shared theme
- Use `cn()` (clsx + tailwind-merge) or CVA for conditional class composition
- `prettier-plugin-tailwindcss` for deterministic class ordering
- Full rebuilds under 100ms in v4; incremental builds single-digit milliseconds

**Key finding**: Tailwind v4's CSS-first approach makes token sharing simpler than v3 — no
JavaScript config files to merge. The `@theme` directive in CSS is directly importable across
packages.

**Our specific situation**: organiclever-fe uses double indirection
(`--color-primary: hsl(var(--primary))`) while ayokoding-web uses direct values
(`--color-primary: hsl(221.2 83.2% 53.3%)`). The shared token package should use the direct
value approach (simpler, ayokoding-web pattern) with per-app overrides using CSS cascade.

### 5. Automated UI Quality Tools — Evaluation

| Category           | Tool                            | Fits Our Stack?                         | Trade-off                                                                |
| ------------------ | ------------------------------- | --------------------------------------- | ------------------------------------------------------------------------ |
| Visual Regression  | Chromatic                       | Yes, but SaaS cost                      | Free tier: 5000 snapshots/month; best diff UX; overkill for 6 components |
| Visual Regression  | Percy                           | Yes, but SaaS cost                      | Similar to Chromatic; BrowserStack integration                           |
| Visual Regression  | Playwright `toHaveScreenshot()` | Yes — already have Playwright           | Free, local, no SaaS; OS-dependent rendering; ~6MB baseline in git       |
| Visual Regression  | BackstopJS                      | Yes, but another tool                   | Open-source; Puppeteer-based; separate from our Playwright setup         |
| Accessibility      | axe-core / vitest-axe           | Yes — Vitest in use                     | Industry standard; catches ~57% of WCAG violations automatically         |
| Accessibility      | eslint-plugin-jsx-a11y          | Yes — ESLint in use                     | Static analysis; catches structural a11y issues at lint time             |
| Accessibility      | @axe-core/playwright            | Yes — Playwright in use                 | Runtime a11y in E2E; complements vitest-axe                              |
| Design Token Lint  | Custom Stylelint rules          | No — we use Tailwind utilities, not CSS | Stylelint targets CSS files; our enforcement point is TSX                |
| Design Token Lint  | Custom ESLint rule              | Yes — ESLint in use                     | Regex-based; simpler than AST; some false positives                      |
| Design Token Lint  | @eslint/css                     | Partial — new, limited                  | CSS-in-ESLint; interesting but immature                                  |
| CSS Quality        | stylelint-plugin-defensive-css  | No — same as above                      | Good rules but wrong enforcement point                                   |
| Class Sorting      | prettier-plugin-tailwindcss     | Yes — Prettier in pre-commit            | Zero-config sorting; requires tailwindStylesheet for v4                  |
| Component Variants | CVA                             | Already in use                          | Keep existing pattern                                                    |

**Chosen stack**: Playwright `toHaveScreenshot()` + vitest-axe + eslint-plugin-jsx-a11y +
custom ESLint rule + prettier-plugin-tailwindcss. All leverage existing tools in our pipeline.

### 6. Other AI Frontend Skills

| Skill                           | Source          | What It Does                          | Overlap With Ours                           |
| ------------------------------- | --------------- | ------------------------------------- | ------------------------------------------- |
| `frontend-design` (Vercel)      | Already enabled | Generic design quality guidance       | High — we extend, not replace               |
| `react-best-practices` (Vercel) | Already enabled | TSX quality checklist                 | Medium — complements our component patterns |
| `shadcn` (Vercel)               | Available       | shadcn/ui component guidance          | Medium — we add repo-specific patterns      |
| Impeccable                      | External        | 7 modules, 20 commands, anti-patterns | High — we adapt key concepts                |
| Addy Osmani's approach          | Blog post       | Feed style guides to AI as context    | Aligns with our skill approach              |

**Trade-off**: Our repo-specific skill overlaps with Vercel's `frontend-design`. Both will
trigger on TSX edits. This is acceptable — the Vercel skill provides universal principles while
ours provides repo-specific guidance. The Vercel skill runs only once per session (dedup), so
the performance impact is minimal.

### 7. Component Quality Pipeline (Industry Standard 2026)

1. **Static analysis** — ESLint custom rules for composition, props, a11y attributes
2. **Unit tests** — Vitest + Testing Library + axe-core for automated a11y
3. **Visual regression** — Chromatic/Percy or Playwright screenshots per component
4. **Interaction tests** — Storybook play functions or Playwright component tests
5. **E2E** — Playwright full-page tests with visual comparison

**Our planned coverage**:

| Layer             | Industry Standard        | Our Plan                      | Gap                                                  |
| ----------------- | ------------------------ | ----------------------------- | ---------------------------------------------------- |
| Static analysis   | Custom ESLint + a11y     | jsx-a11y + custom token rule  | No component composition rules (deferred)            |
| Unit tests        | Testing Library + axe    | vitest-axe + Testing Library  | Covered                                              |
| Visual regression | Chromatic/Percy          | Playwright toHaveScreenshot() | Simpler but sufficient                               |
| Interaction tests | Storybook play functions | Not planned                   | Acceptable gap — low interactivity in our components |
| E2E               | Playwright full-page     | Already have Playwright E2E   | Can add toHaveScreenshot() later                     |

## Recommendations Summary

1. **Adapt impeccable concepts into repo-specific UI skill** — rather than installing impeccable
   directly, create a repo-specific skill inspired by its approach (see AD1 in tech-docs.md for
   the adopted decision and rationale)
2. **Create repo-specific UI skill** (`swe-developing-frontend-ui`) — references our actual
   tokens, documents both token formats, includes per-app brand context
3. **Create two shared libraries** (`ts-ui-tokens` + `ts-ui`) — structural tokens shared,
   brand tokens per-app (see AD2 and AD3 in tech-docs.md)
4. **Add UI conventions** to `governance/development/frontend/` — four focused documents
5. **Add vitest-axe** to unit tests for accessibility automation
6. **Add Playwright visual regression** — leverage existing Playwright setup with git-committed
   baselines
7. **Add eslint-plugin-jsx-a11y** for static a11y analysis
8. **Add custom ESLint rule** for design token enforcement (regex-based)
9. **Add `prettier-plugin-tailwindcss`** for deterministic class ordering
10. **Create full agent trio** (`swe-ui-maker`, `swe-ui-checker`, `swe-ui-fixer`) + `ui-quality-gate` workflow
