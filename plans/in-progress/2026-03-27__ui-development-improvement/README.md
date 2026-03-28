# Plan: UI Development Improvement

**Status**: In Progress
**Created**: 2026-03-27
**Updated**: 2026-03-28

## Overview

UI development across the monorepo lacks shared infrastructure, automated quality enforcement,
and AI-assisted design guidance. Each frontend app (`organiclever-web`, `ayokoding-web`,
`demo-fe-ts-nextjs`) independently maintains its own components, tokens, and patterns — leading
to drift, duplication, and inconsistent quality.

This plan introduces a layered UI development improvement strategy:

1. **Shared design tokens and component library** as Nx libs
2. **AI skills and agents** for UI quality automation (inspired by
   [impeccable.style](https://impeccable.style))
3. **Conventions and linting** for programmatic design system enforcement
4. **Visual and accessibility testing** integrated into the existing three-level test pipeline

**Git Workflow**: Commit to `main` (Trunk Based Development) — one concern per commit

## Quick Links

- [Requirements](./requirements.md) — Current state analysis, gaps, and acceptance criteria
- [Technical Documentation](./tech-docs.md) — Architecture decisions, trade-offs, and
  implementation approach
- [Delivery Plan](./delivery.md) — Phased checklist and validation steps
- [Research Notes](./research.md) — External research findings informing this plan

## Current State Summary

| App | Styling | UI Library | Design Tokens | Storybook | Token Format |
| --- | --- | --- | --- | --- | --- |
| `organiclever-web` | Tailwind v4 | shadcn/ui + Radix | CSS vars in globals.css | Yes | `hsl(var(--name))` indirection |
| `ayokoding-web` | Tailwind v4 | shadcn/ui + Radix | CSS vars in globals.css | No | Direct `hsl(H S% L%)` values |
| `demo-fe-ts-nextjs` | Inline styles | None | None | No | N/A |
| `demo-fe-dart-flutterweb` | Flutter themes | Material 3 | ThemeData | N/A | Dart constants |
| `demo-fe-ts-tanstack-start` | (minimal) | None | None | No | N/A |
| `demo-fs-ts-nextjs` | (minimal) | None | None | No | N/A |

### Token Divergence (Specific Examples)

| Token | organiclever-web (light) | ayokoding-web (light) | Divergent? |
| --- | --- | --- | --- |
| `--primary` | `0 0% 9%` (neutral black) | `221.2 83.2% 53.3%` (blue) | Yes — different brand |
| `--foreground` | `0 0% 3.9%` (near-black) | `222.2 84% 4.9%` (dark navy) | Yes — hue differs |
| `--border` | `0 0% 89.8%` (gray) | `214.3 31.8% 91.4%` (blue-gray) | Yes — hue differs |
| `--radius` | `0.5rem` | `0.5rem` | No |
| sidebar tokens | None | 8 sidebar-specific tokens | Yes — ayokoding-only |
| chart tokens | 5 chart colors | None | Yes — organiclever-only |

### Component Divergence (Button)

| Aspect | organiclever-web | ayokoding-web |
| --- | --- | --- |
| Import | `@radix-ui/react-slot` | `radix-ui` (new unified package) |
| Pattern | `React.forwardRef` | Function component with `React.ComponentProps` |
| Size variants | 4 (default, sm, lg, icon) | 8 (+xs, icon-xs, icon-sm, icon-lg) |
| Data attributes | None | `data-slot`, `data-variant`, `data-size` |
| Dark mode | Implicit via tokens | Explicit dark: prefixes in variant classes |
| SVG handling | None | Auto-sizing `[&_svg:not([class*='size-'])]:size-4` |
| Focus style | `focus-visible:ring-1` | `focus-visible:ring-[3px]` + border |
| Aria invalid | None | `aria-invalid:border-destructive` |

## Key Gaps

1. **G1: No shared design token source of truth** — each app maintains its own `globals.css`;
   tokens drift independently; different HSL values for same semantic names
2. **G2: No shared component library** — shadcn/ui components copied independently; Button alone
   has 12+ differences between apps
3. **G3: No AI UI development skill** — Vercel `frontend-design` plugin is generic; no
   repo-specific knowledge of our tokens, brand, or patterns
4. **G4: No UI conventions documented** — no governance documents for tokens, components, color,
   typography, spacing, dark mode, animation, accessibility
5. **G5: No color accessibility verification** — UI apps can use any colors (not limited to
   the 5-color doc palette) but there is no mechanism to verify WCAG AA contrast compliance
6. **G6: No automated design enforcement** — no ESLint a11y rules, no token-usage lint, no
   `prettier-plugin-tailwindcss` for class ordering
7. **G7: No visual regression testing** — Playwright available but not configured for visual
   comparisons across viewport sizes (mobile, tablet, desktop)
8. **G8: No UI-focused agent** — no maker-checker-fixer agent for UI component quality

## Phases

| Phase | Focus | Scope | Key Trade-off |
| --- | --- | --- | --- |
| 1 | Conventions + Skills + Agents | Document UI conventions; create AI skill + agent trio + quality gate workflow | Knowledge before infrastructure |
| 2 | Shared Library | Extract tokens and components into `libs/` | Coupling vs. consistency |
| 3 | Automated Enforcement | ESLint rules, a11y tests, visual regression | Strictness vs. velocity |
| 4 | Component Catalog | Storybook/component docs | Maintenance cost vs. discoverability |

## Governance Alignment

This plan implements and respects the following governance layers:

### Principles Implemented

| Principle | How This Plan Implements It |
| --- | --- |
| [Accessibility First](../../../governance/principles/content/accessibility-first.md) | WCAG AA compliance in shared components; axe-core in unit tests; eslint-plugin-jsx-a11y; accessible color palette in design tokens; focus-visible, reduced-motion, aria attributes in conventions |
| [Simplicity Over Complexity](../../../governance/principles/general/simplicity-over-complexity.md) | Minimum viable component set (6 initial); single-purpose components; flat lib structure; no premature abstractions |
| [Explicit Over Implicit](../../../governance/principles/software-engineering/explicit-over-implicit.md) | All component props documented via TypeScript + JSDoc; data-slot attributes for explicit identity; no magic defaults; explicit token naming |
| [Progressive Disclosure](../../../governance/principles/content/progressive-disclosure.md) | Storybook stories layer from default → variants → advanced; convention docs start with essentials; skill reference modules for deeper topics |
| [Documentation First](../../../governance/principles/content/documentation-first.md) | Conventions documented before code (Phase 1); component catalog (Phase 4); JSDoc on all exports |
| [Automation Over Manual](../../../governance/principles/software-engineering/automation-over-manual.md) | ESLint rules, Prettier plugin, vitest-axe, Playwright visual regression — all automated in CI |
| [Root Cause Orientation](../../../governance/principles/general/root-cause-orientation.md) | Addresses root cause (no shared tokens/components) not symptoms (inconsistent UIs) |

### Conventions Respected

| Convention | How This Plan Respects It |
| --- | --- |
| [Color Accessibility](../../../governance/conventions/formatting/color-accessibility.md) | 5-color palette for docs only; UI apps use any colors meeting WCAG AA contrast; anti-patterns include color-only status and unverified contrast |
| [Content Quality](../../../governance/conventions/writing/quality.md) | All convention docs follow heading hierarchy, active voice, alt text rules; no time estimates |
| [Diagrams](../../../governance/conventions/formatting/diagrams.md) | Mermaid dependency graph uses accessible colors; vertical orientation |
| [Three-Level Testing](../../../governance/development/quality/three-level-testing-standard.md) | axe-core in unit tests, visual regression in integration, full-page regression in E2E — maps to the existing three-level pipeline |
| [Implementation Workflow](../../../governance/development/workflow/implementation.md) | Phase ordering follows make-it-work (conventions) → make-it-right (shared lib) → make-it-fast (enforcement) |
