# PRD — wahidyankf-web Component Migration to ts-ui

## Product Overview

This migration moves four pure-React components from `apps/wahidyankf-web/src/components/` into
`libs/ts-ui` and refactors each one into a general-purpose, prop-configurable UI primitive.
Currently the four components hardcode styling and behaviour values specific to `wahidyankf-web`.
After migration each accepts those values as optional props with the current values as defaults,
making them reusable across all OSE web apps without forking or copy-pasting.

The migration also exports the components from the library's public index, adds the workspace
dependency to `wahidyankf-web`, and updates every import site. End state: a leaner app
`components/` directory (Navigation only) and a more capable shared library.

## Personas

- **Maintainer (developer hat)** — authors all code in `ose-public`; runs quality gates; deploys
  apps. Benefits from a single authoritative source for generic UI primitives.
- **Consuming agents** (`swe-typescript-dev`, `swe-ui-maker`, etc.) — read `CLAUDE.md` and
  `libs/ts-ui` to understand available UI primitives when generating or reviewing code.

## User Story

As the wahidyankf-web maintainer, I want the four generic UI components refactored into
general-purpose, prop-configurable primitives and published to `ts-ui` so that I import them
from the shared library and any future OSE app can consume them with different styles or
behaviour without forking or copy-pasting.

## Acceptance Criteria

```gherkin
Scenario: Four components exist in ts-ui after migration
  Given the migration delivery checklist is complete
  When I inspect libs/ts-ui/src/components/
  Then I see highlight-text/, scroll-to-top/, search-component/, and theme-toggle/ directories
  And each directory contains the component file and its unit test file
  And libs/ts-ui/src/index.ts exports HighlightText, highlightText, ScrollToTop,
      SearchComponent, and ThemeToggle from their respective paths

Scenario: wahidyankf-web imports components from ts-ui
  Given the migration delivery checklist is complete
  When I grep apps/wahidyankf-web/src/ for @/components/HighlightText,
      @/components/ScrollToTop, @/components/SearchComponent, @/components/ThemeToggle
  Then no matches are found
  And all import statements use @open-sharia-enterprise/ts-ui instead

Scenario: Navigation component remains local
  Given the migration delivery checklist is complete
  When I inspect apps/wahidyankf-web/src/components/
  Then I see Navigation.tsx and Navigation.unit.test.tsx
  And no other component files are present

Scenario: All quality gates pass after migration
  Given the migration delivery checklist is complete
  When I run nx affected -t typecheck lint test:quick spec-coverage
  Then all targets pass with zero errors for wahidyankf-web and ts-ui

Scenario: Visual appearance is unchanged
  Given the dev server is running after migration
  When I navigate to the home page, CV page, and personal-projects page
  Then the rendered output is visually identical to the pre-migration baseline
  And ThemeToggle switches between dark and light mode correctly
  And ScrollToTop button appears on scroll and returns to top on click
  And HighlightText correctly highlights matched search terms

Scenario: Migrated components are general-purpose and prop-configurable
  Given the migration delivery checklist is complete
  When I inspect each migrated component in libs/ts-ui/src/components/
  Then HighlightText accepts a prop to override the highlight mark className
  And ScrollToTop accepts props to override the scroll threshold and button className
  And SearchComponent accepts props to override input and clear-button className
  And ThemeToggle accepts a prop to override the button className
  And each prop has the original wahidyankf-web hardcoded value as its default
  And wahidyankf-web call-sites compile and render correctly without passing those props
```

## Product Scope

### In Scope

| Component         | Current location                                         | Target location in ts-ui                                          |
| ----------------- | -------------------------------------------------------- | ----------------------------------------------------------------- |
| `HighlightText`   | `apps/wahidyankf-web/src/components/HighlightText.tsx`   | `libs/ts-ui/src/components/highlight-text/highlight-text.tsx`     |
| `ScrollToTop`     | `apps/wahidyankf-web/src/components/ScrollToTop.tsx`     | `libs/ts-ui/src/components/scroll-to-top/scroll-to-top.tsx`       |
| `SearchComponent` | `apps/wahidyankf-web/src/components/SearchComponent.tsx` | `libs/ts-ui/src/components/search-component/search-component.tsx` |
| `ThemeToggle`     | `apps/wahidyankf-web/src/components/ThemeToggle.tsx`     | `libs/ts-ui/src/components/theme-toggle/theme-toggle.tsx`         |

Companion unit test files migrate alongside each component.

Import sites updated in `apps/wahidyankf-web/src/`:

- `src/app/page.tsx` — imports `SearchComponent` and `HighlightText`
- `src/app/cv/page.tsx` — imports `SearchComponent` and `HighlightText`
- `src/app/personal-projects/page.tsx` — imports `SearchComponent` and `HighlightText`
- `src/app/layout.tsx` — imports `ScrollToTop` and `ThemeToggle`
- `src/utils/markdown.tsx` — imports `HighlightText`

### Out of Scope

- `Navigation.tsx` — kept local. It imports `next/link` and `next/navigation`. Adding Next.js
  as a peer dependency to `ts-ui` would contaminate a framework-agnostic library. See
  [brd.md](./brd.md) for the full rationale.
- No changes to any other app (`ayokoding-web`, `oseplatform-web`, `organiclever-web`, etc.).
- No visual changes to `wahidyankf-web`'s rendered output — components are refactored for
  reusability (flexible props, configurable defaults) but `wahidyankf-web` call-sites pass props
  that reproduce the current appearance exactly.
- No new Gherkin feature files for ts-ui component coverage — separate future concern.

## Product-Level Risks

| Risk                                      | Likelihood | Impact | Notes                                                          |
| ----------------------------------------- | ---------- | ------ | -------------------------------------------------------------- |
| Import site missed during update          | Low        | High   | Post-migration grep catches any missed sites before push       |
| Export name mismatch breaks type-checking | Low        | High   | Export lines in index.ts are specified exactly in tech-docs.md |
| Test file import path not updated         | Low        | Medium | Each phase explicitly updates the import inside the test file  |
