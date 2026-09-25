---
name: developing-frontend-ui
description: UI development skill covering design token usage, shadcn/ui + Radix composition patterns, accessibility requirements, anti-patterns catalog, and brand context for OrganicLever and OSE Platform. Auto-loads when working on TSX components, CSS, or UI design tasks.
---

# Frontend UI Development Skill

This skill provides repo-specific guidance for building UI components in the open-sharia-enterprise monorepo. It covers design tokens, component patterns, accessibility, anti-patterns, and per-app brand context.

## When This Skill Triggers

- Editing `.tsx` component files in `apps/*/src/components/`
- Editing `globals.css` or Tailwind configuration
- Creating or modifying shared UI components in `libs/web-ui/`
- Working on design tokens in `libs/web-ui-token/`

## Reference Modules

Consult these reference docs for detailed guidance on specific topics:

- [Design Tokens Reference](./reference/design-tokens.md) — Token architecture, current values, Tailwind mapping
- [Design Tokens — Spacing and Format Reference](./reference/design-tokens-spacing-and-format.md) — Spacing scale, token format differences across apps
- [Component Patterns Reference](./reference/component-patterns.md) — Standard template, complete Button example
- [Component Patterns — Key Patterns and Testing](./reference/component-patterns-key-patterns-and-testing.md) — CVA/Radix key patterns, Storybook, unit tests, checklist
- [Anti-Patterns Catalog](./reference/anti-patterns.md) — 13 repo-specific anti-patterns with before/after examples
- [Accessibility Reference](./reference/accessibility.md) — Per-component ARIA checklists, keyboard navigation
- [Brand Context Reference](./reference/brand-context.md) — Per-app audience, personality, palette guidance
- [Top Rules Reference](./reference/top-rules.md) — Quick-reference Do/Do-Not checklist

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

## Quality-Gate Lifecycle Handoff

When the UI quality gate provides `delegated-gate-ids` and an evidence ledger, omit only exact
registry IDs or predicates connected through `verifies`. Preserve pending state; never rerun,
infer, revalidate, or fix delegated work. The seven semantic UI dimensions remain in scope. See the
[lifecycle ownership policy](../../../repo-governance/workflows/meta/workflow-identifier/check-fix-lifecycle-validation-ownership.md).
Fixers invalidate evidence whose registered scope intersects their changed files.

The UI gate has two checker roles: one full discovery and, only after its single fixer invocation,
one verification limited to the original in-threshold findings plus regression smoke over affected
components. A clean discovery passes immediately. Verification never becomes another full audit,
and no result automatically starts another pass.

**Canonical reference**:
[Test-Driven Development Convention](../../../repo-governance/development/workflow/test-driven-development.md)
— covers all test levels (unit, snapshot/visual, a11y, E2E, manual verification) and the full
Red→Green→Refactor cycle.

## Governance References

- [Design Tokens Convention](../../../repo-governance/development/frontend/design-tokens.md)
- [Component Patterns Convention](../../../repo-governance/development/frontend/component-patterns.md)
- [Accessibility Convention](../../../repo-governance/development/frontend/accessibility.md)
- [Styling Convention](../../../repo-governance/development/frontend/styling.md)
- [Color Accessibility Convention](../../../repo-governance/conventions/formatting/color-accessibility.md) — 5-color palette for docs only; UI uses any WCAG AA compliant colors
- [Accessibility First Principle](../../../repo-governance/principles/content/accessibility-first.md)
