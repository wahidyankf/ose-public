# wahidyankf-web Component Migration to ts-ui

**Status**: Not Started
**Created**: 2026-04-23
**Scope**: `ose-public` — `apps/wahidyankf-web`, `libs/ts-ui`

## Context

`apps/wahidyankf-web` ships four pure-React components that have no Next.js-specific dependencies
and belong in the shared `libs/ts-ui` component library. Keeping them local duplicates code that
any future OSE app could reuse and prevents ts-ui from being the single authoritative source for
generic UI primitives.

This plan moves the four eligible components into ts-ui, exports them from the library's public
index, wires the workspace dependency in wahidyankf-web, and updates every import site. Visual
appearance must be identical after migration — the files move verbatim; no behaviour changes are
permitted.

## Scope

### In Scope

| Component         | Current path                                             | Target path in ts-ui                                              |
| ----------------- | -------------------------------------------------------- | ----------------------------------------------------------------- |
| `HighlightText`   | `apps/wahidyankf-web/src/components/HighlightText.tsx`   | `libs/ts-ui/src/components/highlight-text/highlight-text.tsx`     |
| `ScrollToTop`     | `apps/wahidyankf-web/src/components/ScrollToTop.tsx`     | `libs/ts-ui/src/components/scroll-to-top/scroll-to-top.tsx`       |
| `SearchComponent` | `apps/wahidyankf-web/src/components/SearchComponent.tsx` | `libs/ts-ui/src/components/search-component/search-component.tsx` |
| `ThemeToggle`     | `apps/wahidyankf-web/src/components/ThemeToggle.tsx`     | `libs/ts-ui/src/components/theme-toggle/theme-toggle.tsx`         |

Companion unit test files migrate alongside each component.

**Import sites updated in wahidyankf-web:**

- `@/components/HighlightText` → `@open-sharia-enterprise/ts-ui` (used in `src/app/page.tsx`,
  `src/app/cv/page.tsx`, `src/app/personal-projects/page.tsx`, `src/utils/markdown.tsx`)
- `@/components/ScrollToTop` → `@open-sharia-enterprise/ts-ui` (used in `src/app/layout.tsx`)
- `@/components/SearchComponent` → `@open-sharia-enterprise/ts-ui` (used in `src/app/page.tsx`,
  `src/app/cv/page.tsx`, `src/app/personal-projects/page.tsx`)
- `@/components/ThemeToggle` → `@open-sharia-enterprise/ts-ui` (used in `src/app/layout.tsx`)

### Out of Scope

- `Navigation.tsx` — kept local. It imports `next/link` and `next/navigation`, which are
  Next.js-specific. Pulling these into ts-ui would force a Next.js peer dependency on a library
  that must remain framework-agnostic.
- No changes to any other app (`ayokoding-web`, `oseplatform-web`, `organiclever-web`, etc.).
- No design or behaviour changes to the migrated components — verbatim file copy only.
- No new Gherkin feature files for this migration (the existing unit tests migrate with the
  components and continue providing coverage; Gherkin spec coverage for ts-ui components is a
  separate future concern).

## Business Rationale

Generic UI primitives belong in the shared library. Duplicating them in one app creates drift
risk and prevents reuse. Moving them to ts-ui makes every future OSE web app a potential
consumer with zero copy-paste.

**Success metric (observable):** After migration, `apps/wahidyankf-web/src/components/`
contains exactly one file (`Navigation.tsx` + its test) and all quality gates (typecheck, lint,
test:quick, spec-coverage) pass green for both `wahidyankf-web` and `ts-ui`.

**No-go risk:** Visual regression if component behaviour changes during the move.
Mitigation: verbatim file copy with zero code edits; Playwright MCP visual verification against
the running dev server before and after migration confirms no regressions.

## Product Requirements

**User story:** As the wahidyankf-web maintainer, I want the four generic UI components to live
in ts-ui so that I import them from the shared library and any future OSE app can reuse them
without copy-pasting.

### Acceptance Criteria

```gherkin
Scenario: Four components exist in ts-ui after migration
  Given the migration delivery checklist is complete
  When I inspect libs/ts-ui/src/components/
  Then I see highlight-text/, scroll-to-top/, search-component/, and theme-toggle/ directories
  And each directory contains the component file and its unit test file
  And libs/ts-ui/src/index.ts exports HighlightText, highlightText, ScrollToTop,
      SearchComponent, ThemeToggle from their respective paths

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
```

## Technical Approach

**Path mapping already in place.** `tsconfig.base.json` maps
`@open-sharia-enterprise/ts-*` → `libs/ts-*/src/index.ts`, and wahidyankf-web's tsconfig
extends the base. No tsconfig changes are needed.

**Workspace dependency.** `apps/wahidyankf-web/package.json` has no entry for
`@open-sharia-enterprise/ts-ui`. Add it to `dependencies` with value `"*"` (workspace wildcard)
matching the pattern used by other workspace consumers.

**ts-ui subdirectory pattern.** Existing ts-ui components live under
`libs/ts-ui/src/components/<component-name>/<component-name>.tsx`. Follow this kebab-case
naming convention for the four new subdirectories.

**Export approach.** Each new component is appended to `libs/ts-ui/src/index.ts` with named
exports matching the original export style from the source file (named export for
`HighlightText`/`highlightText`/`SearchComponent`, default export promoted to named for
`ScrollToTop`/`ThemeToggle`).

**Import update pattern.** Each consuming file in wahidyankf-web replaces the local
`@/components/<Name>` import with a single import from `@open-sharia-enterprise/ts-ui`. Where a
file already imports from ts-ui, the new names are added to the existing import statement.

**Test file placement.** Unit test files move into the same subdirectory as their component,
matching the ts-ui convention (e.g., `libs/ts-ui/src/components/button/` contains only
`button.tsx`; tests currently live separately in ts-ui — see note below).

> **Note on ts-ui test location.** Existing ts-ui component tests are located in
> `libs/ts-ui/src/components/<name>/` alongside the component. The migrated test files follow
> the same colocation pattern.

**Git strategy.** Direct commits to `main` (Trunk Based Development). No worktree, no PR.

## Delivery Checklist

### Environment Setup

- [ ] Confirm working directory is `ose-public` subrepo root
- [ ] Run `npm install` in `ose-public/` to install dependencies
- [ ] Run `npm run doctor -- --fix` to converge the polyglot toolchain
- [ ] Verify dev server starts: `nx dev wahidyankf-web`
- [ ] Run existing tests to establish baseline:
  - `nx run wahidyankf-web:test:quick`
  - `nx run ts-ui:test:quick` (or `nx run libs/ts-ui:test:quick` per project name)
- [ ] Note any preexisting failures before touching any files

### Phase 1 — Add ts-ui Dependency to wahidyankf-web

- [ ] Open `apps/wahidyankf-web/package.json`
- [ ] Add `"@open-sharia-enterprise/ts-ui": "*"` to the `dependencies` block
- [ ] Verify no duplicate entries exist after the edit

**Commit:** `chore(wahidyankf-web): add @open-sharia-enterprise/ts-ui workspace dependency`

### Phase 2 — Migrate HighlightText

- [ ] Create directory `libs/ts-ui/src/components/highlight-text/`
- [ ] Copy `apps/wahidyankf-web/src/components/HighlightText.tsx` →
      `libs/ts-ui/src/components/highlight-text/highlight-text.tsx` (verbatim, no edits)
- [ ] Copy `apps/wahidyankf-web/src/components/HighlightText.unit.test.tsx` →
      `libs/ts-ui/src/components/highlight-text/highlight-text.unit.test.tsx`
  - Update the import path inside the test file from `./HighlightText` to `./highlight-text`
- [ ] Append to `libs/ts-ui/src/index.ts`:

  ```ts
  export { HighlightText, highlightText } from "./components/highlight-text/highlight-text";
  ```

- [ ] Update all import sites in wahidyankf-web for `HighlightText`:
  - `src/app/page.tsx` — replace `import { ... } from "@/components/HighlightText"` with import
    from `@open-sharia-enterprise/ts-ui`
  - `src/app/cv/page.tsx` — same replacement
  - `src/app/personal-projects/page.tsx` — same replacement
  - `src/utils/markdown.tsx` — same replacement
- [ ] Delete `apps/wahidyankf-web/src/components/HighlightText.tsx`
- [ ] Delete `apps/wahidyankf-web/src/components/HighlightText.unit.test.tsx`

### Phase 3 — Migrate ScrollToTop

- [ ] Create directory `libs/ts-ui/src/components/scroll-to-top/`
- [ ] Copy `apps/wahidyankf-web/src/components/ScrollToTop.tsx` →
      `libs/ts-ui/src/components/scroll-to-top/scroll-to-top.tsx` (verbatim, no edits)
- [ ] Copy `apps/wahidyankf-web/src/components/ScrollToTop.unit.test.tsx` →
      `libs/ts-ui/src/components/scroll-to-top/scroll-to-top.unit.test.tsx`
  - Update the import path inside the test file from `./ScrollToTop` to `./scroll-to-top`
- [ ] Append to `libs/ts-ui/src/index.ts`:

  ```ts
  export { default as ScrollToTop } from "./components/scroll-to-top/scroll-to-top";
  ```

- [ ] Update import site in wahidyankf-web for `ScrollToTop`:
  - `src/app/layout.tsx` — replace `import ScrollToTop from "@/components/ScrollToTop"` with
    import from `@open-sharia-enterprise/ts-ui`
- [ ] Delete `apps/wahidyankf-web/src/components/ScrollToTop.tsx`
- [ ] Delete `apps/wahidyankf-web/src/components/ScrollToTop.unit.test.tsx`

### Phase 4 — Migrate SearchComponent

- [ ] Create directory `libs/ts-ui/src/components/search-component/`
- [ ] Copy `apps/wahidyankf-web/src/components/SearchComponent.tsx` →
      `libs/ts-ui/src/components/search-component/search-component.tsx` (verbatim, no edits)
- [ ] Copy `apps/wahidyankf-web/src/components/SearchComponent.unit.test.tsx` →
      `libs/ts-ui/src/components/search-component/search-component.unit.test.tsx`
  - Update the import path inside the test file from `./SearchComponent` to
    `./search-component`
- [ ] Append to `libs/ts-ui/src/index.ts`:

  ```ts
  export { SearchComponent } from "./components/search-component/search-component";
  ```

- [ ] Update all import sites in wahidyankf-web for `SearchComponent`:
  - `src/app/page.tsx` — replace `import { ... } from "@/components/SearchComponent"` with
    import from `@open-sharia-enterprise/ts-ui`
  - `src/app/cv/page.tsx` — same replacement
  - `src/app/personal-projects/page.tsx` — same replacement
- [ ] Delete `apps/wahidyankf-web/src/components/SearchComponent.tsx`
- [ ] Delete `apps/wahidyankf-web/src/components/SearchComponent.unit.test.tsx`

### Phase 5 — Migrate ThemeToggle

- [ ] Create directory `libs/ts-ui/src/components/theme-toggle/`
- [ ] Copy `apps/wahidyankf-web/src/components/ThemeToggle.tsx` →
      `libs/ts-ui/src/components/theme-toggle/theme-toggle.tsx` (verbatim, no edits)
- [ ] Copy `apps/wahidyankf-web/src/components/ThemeToggle.unit.test.tsx` →
      `libs/ts-ui/src/components/theme-toggle/theme-toggle.unit.test.tsx`
  - Update the import path inside the test file from `./ThemeToggle` to `./theme-toggle`
- [ ] Append to `libs/ts-ui/src/index.ts`:

  ```ts
  export { default as ThemeToggle } from "./components/theme-toggle/theme-toggle";
  ```

- [ ] Update import site in wahidyankf-web for `ThemeToggle`:
  - `src/app/layout.tsx` — replace `import ThemeToggle from "@/components/ThemeToggle"` with
    import from `@open-sharia-enterprise/ts-ui`
- [ ] Delete `apps/wahidyankf-web/src/components/ThemeToggle.tsx`
- [ ] Delete `apps/wahidyankf-web/src/components/ThemeToggle.unit.test.tsx`

**Commit after Phases 2-5:**
`feat(ts-ui): migrate HighlightText, ScrollToTop, SearchComponent, ThemeToggle from wahidyankf-web`

### Phase 6 — Verify remaining components/

- [ ] Confirm `apps/wahidyankf-web/src/components/` contains exactly:
  - `Navigation.tsx`
  - `Navigation.unit.test.tsx`
- [ ] Confirm no stale imports to deleted files exist:

  ```bash
  grep -r "@/components/HighlightText\|@/components/ScrollToTop\|@/components/SearchComponent\|@/components/ThemeToggle" apps/wahidyankf-web/src/
  ```

  Expected: zero matches.

### Local Quality Gates (Before Push)

- [ ] Run typecheck for affected projects:

  ```bash
  npx nx affected -t typecheck
  ```

- [ ] Run linting for affected projects:

  ```bash
  npx nx affected -t lint
  ```

- [ ] Run quick tests for affected projects:

  ```bash
  npx nx affected -t test:quick
  ```

- [ ] Run spec-coverage for affected projects:

  ```bash
  npx nx affected -t spec-coverage
  ```

- [ ] Fix ALL failures — including preexisting issues not caused by your changes.
- [ ] Re-run failing checks to confirm resolution.
- [ ] Verify zero failures before pushing.

> **Important**: Fix ALL failures found during quality gates, not just those caused by your
> changes. This follows the root cause orientation principle — proactively fix preexisting errors
> encountered during work. Do not defer or skip existing issues. Commit preexisting fixes
> separately with appropriate conventional commit messages.

### Commit Guidelines

- [ ] Commit changes thematically — group related changes into logically cohesive commits
- [ ] Follow Conventional Commits format: `<type>(<scope>): <description>`
- [ ] Split different domains/concerns into separate commits
- [ ] Preexisting fixes get their own commits, separate from plan work
- [ ] Do NOT bundle unrelated changes into a single commit

### Post-Push CI Verification

- [ ] Push changes to `main`
- [ ] Monitor ALL GitHub Actions workflows triggered by the push
- [ ] Verify ALL CI checks pass — no exceptions
- [ ] If any CI check fails, fix immediately and push a follow-up commit
- [ ] Repeat until ALL GitHub Actions pass with zero failures
- [ ] Do NOT proceed to the next step until CI is fully green

### Manual UI Verification (Playwright MCP)

- [ ] Start dev server: `nx dev wahidyankf-web`
- [ ] Navigate to the home page via `browser_navigate` (`http://localhost:3201`)
- [ ] Inspect DOM via `browser_snapshot` — verify search bar and highlight functionality render
- [ ] Navigate to the CV page (`http://localhost:3201/cv`) and personal-projects page
      (`http://localhost:3201/personal-projects`) — verify search bar renders on each
- [ ] Interact with `ThemeToggle` via `browser_click` — verify dark/light toggle works
- [ ] Interact with `ScrollToTop` — scroll down and verify the button appears, click it and
      verify scroll-to-top behaviour
- [ ] Enter text in the search bar — verify highlighted matches appear using `HighlightText`
- [ ] Check for JS errors via `browser_console_messages` — must be zero errors
- [ ] Take screenshots via `browser_take_screenshot` for visual reference
- [ ] Document verification results in this checklist

### Plan Archival

- [ ] Verify ALL delivery checklist items are ticked
- [ ] Verify ALL quality gates pass (local + CI)
- [ ] Verify ALL manual assertions pass (Playwright MCP)
- [ ] Move plan folder from `plans/in-progress/` to `plans/done/` via `git mv`
- [ ] Update `plans/in-progress/README.md` — remove this plan entry
- [ ] Update `plans/done/README.md` — add this plan entry with completion date
- [ ] Commit the archival: `chore(plans): move wahidyankf-web-ts-ui-migration to done`
