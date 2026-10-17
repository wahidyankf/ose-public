# Phase 8 — Accessibility and No Layout Shift

Date: 2026-10-14. Execution branch `ayokoding-learn-revamp-04-learning-experience`.

## Files

- Gherkin: `learning-progress/learning-progress-accessibility.feature` (S35–S39) and S8 added to
  `progress-store.feature`.
- `[data-progress-slot]` markers and fixed-height slots added to `context-bar.tsx`, `lesson-nav.tsx`,
  `course-progress-summary.tsx`, `course-progress-action.tsx`, `continue-learning-card.tsx`,
  `reset-progress-control.tsx`, `storage-notice.tsx`, `learn-home.tsx`,
  `roadmap-progress-card.tsx`, `phase-progress.tsx`, `course-card-status.tsx`, `path-card-progress.tsx`.
- App fixes for the axe scan and S8: `content/core/parser.ts`, `content/shell/mermaid.tsx` (the raw
  Mermaid source stays in the document as the diagram's reserved box, hidden with `visibility:hidden`,
  so content below never moves), `navigation/shell/sidebar-tree.tsx` (the active tint moved from
  `bg-primary/10` to `bg-primary/5`, 4.39:1 → 4.8:1 on the rail), `course-page-content.tsx` /
  `course-page-path-content.tsx` (the header badge block no longer blanks on hydration).
- Tests: `tests/unit/fe-steps/learning-progress-accessibility.steps.tsx` (+ `helpers/progress-screens.tsx`),
  S8 added to `tests/unit/fe-steps/progress-store.steps.tsx`, and the E2E
  `learning-progress-accessibility.steps.ts` + S8 in the E2E `progress-store.steps.ts` (scripts-off vs
  scripts-on bounding boxes within 1 px, reduced-motion computed styles, 375 px scroll width and
  ≥ 44 × 44 controls, axe `wcag2a`/`wcag2aa`, keyboard traversal, hydration-error check).
  `tests/unit/fe-steps/{content-rendering,navigation,sidebar-course-categories}.steps.tsx` and
  `tests/unit/features/course-paths/shell/course-page-path-content.test.tsx` updated for the changed DOM
  shapes (see below).

## Gates

- Unit gate (`--maxWorkers=1`): `Test Files 241 passed (241)`, `Tests 4147 passed (4147)`, coverage
  `All files … Lines 99.54` ≥ 99%.
- `typecheck` (ayokoding-www and ayokoding-www-fe-e2e), `lint`, and `bddgen` exit 0.
- Flow-scoped `E2E` (learning-progress-accessibility + progress-store, Chromium/Firefox/WebKit,
  `--workers=1`): **`42 passed`**, 0 failed — including the four axe scans (zero violations), the
  layout-shift comparison, and the keyboard traversal in all three browsers.

### Fixes found while getting the E2E green

- S35 seeded the wrong courses; the Given now seeds a done, an in-progress, and an untouched course on
  the path it opens.
- S36: WebKit honours Safari's platform Tab behaviour, so plain `Tab` never reaches a button or link
  (it walks text fields and focusable scrollable panes). The step now presses the reader's own
  traversal key (`Alt+Tab` in WebKit, `Tab` elsewhere) and matches the toggle by element identity via a
  locator. Chromium/Firefox reach it at press ~229.
- S39: two real contrast defects fixed — the `.bg-primary/10` tint (→ `/5`) and the lesson code-block
  syntax colours.
- S8: a learning-page slot shifted ~8.7 px and a course-landing slot's following element vanished on
  hydration; both fixed by pinning the slots and the header badge block.
- Five existing unit tests were updated after the app fixes changed their DOM shape (the Mermaid source
  block is now reserved-and-hidden rather than absent; the sidebar active tint class changed; the header
  badge block keeps its canonical list).
