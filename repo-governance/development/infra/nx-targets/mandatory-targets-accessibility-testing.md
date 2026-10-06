---
description: The two-level accessibility testing requirement (static a11y linting and runtime axe-core E2E tests) for UI projects.
when_to_use: Use when adding accessibility coverage to a new or existing UI project.
---

# Accessibility Testing

Accessibility testing is compulsory for all UI-related projects. It operates at two levels:

**Static a11y linting** (enforced via the `lint` target at both gates: the PR quality gate and
scheduled Test CI workflows):

| Project                                                                               | Static a11y tool           |
| ------------------------------------------------------------------------------------- | -------------------------- |
| `organiclever-app-web`, `organiclever-www`, `ayokoding-www`, `ose-www`, `libs/web-ui` | `oxlint --jsx-a11y-plugin` |

Static a11y linting catches common accessibility violations at compile time: missing alt text,
missing ARIA labels, invalid ARIA attributes, missing form labels, and incorrect role usage.

**Runtime accessibility E2E tests** (enforced via `test:e2e` in scheduled CI workflows):

All UI projects must have runtime accessibility E2E tests using `@axe-core/playwright` (axe-core)
covering WCAG AA compliance. These tests verify:

- Color contrast ratios (WCAG AA: 4.5:1 for normal text, 3:1 for large text)
- Keyboard navigation (all interactive elements reachable via Tab/Shift+Tab)
- ARIA labels and roles on interactive elements
- Focus management (focus moves logically, focus traps work correctly)
- Heading hierarchy (no skipped levels, single H1)

**Gherkin accessibility specs**: UI projects must have an `accessibility.feature` file under a
domain subdirectory in `specs/apps/<domain>/fe/gherkin/` (e.g., `accessibility/accessibility.feature`
or `layout/accessibility.feature`). UI component library specs in
`specs/libs/web-ui/behaviours/<component>/` must include "Has no accessibility violations" scenarios for
each component.
