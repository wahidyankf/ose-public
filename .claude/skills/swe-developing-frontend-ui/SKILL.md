---
name: swe-developing-frontend-ui
description: UI development skill covering design token usage, shadcn/ui + Radix composition patterns, accessibility requirements, anti-patterns catalog, and brand context for OrganicLever and OSE Platform. Auto-loads when working on TSX components, CSS, or UI design tasks.
---

# Frontend UI Development Skill

This skill provides repo-specific guidance for building UI components in the open-sharia-enterprise monorepo. It covers design tokens, component patterns, accessibility, anti-patterns, and per-app brand context.

## When This Skill Triggers

- Editing `.tsx` component files in `apps/*/src/components/`
- Editing `globals.css` or Tailwind configuration
- Creating or modifying shared UI components in `libs/ts-ui/`
- Working on design tokens in `libs/ts-ui-tokens/`

## Reference Modules

Consult these reference docs for detailed guidance on specific topics:

- [Design Tokens Reference](./reference/design-tokens.md) — Token names, formats, mapping to Tailwind utilities
- [Component Patterns Reference](./reference/component-patterns.md) — CVA templates, Radix composition, complete component examples
- [Anti-Patterns Catalog](./reference/anti-patterns.md) — 13 repo-specific anti-patterns with before/after examples
- [Accessibility Reference](./reference/accessibility.md) — Per-component ARIA checklists, keyboard navigation
- [Brand Context Reference](./reference/brand-context.md) — Per-app audience, personality, palette guidance

## Quick Reference: Top Rules

### Do

1. **Use semantic tokens** — `bg-primary`, `text-muted-foreground`, `border-border` (not hardcoded colors)
2. **Use `React.ComponentProps<"element">`** — not `React.forwardRef`
3. **Use `radix-ui` unified package** — not `@radix-ui/react-slot` individual packages; use `Slot.Root` from unified
4. **Add `data-slot="component-name"`** on every component root element
5. **Use `focus-visible:`** — not `focus:` (keyboard-only focus rings)
6. **Use `cn()` from shared lib** — `clsx` + `tailwind-merge` for class composition
7. **Define variants with CVA** — export from `.variants.ts` for reuse
8. **Every visual token needs a `.dark` counterpart** — verify contrast in both modes
9. **Mobile-first responsive** — start with base styles, add `md:`, `lg:` prefixes
10. **Minimum hit targets** — 24px desktop, 44px mobile

### Do Not

1. **No hardcoded hex/rgb/hsl** in className or style props — use design tokens
2. **No `!important`** — use `@layer` specificity or Tailwind modifiers
3. **No `@apply` outside `@layer base`** — defeats utility-first purpose
4. **No inline `style={{}}` in production** — use Tailwind utilities
5. **No `focus:` without `visible`** — always `focus-visible:` for keyboard users
6. **No color-only status indicators** — include text labels and/or shapes
7. **No `transition-all`** — specify explicit properties: `transition-colors`, `transition-opacity`
8. **No bounce/elastic easing** — use `ease-out` or custom `cubic-bezier`
9. **No nested Card inside Card** — use spacing/dividers for visual hierarchy
10. **No font via CSS `font-family`** — use `next/font` for optimization

## Test-Driven Development for UI

TDD applies to UI component and page work. Write the failing check before writing the component:

- **Vitest unit test** (`component-name.test.tsx`): failing assertion on render, variant output,
  or `toHaveNoViolations()` (vitest-axe) — write this first.
- **Visual snapshot** (Playwright visual diff): failing screenshot comparison — write before
  finalizing visual styles.
- **Accessibility check** (axe): failing `toHaveNoViolations()` in unit test or Playwright — write
  before adding interactive states or ARIA markup.
- **E2E Playwright spec**: failing user-flow assertion — write before implementing flows that cross
  component boundaries.

Mini-TDD passes work well for UI: one Red→Green→Refactor cycle per variant, state, or interaction.

**Canonical reference**:
[Test-Driven Development Convention](../../../governance/development/workflow/test-driven-development.md)
— covers all test levels (unit, snapshot/visual, a11y, E2E, manual verification) and the full
Red→Green→Refactor cycle.

## Governance References

- [Design Tokens Convention](../../../governance/development/frontend/design-tokens.md)
- [Component Patterns Convention](../../../governance/development/frontend/component-patterns.md)
- [Accessibility Convention](../../../governance/development/frontend/accessibility.md)
- [Styling Convention](../../../governance/development/frontend/styling.md)
- [Color Accessibility Convention](../../../governance/conventions/formatting/color-accessibility.md) — 5-color palette for docs only; UI uses any WCAG AA compliant colors
- [Accessibility First Principle](../../../governance/principles/content/accessibility-first.md)
