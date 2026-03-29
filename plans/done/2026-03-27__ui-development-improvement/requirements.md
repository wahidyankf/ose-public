# Requirements: UI Development Improvement

## Problem Statement

The monorepo has multiple frontend applications with no shared UI infrastructure. Design tokens
are duplicated with divergent values, component patterns differ across apps, and there is no
automated enforcement of design quality, accessibility, or consistency. AI agents lack
UI-specific knowledge to assist with frontend development effectively.

## Current State

### Design Tokens — Detailed Analysis

Both `organiclever-fe` and `ayokoding-web` define CSS custom properties in `globals.css`, but
with architecturally different approaches:

**organiclever-fe** uses **double indirection**:

```css
/* @theme block defines Tailwind aliases pointing to bare HSL variables */
@theme {
  --color-background: hsl(var(--background));
  --color-primary: hsl(var(--primary));
}
/* Actual values live in :root and .dark selectors */
:root {
  --primary: 0 0% 9%;
}
.dark {
  --primary: 0 0% 98%;
}
```

**ayokoding-web** uses **direct values** in `@theme`:

```css
@theme {
  --color-background: hsl(0 0% 100%);
  --color-primary: hsl(221.2 83.2% 53.3%);
}
.dark {
  --color-primary: hsl(217.2 91.2% 59.8%);
}
```

**Consequences of divergence**:

- organiclever-fe tokens are neutral (grayscale primary) — business/productivity brand
- ayokoding-web tokens are blue-tinted — educational/tech brand
- Different token formats mean you cannot copy-paste between apps
- organiclever-fe has chart tokens (chart-1 through chart-5) that ayokoding-web lacks
- ayokoding-web has sidebar tokens (8 extra) that organiclever-fe lacks
- ayokoding-web includes `@plugin "@tailwindcss/typography"` and rehype-pretty-code CSS;
  organiclever-fe does not
- ayokoding-web has `@source` directive; organiclever-fe does not
- ayokoding-web uses hardcoded hex colors (`#f6f8fa`, `#24292e`, `#e1e4e8`) for code blocks
  — violating the token principle

### Components — Detailed Comparison

Both apps use shadcn/ui (new-york style) with Radix UI primitives, but component
implementations have diverged:

| Component    | organiclever-fe | ayokoding-web | Shared?                   |
| ------------ | --------------- | ------------- | ------------------------- |
| Alert        | Yes             | Yes           | Different implementations |
| AlertDialog  | Yes             | No            | organiclever-only         |
| Badge        | No              | Yes           | ayokoding-only            |
| Button       | Yes (4 sizes)   | Yes (8 sizes) | Different — see README    |
| Card         | Yes             | No            | organiclever-only         |
| Command      | No              | Yes           | ayokoding-only            |
| Dialog       | Yes             | Yes           | Different implementations |
| DropdownMenu | No              | Yes           | ayokoding-only            |
| Input        | Yes             | Yes           | Different implementations |
| Label        | Yes             | No            | organiclever-only         |
| ScrollArea   | No              | Yes           | ayokoding-only            |
| Separator    | No              | Yes           | ayokoding-only            |
| Sheet        | No              | Yes           | ayokoding-only            |
| Table        | Yes             | No            | organiclever-only         |
| Tabs         | No              | Yes           | ayokoding-only            |
| Tooltip      | No              | Yes           | ayokoding-only            |

**Union**: 16 unique components across both apps
**Intersection**: 4 components present in both (Alert, Button, Dialog, Input)
**Non-overlapping**: 12 components exist in only one app

**Radix UI import pattern divergence**:

- organiclever-fe: `import { Slot } from "@radix-ui/react-slot"` (individual packages)
- ayokoding-web: `import { Slot } from "radix-ui"` (unified package, newer approach)

**Component pattern divergence**:

- organiclever-fe: `React.forwardRef` pattern (older, more boilerplate)
- ayokoding-web: Direct function with `React.ComponentProps<"element">` (newer, cleaner)

### Demo Frontends

- **demo-fe-ts-nextjs**: Uses inline styles with a custom `useBreakpoint()` hook for responsive
  design. Components: `AppShell`, `Header`, `Sidebar` in `src/components/layout/`. No design
  system at all — entirely self-contained.
- **demo-fe-dart-flutterweb**: Flutter Material 3 theme with Dart `ThemeData`. Entirely separate
  ecosystem — cannot share React components but could consume CSS tokens via generated Dart
  constants.
- **demo-fe-ts-tanstack-start**: Minimal styling, early stage.
- **demo-fs-ts-nextjs**: Minimal styling, uses TypeScript interfaces for data layer.

### AI Assistance — Current State

- **Vercel `frontend-design` plugin**: Enabled in `.claude/settings.json`. Provides generic
  design guidance (avoid AI slop, use proper typography, etc.) but knows nothing about our
  specific tokens, components, or brand.
- **Vercel `react-best-practices`**: Auto-triggers after TSX edits with quality checklist for
  hooks, a11y, performance, TypeScript patterns.
- **Vercel `shadcn`**: Available for shadcn/ui component guidance.
- **No repo-specific UI skill**: No skill references our actual `--color-primary`,
  `--color-destructive`, or other token values. No skill documents our CVA variant patterns or
  Radix composition approach.

### Testing — Current State

- **Unit tests**: Vitest in organiclever-fe and demo-fe-ts-nextjs; no a11y assertions
- **E2E tests**: Playwright in organiclever-fe-e2e and demo-fe-e2e; no visual regression
- **Storybook**: Only in organiclever-fe with `@storybook/nextjs-vite` framework; stories exist
  for Alert, AlertDialog, Button, Card, Dialog, Input, Label, Table
- **No axe-core integration anywhere**
- **No `toHaveScreenshot()` usage anywhere**

### Linting — Current State

- **ESLint**: `next/core-web-vitals` + `next/typescript` via `FlatCompat` in both Next.js apps.
  No `jsx-a11y` plugin configured.
- **Prettier**: `.prettierrc.json` with `printWidth: 120` and `proseWrap: preserve`. No
  `prettier-plugin-tailwindcss` — Tailwind classes are unsorted.
- **No Stylelint**: Not installed, not configured.

## Gaps — Detailed

### G1: No Shared Design Token Source of Truth

**What exists**: Two independent `globals.css` files with similar-but-different token values.

**Impact**: A developer changing the border radius in organiclever-fe has no mechanism to
propagate that change to ayokoding-web. Token values drift silently. New apps
(demo-fe-ts-nextjs, demo-fs-ts-nextjs) start from scratch with no tokens at all.

**Complication**: The two apps have genuinely different brand colors (neutral vs. blue) — tokens
cannot be blindly unified. The shared layer must provide structural tokens (radius, spacing,
typography scale) and allow per-app color overrides.

### G2: No Shared Component Library

**What exists**: 16 unique shadcn/ui components across two apps, with only 4 overlapping.
The 4 overlapping components have different implementations (different Radix imports, different
component patterns, different variant sets).

**Impact**: A bug fix in ayokoding-web's Button (e.g., the `aria-invalid` handling) does not
propagate to organiclever-fe. Adding a new variant requires changes in multiple places.

**Complication**: shadcn/ui's model is "copy to your project and own the code." Extracting to a
shared lib changes this model — the shared lib becomes a governed package rather than per-app
owned code. This tension must be managed explicitly (see trade-offs in tech-docs.md).

### G3: No AI UI Development Skill

**What exists**: Three Vercel plugins (frontend-design, react-best-practices, shadcn) providing
generic guidance.

**Impact**: When an AI agent generates a new component, it does not know to use
`hsl(var(--primary))` vs. `hsl(221.2 83.2% 53.3%)`, which Radix import style to use, whether
to use `React.forwardRef` or `React.ComponentProps`, or what size variants are standard.

**Complication**: The skill must be opinionated enough to provide useful guidance but flexible
enough to accommodate different brand palettes across apps.

### G4: No UI Conventions Documentation

**What exists**: No files in `governance/development/` address frontend UI conventions.

**Impact**: New developers (human or AI) have no reference for:

- Which token to use for a given purpose (e.g., `--muted` vs. `--secondary` for backgrounds)
- When to create a new component vs. composing existing ones
- What states a component must support (hover, focus, active, disabled, loading, error, success)
- Whether to use `@apply` or utility classes (answer: utility classes, except in `@layer base`)
- How to handle dark mode (token-based automatic vs. explicit `dark:` prefixes)

### G5: No Color Accessibility Verification for UI Components

**What exists**: The repo has a [Color Accessibility Convention](../../../governance/conventions/formatting/color-accessibility.md)
with a 5-color accessible palette for **documentation** (diagrams, Mermaid, agent categorization)
and an [Accessibility First](../../../governance/principles/content/accessibility-first.md)
principle requiring WCAG AA compliance.

**Scope clarification**: The Color Accessibility Convention explicitly states that **UI design
application interface colors are out of scope** — they are covered by app-specific design docs.
UI applications are NOT limited to the 5-color documentation palette. Applications can and
should use a full color spectrum as long as all colors meet WCAG AA contrast requirements and
are accessible to color-blind users.

**The actual gap**: There is no mechanism to verify that UI component colors — whether from
design tokens, Tailwind utilities, or custom CSS — meet WCAG AA contrast requirements. The
Accessibility First principle applies, but enforcement is missing.

**Specific issues**:

- Chart tokens in organiclever-fe (`--chart-1` through `--chart-5`) have not been verified
  for WCAG AA contrast against their background colors
- No mechanism to verify that semantic tokens (`--destructive`, `--primary`) produce WCAG AA
  contrast ratios in both light and dark modes
- No mechanism to verify that per-project brand color overrides maintain sufficient contrast
- Components can use arbitrary Tailwind colors without any contrast verification
- No color-blind simulation testing for UI components (only for documentation diagrams)

### G6: No Automated Design Enforcement (General)

**What exists**: ESLint with `next/core-web-vitals` only. No a11y linting. No token enforcement.

**Impact**: Hardcoded hex colors can be introduced without any CI failure. Missing `alt`
attributes, `aria-label`, or `<label>` elements are not caught. Tailwind class order is
inconsistent across files.

**Specific violations currently in codebase**:

- ayokoding-web `globals.css` has hardcoded hex colors (`#f6f8fa`, `#24292e`, `#e1e4e8`) for
  code block styling
- ayokoding-web `globals.css` uses `!important` declarations (10 occurrences)
- organiclever-fe body font is `Arial, Helvetica, sans-serif` set via `@layer utilities` —
  should be configured via `next/font` for optimization

### G7: No Visual Regression Testing

**What exists**: Playwright configured for E2E testing but no `toHaveScreenshot()` usage.

**Impact**: CSS changes can unintentionally alter component appearance with no automated
detection. The only safety net is manual visual review.

### G8: No UI-Focused Agent Trio or Quality Gate Workflow

**What exists**: No agents in `.claude/agents/` for UI creation, validation, or fixing. No
workflow in `governance/workflows/` for UI quality automation.

**Impact**: No automated way to audit existing components against conventions. No automated
way to create new components following all conventions. No iterative quality gate for UI changes.
The maker-checker-fixer pattern is well-established in this repo for docs, ayokoding-web content,
plans, and specs — but completely missing for UI code.

**What other domains have**: docs (docs-maker/checker/fixer + quality-gate), ayokoding-web
(general-maker/checker/fixer + quality-gate), plans (plan-maker/checker/fixer + quality-gate),
specs (specs-maker/checker/fixer). UI has zero coverage.

## Acceptance Criteria

### Phase 1: Conventions + Skills

```gherkin
Feature: UI Conventions and AI Skills

  Background:
    Given the monorepo has frontend apps organiclever-fe, ayokoding-web, and demo-fe-ts-nextjs
    And the governance directory exists at governance/development/

  Scenario: UI conventions are documented with concrete examples
    When I check governance/development/frontend/
    Then I find documented conventions for:
      | Convention | File | Must Include |
      | Design tokens | design-tokens.md | Token categories, naming rules, per-app override pattern, dark mode |
      | Component patterns | component-patterns.md | CVA variants, Radix composition, cn(), state coverage |
      | Accessibility | accessibility.md | WCAG AA rules, focus-visible, reduced-motion, hit targets |
      | Styling | styling.md | Tailwind v4 patterns, class ordering, defensive CSS |
    And each convention file includes concrete code examples (not just prose)
    And each convention file references the actual token names from our globals.css

  Scenario: Repo-specific UI skill references actual codebase patterns
    Given the .claude/skills/ directory
    When I check for swe-developing-frontend-ui/SKILL.md
    Then the skill references our actual CSS custom properties by name
    And the skill documents both token formats (indirection vs. direct)
    And the skill lists at least 13 repo-specific anti-patterns with code examples (matching AD5 catalog)
    And the skill includes brand context for each app (audience, personality, tone)
    And the skill has reference modules in a reference/ subdirectory

  Scenario: UI checker agent validates components against conventions
    Given a TypeScript frontend component exists in organiclever-fe
    When the swe-ui-checker agent runs against it
    Then it produces a report in generated-reports/ covering:
      | Dimension | What It Checks | Example Violation |
      | Token compliance | No hardcoded colors, spacing, or radii | color: '#ff0000' in className |
      | Accessibility | aria-*, role, focus-visible, reduced-motion | Missing aria-label on icon button |
      | Color contrast | WCAG AA contrast ratios, color-only indicators | Text below 4.5:1 contrast ratio |
      | Component patterns | CVA variants, cn() usage, Radix primitives | Inline style instead of cn() |
      | Dark mode | All visual tokens have dark mode variants | Missing dark: prefix on bg |
      | Responsive | Container queries, mobile-first patterns | Desktop-only layout with no mobile breakpoints |
      | Anti-patterns | Known bad patterns from catalog | Nested Card inside Card |
    And the report uses the criticality/confidence classification system

  Scenario: Color accessibility is verified for UI components
    Given the Accessibility First principle requires WCAG AA compliance
    And UI applications can use any colors (not limited to the 5-color doc palette)
    When a component uses a color token or Tailwind color class
    Then vitest-axe catches contrast violations in unit tests
    And the swe-ui-checker agent verifies color-on-background contrast meets WCAG AA
    And the checker flags color-only status indicators (must include text label or shape)
    And new brand color overrides are verified for contrast in both light and dark modes

  Scenario: Components are responsive across all device sizes
    Given a shared component from ts-ui is rendered
    When viewed at mobile viewport (375px), tablet (768px), and desktop (1280px)
    Then the component adapts its layout appropriately at each breakpoint
    And no content is hidden or inaccessible at any viewport size
    And touch targets meet the 44px minimum on mobile viewports
    And visual regression tests capture screenshots at all three viewport sizes

  Scenario: UI maker agent creates components following all conventions
    Given the swe-ui-maker agent is invoked to create a new Badge component
    When the agent completes
    Then libs/ts-ui/src/components/badge/ contains:
      | File | Content |
      | badge.tsx | CVA variants, data-slot, React.ComponentProps, radix-ui import |
      | badge.variants.ts | Exportable variant definitions |
      | badge.test.tsx | Unit tests with vitest-axe accessibility assertions |
      | badge.stories.tsx | Storybook stories for all variants and viewports |
    And the component uses only design tokens (no hardcoded colors)
    And the barrel export in libs/ts-ui/src/index.ts is updated

  Scenario: UI quality gate workflow achieves zero findings
    Given the ui-quality-gate workflow is invoked for libs/ts-ui/
    When the swe-ui-checker finds violations in existing components
    Then the swe-ui-fixer applies validated fixes
    And the swe-ui-checker re-validates the fixed files
    And the workflow iterates until zero findings on two consecutive checks
    And the final status is "pass"

  Scenario: UI fixer re-validates before applying changes
    Given the swe-ui-checker reports a "hardcoded hex color" finding
    When the swe-ui-fixer processes the audit report
    Then it re-reads the file to verify the finding still exists
    And only applies the fix if the finding is confirmed
    And skips findings classified as FALSE_POSITIVE

  Scenario: Prettier sorts Tailwind classes deterministically
    Given prettier-plugin-tailwindcss is installed with tailwindStylesheet configured
    When a TSX file with unsorted Tailwind classes is staged
    Then the pre-commit hook sorts classes into Tailwind's canonical order
    And the sorted output is deterministic across developer machines
```

### Phase 2: Shared Library

```gherkin
Feature: Shared UI Library

  Background:
    Given libs/ts-ui-tokens/ exists as an Nx library
    And libs/ts-ui/ exists as an Nx library

  Scenario: Design tokens are centralized with per-app overrides
    When organiclever-fe imports tokens from ts-ui-tokens
    Then it receives structural tokens (radius, spacing scale, typography)
    And it can override brand tokens (primary, accent) in its own globals.css
    And no structural token definitions are duplicated in app globals.css

  Scenario: Token changes propagate through the dependency graph
    Given organiclever-fe depends on ts-ui-tokens
    When I change --radius from 0.5rem to 0.375rem in ts-ui-tokens
    And I run nx affected -t build
    Then organiclever-fe rebuilds with the new radius value
    And the Nx dependency graph shows ts-ui-tokens → organiclever-fe

  Scenario: Shared components use the unified Radix import pattern
    Given libs/ts-ui/ exports a Button component
    When I inspect the import statements
    Then it uses the radix-ui unified package (not @radix-ui/react-slot)
    And it uses React.ComponentProps pattern (not React.forwardRef)
    And it includes data-slot attributes for testing and styling

  Scenario: App-specific components extend shared components
    Given organiclever-fe needs a chart-specific Button variant
    When it creates a local ChartButton component
    Then ChartButton imports and wraps Button from @open-sharia-enterprise/ts-ui
    And the local variant uses tokens from ts-ui-tokens
    And the shared Button is not modified

  Scenario: Demo frontends adopt shared tokens
    Given demo-fe-ts-nextjs depends on ts-ui-tokens
    When it renders components
    Then it uses design tokens from ts-ui-tokens via Tailwind utility classes
    And inline styles from src/components/layout/ are replaced

  Scenario: A new project customizes the shared UI kit
    Given a new Next.js project "finance-web" is added to the monorepo
    When it imports ts-ui-tokens and creates a globals.css with:
      | Line | Content |
      | 1 | @import "@open-sharia-enterprise/ts-ui-tokens/tokens.css" |
      | 2 | @theme { --color-primary: hsl(150 60% 40%); } |
    And it imports Button from @open-sharia-enterprise/ts-ui
    Then the Button renders with a green primary color (not blue or neutral)
    And the spacing, radius, and typography match all other projects
    And no changes were needed in ts-ui-tokens or ts-ui

  Scenario: Shared components use only semantic tokens
    Given libs/ts-ui/ exports components
    When I grep for hardcoded Tailwind color classes (e.g., "blue-500", "red-500")
    Then zero matches are found in component source files
    And all color references use semantic tokens (primary, destructive, muted, etc.)
    And CSS cascade enables per-project theming automatically

  Scenario: Shared components have Gherkin specs and step definitions
    Given specs/libs/ts-ui/gherkin/ contains .feature files for each shared component
    When I run nx run ts-ui:test:unit
    Then Gherkin step definitions execute via @amiceli/vitest-cucumber
    And behavior tests (from specs) pass with mocked dependencies
    And UI-specific tests (axe-core, variant rendering) pass alongside Gherkin tests
    And both test types contribute to the ts-ui coverage threshold

  Scenario: Build and test pass after migration
    When I run nx affected -t typecheck lint test:quick build
    Then all targets pass for organiclever-fe, ayokoding-web, and demo-fe-ts-nextjs
    And no app has duplicate token definitions in its globals.css
```

### Phase 3: Automated Enforcement

```gherkin
Feature: Automated UI Quality Enforcement

  Scenario: ESLint catches accessibility violations in TSX
    Given eslint-plugin-jsx-a11y is configured in ESLint flat config
    When a TSX file has an <img> without alt attribute
    Then nx run organiclever-fe:lint reports a jsx-a11y/alt-text error
    And the error message includes remediation guidance

  Scenario: ESLint catches hardcoded design values
    Given the custom no-hardcoded-colors rule is active
    When a TSX file contains className="text-[#ff0000]"
    Then ESLint reports an error: "Use a design token instead of hardcoded color"
    And when a TSX file contains style={{ color: '#ff0000' }}
    Then ESLint reports an error: "Use Tailwind utility with design token"

  Scenario: Unit tests verify accessibility with axe-core
    Given vitest-axe is configured in ts-ui's vitest setup file
    When the Button component renders with all variant combinations
    Then axe-core finds no WCAG AA violations
    And when a component is missing an accessible name
    Then the unit test fails with a specific axe rule violation

  Scenario: Visual regression catches unintended component changes
    Given baseline screenshots exist for shared components
    When a CSS change alters the Button's border-radius
    Then Playwright's toHaveScreenshot() fails
    And a diff image shows the pixel-level change
    And the developer can update baselines with --update-snapshots

  Scenario: Pre-push hook catches all new violations
    When a developer pushes code with a new a11y violation
    Then the pre-push hook runs nx affected -t lint test:quick
    And the push is blocked with a clear error message
```

### Phase 4: Component Catalog

```gherkin
Feature: Component Catalog

  Scenario: All shared components have Storybook stories
    Given libs/ts-ui/ exports N components
    When I check for .stories.tsx files
    Then every exported component has at least one story file
    And each story file includes: default state, all variants, dark mode, disabled state
    And the Storybook sidebar groups components by category

  Scenario: Storybook shows accessibility status inline
    Given @storybook/addon-a11y is configured
    When I view a component story
    Then the accessibility panel shows axe-core results
    And violations are highlighted with element outlines
    And each violation links to remediation documentation

  Scenario: Component documentation is self-contained
    Given a new developer opens nx storybook ts-ui
    When they browse the Button component
    Then they see: description, props table, variant gallery, do/don't examples
    And they can copy-paste usage code from the docs panel
    And dark mode toggle shows the component in both themes
```
