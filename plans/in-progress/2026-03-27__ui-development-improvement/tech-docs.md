# Technical Documentation: UI Development Improvement

## Architecture Decisions

### AD1: Impeccable-Inspired Skill vs. Direct Installation

**Decision**: Create a **repo-specific UI skill** inspired by impeccable.style rather than
installing impeccable directly.

**Trade-offs**:

| Factor | Install Impeccable Directly | Build Repo-Specific Skill (Chosen) |
| --- | --- | --- |
| Setup effort | `npx skills add pbakaus/impeccable` (minutes) | Create SKILL.md + 5 reference modules (hours) |
| Token awareness | Generic — no knowledge of our tokens | References our actual `--color-primary`, `--radius`, etc. |
| Brand context | `.impeccable.md` at root (generic format) | Brand context embedded in skill (per-app specifics) |
| Anti-patterns | Universal anti-patterns (24 items) | Universal + repo-specific (hardcoded hex in code blocks, etc.) |
| Maintenance | Upstream updates automatically | We maintain it — more control, more work |
| Slash commands | 20 built-in commands | Build equivalent into agent workflows |
| Compatibility | Claude Code, Cursor, Codex, etc. | Claude Code + OpenCode only (our two systems) |
| Measured impact | 59% quality improvement (Tessl) | Unknown — no benchmark yet |

**Rationale**: The token-awareness and repo-specific anti-patterns are essential. Impeccable
teaches universal design principles but cannot know that our `--primary` is neutral gray in one
app and blue in another, or that `#f6f8fa` appears hardcoded in our code block CSS. The
incremental effort to build a repo-specific skill is justified by the precision it provides.

**What we take from impeccable**:

| Concept | How We Adapt It |
| --- | --- |
| 7 reference modules | Create 5 reference docs covering our specific tokens and patterns |
| Anti-pattern library | Document repo-specific anti-patterns with actual code from our codebase |
| Context file (`.impeccable.md`) | Include brand context directly in `reference/brand-context.md` |
| `/audit` workflow | Build into `swe-ui-checker` agent as validation dimensions |
| `/critique` UX review | Include UX heuristics in skill's component-patterns reference |
| Measured quality vocabulary | Adopt structured design terminology (rhythm, hierarchy, measure) |

**What we intentionally leave out**: `/animate`, `/colorize`, `/bolder`, `/quieter`, `/delight`,
`/overdrive` — these are creative steering commands more suited to greenfield design than our
convention-driven approach. We focus on consistency and quality, not creative exploration.

### AD2: Shared Library Strategy — Two Packages vs. One vs. None

**Decision**: Create two Nx libraries: `libs/ts-ui-tokens` and `libs/ts-ui`.

**Trade-offs**:

| Factor | No Shared Lib (Status Quo) | One Monolithic Lib | Two Separate Libs (Chosen) |
| --- | --- | --- | --- |
| Token-only consumers | N/A — each app owns tokens | Must import all of ts-ui for just tokens | Import ts-ui-tokens alone |
| Nx caching | N/A | One cache key for everything | Tokens cached separately from components |
| Change frequency | N/A | Token change invalidates component cache | Token change only invalidates token consumers |
| Flutter/TanStack compat | N/A | Cannot use React lib | Can use token CSS vars without React |
| Complexity | Zero | Low | Moderate — two libs to maintain |
| Dependency graph | Flat | One edge per consumer | Two edges per consumer (tokens + components) |
| shadcn/ui model | "Copy and own" per app | Centrally governed | Centrally governed tokens, shared components |

**Why not keep status quo**: Token drift is already happening (neutral vs. blue primary). Without
a shared source, every new app starts from zero and diverges further.

**Why not one lib**: `demo-fe-dart-flutterweb` and `demo-fe-ts-tanstack-start` need tokens but
cannot use React components. Forcing them to depend on React would be wrong.

**Token package structure**:

```text
libs/ts-ui-tokens/
├── src/
│   ├── index.ts              # Barrel export for TypeScript consumers
│   ├── tokens.css            # @theme definitions — THE source of truth
│   │                         # Structural tokens: radius, spacing scale, typography
│   │                         # Brand-neutral base colors (background, foreground, border)
│   ├── colors.ts             # Color token constants for JS consumption
│   ├── spacing.ts            # Spacing scale constants (4pt system)
│   ├── typography.ts         # Type scale constants
│   └── radius.ts             # Border radius constants
├── project.json              # Nx config: build target only (no test, no lint)
├── tsconfig.json
├── package.json              # @open-sharia-enterprise/ts-ui-tokens
└── README.md
```

**Component package structure**:

```text
libs/ts-ui/
├── src/
│   ├── index.ts              # Barrel export
│   ├── components/
│   │   ├── button/
│   │   │   ├── button.tsx            # Component implementation
│   │   │   ├── button.variants.ts    # CVA variant definitions (importable separately)
│   │   │   ├── button.stories.tsx    # Storybook stories
│   │   │   └── button.test.tsx       # Unit tests with vitest-axe
│   │   ├── card/
│   │   ├── dialog/
│   │   ├── input/
│   │   ├── alert/
│   │   └── ...                       # 6 initial components (4 from intersection + 2 commonly needed)
│   ├── utils/
│   │   └── cn.ts             # Shared cn() utility (clsx + tailwind-merge)
│   └── hooks/
│       └── use-media-query.ts
├── .storybook/
│   ├── main.ts               # @storybook/nextjs-vite framework
│   └── preview.ts            # Imports tokens.css, configures themes
├── components.json           # shadcn/ui config pointing to this lib
├── vitest.config.ts          # Vitest config with vitest-axe setup
├── project.json              # Nx: build, test:unit, test:quick, storybook, lint
├── tsconfig.json
├── package.json              # @open-sharia-enterprise/ts-ui
└── README.md
```

### AD3: Token Reconciliation Strategy — Structural vs. Brand

**Decision**: Share **structural tokens** (radius, spacing, typography scale, base gray palette)
across all apps. Allow **brand tokens** (primary, accent, chart colors, sidebar colors) to be
overridden per app.

**Trade-offs**:

| Factor | Share Everything | Share Structure Only (Chosen) | Share Nothing |
| --- | --- | --- | --- |
| Consistency | Maximum — all apps look identical | Structural consistency, brand freedom | Zero consistency |
| Brand identity | Apps lose unique identity | Apps keep unique brand colors | Full brand freedom |
| Token count shared | ~25 tokens | ~10 structural tokens | 0 tokens |
| Override complexity | No overrides needed | Per-app color overrides in globals.css | N/A |
| Maintenance | One file for all tokens | One shared + per-app overrides | Per-app everything |

**Rationale**: organiclever-web is a business productivity app (neutral, professional).
ayokoding-web is an educational platform (blue, approachable). Forcing identical brand colors
would harm both products. But radius, spacing rhythm, and typography scale should be consistent
for shared component compatibility.

**Concrete token split**:

Shared (in `ts-ui-tokens/src/tokens.css`):

- `--radius`: `0.5rem` (base) with computed `--radius-md`, `--radius-sm`
- Spacing scale: 4pt system (`--space-1` through `--space-16`)
- Typography scale: `--text-xs` through `--text-4xl`
- Base neutrals: `--background`, `--foreground`, `--border`, `--input`, `--ring` (gray palette)
- Semantic: `--muted`, `--muted-foreground`, `--destructive`, `--destructive-foreground`

Per-app override (in app's `globals.css`):

- `--primary`, `--primary-foreground`
- `--secondary`, `--secondary-foreground`
- `--accent`, `--accent-foreground`
- `--chart-1` through `--chart-5` (organiclever-web only)
- `--sidebar-*` (ayokoding-web only)

### AD3b: Per-Project Customization at Scale

**Decision**: Design the shared UI kit for a growing monorepo where many projects will share
components but each project needs its own visual identity.

**Problem**: The monorepo already has 6+ frontend projects and will grow. Each project (OrganicLever
productivity tracker, AyoKoding educational platform, demo apps, future Sharia-compliant finance
apps) has a different audience, brand, and use case. A shared UI kit that cannot be customized
per-project will either: (a) force all projects to look identical, or (b) be abandoned as
projects fork their own components.

**Customization layers** (from most shared to most project-specific):

```text
Layer 1: Shared structural tokens (ts-ui-tokens)
  ├── Spacing scale (4pt system)
  ├── Typography scale (text-xs through text-4xl)
  ├── Border radius scale (radius, radius-md, radius-sm)
  ├── Base neutral palette (background, foreground, border)
  └── Semantic tokens (muted, destructive)

Layer 2: Per-project brand tokens (app's globals.css)
  ├── Primary + primary-foreground (brand color)
  ├── Secondary + secondary-foreground
  ├── Accent + accent-foreground
  └── Project-specific tokens (chart-*, sidebar-*, etc.)

Layer 3: Per-project component extensions (app's src/components/)
  ├── Local components that wrap shared components with project-specific behavior
  ├── Project-only components (Breadcrumb, TOC, SidebarTree for ayokoding-web)
  └── Project-specific variant additions

Layer 4: Per-project Tailwind configuration (app's globals.css)
  ├── @source directives (content scan paths)
  ├── @plugin directives (@tailwindcss/typography for ayokoding-web)
  ├── Custom @utility definitions
  └── App-specific @layer base styles
```

**How a new project customizes**:

1. **Import shared tokens**: `@import "@open-sharia-enterprise/ts-ui-tokens/tokens.css"` —
   gets spacing, typography, radius, neutrals
2. **Override brand tokens**: Add `@theme { --color-primary: hsl(150 60% 40%); }` in its own
   `globals.css` — gets a green brand without touching the shared lib
3. **Import shared components**: `import { Button, Card } from "@open-sharia-enterprise/ts-ui"` —
   components automatically use the project's brand tokens because they reference
   `bg-primary`, `text-primary-foreground`, etc. (CSS cascade)
4. **Extend with local components**: Create project-specific components in `src/components/`
   that compose shared components. Example: a `FinanceCard` that wraps `Card` with
   Sharia-compliance indicators.
5. **Add project-specific tokens**: Define `--sidebar-*`, `--chart-*`, or domain-specific
   tokens in the project's `globals.css`. These do not pollute the shared token package.

**Key design principle**: Shared components must NEVER reference hardcoded colors — only
semantic token names (`bg-primary`, `text-destructive`, etc.). This ensures CSS cascade
customization works. A component that says `bg-blue-500` cannot be customized per-project;
a component that says `bg-primary` inherits whatever `--color-primary` the project defines.

**Trade-offs**:

| Factor | Fully Themeable (Chosen) | Preset Themes | No Customization |
| --- | --- | --- | --- |
| New project onboarding | Import tokens + override brand | Pick a preset | Use as-is |
| Visual uniqueness | Full brand freedom | Limited to presets | All projects look identical |
| Component complexity | Semantic tokens only | Theme-switching logic | Simplest |
| Maintenance | Per-project globals.css | Theme registry | One globals.css |
| Compatibility | Any brand color works | Only tested presets work | N/A |

**Why not preset themes**: Presets (like "blue theme", "green theme") add a layer of indirection
that is unnecessary. CSS cascade already provides per-project theming — each project's
`globals.css` overrides the shared tokens. Adding a theme registry would violate Simplicity
Over Complexity.

**Why not no customization**: The monorepo serves multiple products with different audiences.
A Sharia-compliant finance app should not look like an educational coding platform. Visual
identity matters for product differentiation.

### AD4: Convention Documentation Location

**Decision**: Create `governance/development/frontend/` directory with four focused documents.

**Trade-offs**:

| Factor | One Big File | Four Focused Files (Chosen) | Inline in CLAUDE.md |
| --- | --- | --- | --- |
| Discoverability | One place to look | Must check index | Already loaded in context |
| Context window | Large single load | Load only what's needed | Always in context (bloat) |
| Maintenance | Merge conflicts | Independent editing | CLAUDE.md already large |
| Agent access | One read call | Multiple reads, or skill reference | Automatic |
| Reusability | Hard to reference specific section | Link to specific file | Cannot link subsections |

**Files and their scope**:

| File | Content | Approx. Lines |
| --- | --- | --- |
| `design-tokens.md` | Token categories, naming convention, the structural-vs-brand split, per-app override pattern, dark mode token requirements, when to create new tokens vs. reuse | 80-120 |
| `component-patterns.md` | CVA variant definitions, Radix primitive composition, cn() utility usage, slot/asChild pattern, React.ComponentProps pattern (not forwardRef), data-slot attributes, required state coverage list, component file structure | 100-150 |
| `accessibility.md` | WCAG AA compliance rules, focus-visible (not focus) requirement, reduced-motion support, aria attributes by component type, label requirements, color-contrast rules (APCA preferred), minimum hit targets (24px desktop, 44px mobile), form input requirements | 80-120 |
| `styling.md` | Tailwind v4 conventions (@theme, @layer, @custom-variant), utility-first approach (no @apply except in @layer base), class ordering via prettier-plugin-tailwindcss, no inline styles in production apps, no !important, defensive CSS patterns, container queries over breakpoints, mobile-first | 80-120 |

### AD5: UI Skill Architecture

**Decision**: Create a single skill `swe-developing-frontend-ui` with reference modules.

**Trade-offs**:

| Factor | Single Skill (Chosen) | Multiple Skills (one per domain) |
| --- | --- | --- |
| Context loading | One skill, selective reference reads | Multiple skills may all trigger |
| Maintenance | One SKILL.md to update | 5+ SKILL.md files |
| Coherence | Cross-cutting concerns in one place | Fragmented knowledge |
| Size | Larger SKILL.md (~200 lines) | Smaller individual files |
| Trigger precision | Broader match (any TSX/CSS) | Could scope per domain |

**SKILL.md frontmatter**:

```yaml
---
name: swe-developing-frontend-ui
description: UI development skill covering design token usage, shadcn/ui + Radix composition
  patterns, accessibility requirements, anti-patterns catalog, and brand context for
  OrganicLever and OSE Platform. Auto-loads when working on TSX components, CSS, or UI
  design tasks.
---
```

Note: Skills in this repository use only `name` and `description` in frontmatter. Auto-trigger
behavior is achieved via the description content matching the task context — not via `filePattern`
or `bashPattern` fields.

**Anti-pattern catalog** (repo-specific, with code examples):

| Anti-Pattern | Example From Our Codebase | Correct Approach |
| --- | --- | --- |
| Hardcoded hex in CSS | `background-color: #f6f8fa !important;` (ayokoding-web globals.css) | Use token: `bg-muted` or `var(--color-muted)` |
| `!important` in Tailwind | `color: #24292e !important;` (ayokoding-web globals.css, 10 occurrences) | Use `@layer` specificity or Tailwind modifiers |
| Font via `@layer utilities` | `font-family: Arial, Helvetica, sans-serif;` (organiclever-web) | Use `next/font` for optimization |
| Old Radix imports | `import { Slot } from "@radix-ui/react-slot"` | `import { Slot } from "radix-ui"` |
| forwardRef pattern | `React.forwardRef<HTMLButtonElement, Props>` | `function Button(props: React.ComponentProps<"button">)` |
| Missing data-slot | `<button className={...}>` | `<button data-slot="button" className={...}>` |
| Inline styles in production | `style={{ color: 'red' }}` | Use Tailwind utility: `className="text-destructive"` |
| Card inside Card | `<Card><Card>nested</Card></Card>` | Use spacing/dividers for hierarchy |
| Color-only status | `<span className="text-red-500">Error</span>` | Include text label + shape per [Accessibility First](../../../governance/principles/content/accessibility-first.md) |
| Unverified color contrast | Using arbitrary colors without checking WCAG AA contrast | Use semantic tokens with verified contrast, or verify new colors meet 4.5:1 (text) / 3:1 (UI) ratios |
| Missing focus-visible | `focus:ring-2` | `focus-visible:ring-2` (keyboard users only) |
| `transition: all` | `className="transition-all"` | `className="transition-colors"` (explicit properties) |
| bounce/elastic easing | `animate-bounce` | `animate-ease-out` or custom exponential easing |

### AD6: Agent Strategy — Full Maker-Checker-Fixer Trio + Quality Gate Workflow

**Decision**: Create the full agent trio (`swe-ui-maker`, `swe-ui-checker`, `swe-ui-fixer`)
plus a `ui-quality-gate` workflow in `governance/workflows/`.

**Trade-offs**:

| Factor | Checker Only | Full Trio + Workflow (Chosen) |
| --- | --- | --- |
| Effort | 1 agent | 3 agents + 1 workflow |
| Value | Identifies violations | Identifies, creates, AND fixes — full lifecycle |
| Risk | Low — read-only | Medium — fixer modifies TSX; mitigated by re-validation |
| Automation | Manual fix cycle | Automated quality gate with iteration control |
| Consistency | Depends on who fixes | Fixer applies fixes consistently per conventions |
| Precedent | N/A | Follows established pattern (docs, ayokoding-web, plans) |

**Rationale**: The repo already has successful maker-checker-fixer trios for docs, ayokoding-web
content, plans, specs, and README files. The pattern is proven. A UI fixer that modifies TSX is
higher-risk than a docs fixer, but the re-validation step (checker runs after fixer) catches
regressions. The quality gate workflow automates the iteration loop.

**Agent definitions**:

#### swe-ui-maker (Blue)

| Field | Value |
| --- | --- |
| Color | blue |
| Model | sonnet |
| Tools | Read, Write, Edit, Glob, Grep, Bash |
| Skills | swe-developing-frontend-ui, docs-applying-content-quality |

**Purpose**: Creates new UI components following all conventions — proper CVA variants, Radix
composition, data-slot attributes, unit tests with vitest-axe, Storybook stories, responsive
variants. Also creates component documentation and updates barrel exports.

**When to use**: Developer requests a new shared component, or needs to add variants/sizes to
an existing component.

#### swe-ui-checker (Green)

| Field | Value |
| --- | --- |
| Color | green |
| Model | sonnet |
| Tools | Read, Glob, Grep, Write, Bash |
| Skills | swe-developing-frontend-ui, repo-generating-validation-reports, repo-assessing-criticality-confidence, repo-applying-maker-checker-fixer |

**Purpose**: Validates UI components against all conventions. Produces audit reports in
`generated-reports/` with criticality/confidence classification.

**Check dimensions with severity**:

| Dimension | Checks | Severity |
| --- | --- | --- |
| Token compliance | Hardcoded hex/rgb/hsl in className, style props, CSS | HIGH — drift source |
| Accessibility | aria-*, role, focus-visible, labels, reduced-motion, contrast | HIGH — legal/compliance |
| Color contrast | Unverified WCAG AA contrast ratios, color-only status indicators | HIGH — accessibility violation |
| Component patterns | CVA usage, cn() calls, Radix primitives, data-slot | MEDIUM — consistency |
| Dark mode | All visual tokens have dark variants, no light-only colors | MEDIUM — user experience |
| Responsive | Mobile-first, viewport adaptations, 44px touch targets | MEDIUM — usability |
| Anti-patterns | All items from anti-pattern catalog | Varies by pattern |

**When to use**: Before merging UI changes, during periodic audits, or as part of the quality
gate workflow.

#### swe-ui-fixer (Yellow)

| Field | Value |
| --- | --- |
| Color | yellow |
| Model | sonnet |
| Tools | Read, Write, Edit, Glob, Grep, Bash |
| Skills | swe-developing-frontend-ui, repo-assessing-criticality-confidence, repo-applying-maker-checker-fixer, repo-generating-validation-reports |

**Purpose**: Applies validated fixes from `swe-ui-checker` audit reports. Re-validates each
finding before applying. Produces fix reports.

**Fix capabilities**:

| Finding Type | Auto-Fixable? | How |
| --- | --- | --- |
| Hardcoded hex in className | Yes | Replace with token-based Tailwind class |
| Missing aria-label | Yes | Add aria-label from component context |
| Missing data-slot | Yes | Add data-slot attribute |
| Old Radix import | Yes | Replace `@radix-ui/react-slot` with `radix-ui` |
| forwardRef → ComponentProps | Partial | Requires manual review for complex cases |
| Missing dark mode variant | Yes | Add `dark:` prefix with appropriate token |
| Missing focus-visible | Yes | Replace `focus:` with `focus-visible:` |
| Non-accessible color | Partial | Suggest replacement from accessible palette |

**When to use**: After `swe-ui-checker` produces a report, or as part of the quality gate
workflow.

### AD6b: Quality Gate Workflow

**Decision**: Create `governance/workflows/ui/ui-quality-gate.md` following the established
quality gate pattern.

**Workflow structure**:

```
1. Initial Validation (swe-ui-checker) → audit report
2. Check for Findings → if zero, confirmation check; if >0, proceed
3. Apply Fixes (swe-ui-fixer) → fix report
4. Re-validate (swe-ui-checker) → verification report
5. Iteration Control → loop or terminate
6. Finalization → pass/partial/fail
```

**Inputs**:

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| scope | string | all | Files/directories to validate |
| max-iterations | number | 10 | Maximum check-fix cycles |
| max-concurrency | number | 2 | Max concurrent agents |

**Outputs**:

| Name | Type | Description |
| --- | --- | --- |
| final-status | enum (pass/partial/fail) | Final quality gate result |
| iterations-completed | number | Cycles executed |
| final-report | file | Last audit report in generated-reports/ |

**Termination**: Zero findings on two consecutive validations (double-zero confirmation).

**Safety features**: Max-iterations cap, convergence monitoring, false-positive persistence,
scoped re-validation after fixes.

### AD7: Testing Strategy — Where to Put What

**Decision**: Layer UI quality checks into the existing three-level test pipeline.

**Trade-offs**:

| Test Type | In Unit Tests | In Integration Tests | In E2E Tests |
| --- | --- | --- | --- |
| axe-core a11y | Fast, component-level (Chosen) | Slower, needs browser | Slowest, full page |
| Visual regression | No browser, cannot screenshot | Can screenshot components | Full page screenshots (Chosen for pages) |
| Component interaction | JSDOM limitations | Real browser | Real browser + real backend |
| Execution speed | Milliseconds | Seconds | Seconds to minutes |
| CI cost | Low | Medium | High |

**Chosen allocation**:

| Level | UI Addition | Tool | What It Catches | Responsive |
| --- | --- | --- | --- | --- |
| Unit (`test:unit`) | axe-core a11y assertions | vitest-axe | Missing aria, roles, labels, contrast | N/A (JSDOM) |
| Integration (`test:integration`) | Component visual snapshots | Playwright `toHaveScreenshot()` | Unintended visual changes to individual components | 3 viewports per component |
| E2E (`test:e2e`) | Full-page visual regression | Playwright `toHaveScreenshot()` | Layout breaks, theme issues across full pages | 3 viewports per page |

**axe-core integration pattern** (using setup file for global extension):

```typescript
// libs/ts-ui/vitest.setup.ts
import 'vitest-axe/extend-expect';
```

```typescript
// libs/ts-ui/vitest.config.ts
export default defineConfig({
  test: {
    setupFiles: ['./vitest.setup.ts'],
  },
});
```

```typescript
// libs/ts-ui/src/components/button/button.test.tsx
import { axe } from 'vitest-axe';
import { render } from '@testing-library/react';
import { Button } from './button';

test('Button is accessible', async () => {
  const { container } = render(<Button>Click me</Button>);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});

test('Icon-only Button requires aria-label', async () => {
  const { container } = render(<Button size="icon" aria-label="Close"><XIcon /></Button>);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

Alternatively, use the inline import pattern: `import { toHaveNoViolations } from 'vitest-axe/matchers'`
and `expect.extend({ toHaveNoViolations })` per test file.

### AD8: Linting Rules — Targeted vs. Comprehensive

**Decision**: Add targeted ESLint rules, not a full custom plugin.

**Trade-offs**:

| Factor | jsx-a11y Only | jsx-a11y + Custom Token Rule (Chosen) | Full Custom Plugin |
| --- | --- | --- | --- |
| Effort | Install + configure | Install + write one custom rule | Build plugin package |
| Coverage | A11y only | A11y + token enforcement | A11y + tokens + patterns |
| Maintenance | Zero (community-maintained) | One rule to maintain | Full plugin lifecycle |
| False positives | Low (mature plugin) | Medium (regex-based detection) | Low (AST-based) |
| Adoption friction | Low | Low-medium | High |

**Why not Stylelint**: Our apps use Tailwind utility classes in TSX, not traditional CSS. The
only significant CSS file is `globals.css`, which is managed by the token system. The primary
enforcement point is in TSX files via ESLint. Adding Stylelint would mean a new tool in the
pipeline for minimal coverage.

**Custom token rule approach**: A regex-based ESLint rule that flags:

- `className="..."` containing `#[0-9a-fA-F]{3,8}` (hex colors in Tailwind arbitrary values)
- `style={{ ... }}` containing hex/rgb/hsl color values
- `className="..."` containing `text-\[#`, `bg-\[#`, `border-\[#` patterns

This is simpler than an AST-based approach and catches the most common violations. False
positives (e.g., hex in SVG data URIs) can be suppressed with eslint-disable comments.

### AD9: Class Ordering with Prettier

**Decision**: Add `prettier-plugin-tailwindcss` to the existing Prettier setup.

**Trade-offs**:

| Factor | No Class Ordering (Status Quo) | Prettier Plugin (Chosen) | ESLint Rule |
| --- | --- | --- | --- |
| Enforcement | None | Automatic on save + pre-commit | Manual fix required |
| Developer friction | Zero | Zero (automatic) | Must run fix command |
| Integration | N/A | Prettier already in pre-commit | ESLint already in pre-push |
| Diff noise | Inconsistent ordering across PRs | One-time reformat, then stable | Same as Prettier |
| Multi-app config | N/A | Need `tailwindStylesheet` per app | Need config per app |

**Configuration challenge**: The repo has multiple apps with different `globals.css` files.
`prettier-plugin-tailwindcss` accepts a single `tailwindStylesheet` path. Options:

1. **Single stylesheet** (simplest): Point to one app's `globals.css`. Other apps' classes still
   sort correctly because the plugin only needs to know the Tailwind configuration, not the exact
   token values. Token names are the same across apps.
2. **Per-app override** (precise): Use Prettier's `overrides` config to set different
   `tailwindStylesheet` per app directory.

**Chosen**: Option 1 (single stylesheet) initially, with option 2 if sorting issues arise.

**Configuration** (`.prettierrc.json`):

```json
{
  "printWidth": 120,
  "proseWrap": "preserve",
  "plugins": ["prettier-plugin-tailwindcss"],
  "tailwindStylesheet": "./apps/organiclever-web/src/app/globals.css"
}
```

### AD10: Storybook Scope — Library vs. Per-App

**Decision**: Configure Storybook in `libs/ts-ui/` (shared component library), not per-app.

**Trade-offs**:

| Factor | Per-App Storybook | Shared Lib Storybook (Chosen) | Both |
| --- | --- | --- | --- |
| What it documents | App-specific components + shared | Shared components only | Everything |
| Maintenance | N Storybook configs | 1 Storybook config | N+1 configs |
| Version conflicts | Each app pins own version | One version | Must align all |
| Build time | Slower (per-app builds) | Fast (one lib) | Slowest |
| Coverage | App-specific patterns visible | Only shared components | Full coverage |

**Rationale**: organiclever-web already has Storybook. Rather than maintaining two (or more)
Storybook instances, consolidate into the shared lib. App-specific components that need
documentation can be added to the shared Storybook via composition or documented in the app's
README.

**organiclever-web's existing Storybook**: Will be migrated to `libs/ts-ui/.storybook/` as
shared components are extracted. The app-level `.storybook/` can be removed once all stories
are moved.

## Technology Choices

| Need | Choice | Rationale | Alternatives Considered |
| --- | --- | --- | --- |
| Class ordering | prettier-plugin-tailwindcss | Prettier already in pre-commit | eslint-plugin-tailwindcss (manual fix) |
| A11y unit tests | vitest-axe | Vitest already used in all TS apps | jest-axe (Jest, not our runner) |
| A11y lint | eslint-plugin-jsx-a11y | ESLint already configured | axe-linter (VS Code only) |
| Visual regression | Playwright toHaveScreenshot() | Playwright already in E2E tests | Chromatic (SaaS, cost), Percy (SaaS, cost) |
| Component catalog | Storybook 10 | Already in organiclever-web | Ladle (less mature), React Cosmos (niche) |
| Component variants | CVA (already in use) | Type-safe, composable | Tailwind Variants (similar, less adopted) |
| Class utilities | cn() via clsx + tailwind-merge | Already the pattern | Only clsx (no merge), only tw-merge (no conditional) |
| Design tokens | CSS custom properties + Tailwind @theme | Already the pattern | Style Dictionary (overkill), Tokens Studio (Figma-dependent) |

## Migration Path — Detailed

### For organiclever-web

1. **Token extraction**: Copy structural token definitions from `globals.css` to
   `libs/ts-ui-tokens/src/tokens.css`. Keep brand-specific overrides (`--primary: 0 0% 9%`)
   in the app's `globals.css`.
2. **Import shared tokens**: Replace `@theme { ... }` block with
   `@import "@open-sharia-enterprise/ts-ui-tokens/tokens.css"` plus app-specific `@theme`
   overrides.
3. **Fix existing violations**: Replace `font-family: Arial` with `next/font` import. Remove
   the `@layer utilities { body { font-family: ... } }` block.
4. **Component extraction**: Move the 4 shared components (Alert, Button, Dialog, Input) to
   `libs/ts-ui/`. Update to use `radix-ui` unified import and `React.ComponentProps` pattern.
   Keep AlertDialog, Card, Label, Table as app-specific until other apps need them.
5. **Update imports**: Replace `@/components/ui/button` with
   `@open-sharia-enterprise/ts-ui/button` throughout the app.
6. **Remove duplicated code**: Delete `src/components/ui/button.tsx` (now in shared lib). Delete
   `src/lib/utils.ts` cn() function (now in shared lib).
7. **Migrate Storybook stories**: Move component stories to `libs/ts-ui/`. Update
   `.storybook/main.ts` to reference shared lib.
8. **Verify**: Run `nx run organiclever-web:test:quick` and `nx storybook ts-ui`.

### For ayokoding-web

1. **Token extraction**: Same as organiclever-web for structural tokens. Keep blue brand
   overrides (`--primary: 221.2 83.2% 53.3%`) and sidebar tokens in app's `globals.css`.
2. **Fix existing violations**: Replace hardcoded hex colors (8 occurrences of 3 unique values) in code block CSS with token
   references or CSS variables. Replace `!important` declarations with `@layer` specificity
   management.
3. **Import shared tokens**: Same pattern as organiclever-web.
4. **Component extraction**: Move shared components (Alert, Button, Dialog, Input) to shared
   lib. Keep content-specific components (Breadcrumb, Footer, Header, LanguageSwitcher,
   MobileNav, Sidebar, SidebarTree, ThemeToggle, TOC) as app-specific.
5. **Update imports**: Replace `src/components/ui/button` with shared lib import.
6. **Keep typography plugin**: `@plugin "@tailwindcss/typography"` stays in app's `globals.css`
   since it's content-specific.
7. **Verify**: Run `nx run ayokoding-web:test:quick`.

### For demo-fe-ts-nextjs

1. **Add Tailwind v4**: Install `@tailwindcss/postcss` and `@tailwindcss/vite`. Create
   `globals.css` importing shared tokens.
2. **Replace inline styles**: Convert `src/components/layout/AppShell.tsx`,
   `src/components/layout/Header.tsx`, `src/components/layout/Sidebar.tsx` from inline styles
   to Tailwind utility classes.
3. **Replace `useBreakpoint()` hook**: Use Tailwind responsive prefixes (`md:`, `lg:`) instead
   of JavaScript breakpoint detection.
4. **Import shared components**: Use Button, Card, etc. from `@open-sharia-enterprise/ts-ui`
   where appropriate.
5. **Verify**: Run `nx run demo-fe-ts-nextjs:test:quick`.

### For demo-fs-ts-nextjs

1. Same approach as demo-fe-ts-nextjs (minimal styling, add tokens + shared components).

### For demo-fe-dart-flutterweb (limited scope)

1. **Token consumption only**: Generate a `tokens.dart` file from `ts-ui-tokens/src/tokens.css`
   (manual or script). Flutter cannot consume CSS vars directly.
2. **No component sharing**: Flutter uses Material 3 — React components are not applicable.
3. **Structural alignment**: Use same radius, spacing scale values in `ThemeData`.

## Governance Alignment

Every architecture decision in this plan traces to one or more governance principles:

| AD | Primary Principle | How It Aligns |
| --- | --- | --- |
| AD1 (Repo-specific skill) | Explicit Over Implicit | Skill references our actual tokens explicitly, not generic guidance |
| AD2 (Two packages) | Simplicity Over Complexity | Each lib has one clear purpose; no monolithic abstraction |
| AD3 (Structural vs. brand) | Accessibility First | Shared tokens enforce consistent contrast ratios and dark mode |
| AD4 (Convention docs) | Documentation First | Conventions documented before code exists |
| AD5 (Single skill) | Simplicity Over Complexity | One skill over fragmented five; minimum viable approach |
| AD6 (Full agent trio + workflow) | Automation Over Manual | Full maker-checker-fixer lifecycle with automated quality gate |
| AD7 (Testing layers) | Three-Level Testing Standard | axe-core maps to unit, visual regression to integration/E2E |
| AD8 (Targeted lint) | Automation Over Manual | Automated enforcement in CI; developer does not need to remember rules |
| AD9 (Prettier plugin) | Automation Over Manual | Class ordering happens automatically on save; zero friction |
| AD10 (Shared Storybook) | Progressive Disclosure | Stories layer from default → variants → advanced patterns |

### Color Accessibility Compliance

The [Accessibility First](../../../governance/principles/content/accessibility-first.md) principle
requires WCAG AA compliance for all visual elements.

**Important scope distinction**: The [Color Accessibility Convention](../../../governance/conventions/formatting/color-accessibility.md)
defines a 5-color palette for **documentation** (Mermaid diagrams, agent categorization, markdown
visuals). It explicitly states that **UI application interface colors are out of scope**. UI
applications can and should use a full color spectrum — any color is acceptable as long as it
meets WCAG AA contrast requirements and is accessible to color-blind users.

**What the Accessibility First principle requires for UI**:

- **All color tokens** must produce WCAG AA contrast ratios against their backgrounds:
  4.5:1 for normal text, 3:1 for large text (18pt+) and UI components
- **Both light and dark modes** must be verified — a color that passes in light mode may fail
  in dark mode or vice versa
- **Per-project brand overrides** must maintain contrast — when a new project defines
  `--color-primary: hsl(150 60% 40%)`, it must be verified against `--color-background`
- **Never rely on color alone** — status indicators must include text labels and/or shapes
- **Color-blind simulation** — new color palettes should be tested with color blindness
  simulators (protanopia, deuteranopia, tritanopia) to verify distinguishability

**What UI apps are NOT required to do**:

- Use only the 5-color documentation palette — that restriction applies to diagrams and docs
- Avoid specific hues (red, green) — any hue is fine if contrast is sufficient and information
  is not conveyed by color alone

**Enforcement chain**:

1. **Conventions** (Phase 1): `accessibility.md` documents WCAG AA contrast rules for UI tokens
2. **Skill** (Phase 1): Anti-pattern catalog flags color-only status indicators and unverified
   contrast
3. **Agent** (Phase 1): `swe-ui-checker` validates token-on-background contrast ratios
4. **Lint** (Phase 3): `eslint-plugin-jsx-a11y` catches missing labels and aria attributes
5. **Tests** (Phase 3): `vitest-axe` catches contrast and semantic violations at unit test time
