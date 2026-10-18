# Phase 4 — Path Roadmap

Date: 2026-10-14. Execution branch `ayokoding-learn-revamp-04-learning-experience`.

## Gherkin

Created `specs/apps/ayokoding/www/behaviours/frontend/course-paths/path-roadmap.feature` (S19–S26)
and added S3, S5, S9 to `learning-progress/progress-store.feature`. `test:coverage:behaviour` named
exactly those eleven scenarios as missing bindings, with zero scenario-shape errors.

## Fixtures (Phase 0 found only the pending-restructure fixture missing)

Phase 0 established that `careers/fundamentally-strong/generalist-track.json` already has a core
phase with an outcome plus an extension phase, so no reshape was needed. Added
`apps/ayokoding-www-fe-e2e/fixtures/manifests/skills/conventional-accounting.json` (an allowlisted
`pathId`, marked shape: one `all-courses` core phase, no outcome, no `goals`, empty `assumes`,
`restructurePendingIn: "plan-06"`, two real courses). No existing skills count assertion changed.

## Files

- `src/features/course-paths/shell/`: `path-roadmap.tsx`, `roadmap-progress-card.tsx`,
  `roadmap-phase.tsx`, `roadmap-course-card.tsx`, `phase-progress.tsx`, `course-card-status.tsx`.
- `path-landing.tsx` renders `PathRoadmap`; `phase-section.tsx` and its test deleted (no remaining
  caller); `src/app/[locale]/(content)/[...slug]/page.tsx` passes `loadLessonPagePaths` into
  `renderPathsRoute`; `src/features/i18n/core/translations.ts` gained the roadmap keys in both locales.
- Tests: `tests/unit/features/course-paths/shell/{path-roadmap,roadmap-progress-card,roadmap-phase,roadmap-course-card,phase-progress,course-card-status}.test.tsx`
  and the edited `path-landing.test.tsx`; `tests/unit/fe-steps/path-roadmap.steps.tsx` (S19–S26) and
  S3/S5/S9 added to `progress-store.steps.tsx`; `apps/ayokoding-www-fe-e2e/tests/e2e/steps/path-roadmap.steps.ts`
  and S3/S5/S9 added to the E2E `progress-store.steps.ts`; `course-paths.steps.ts` updated for the U5
  extension-`<details>` bindings.

## Gates

- Unit gate (`--maxWorkers=1`): `Test Files 227 passed (227)`, `Tests 4007 passed (4007)`, coverage
  `All files … Lines 99.52` ≥ 99%.
- `typecheck` (ayokoding-www and ayokoding-www-fe-e2e) and `lint` exit 0.
- Flow-scoped `E2E` (path-roadmap + progress-store, Chromium/Firefox/WebKit, `--workers=1`):
  **`42 passed`**, 0 failed.

### Fixes found while getting the E2E green

- `route-paths-hub.test.tsx`'s `serverCaller` mock lacked `content.getTree` (Phase 4's `renderPathsRoute`
  now reads it); the mock was completed and the suite passes.
- An unused `Locale` import in `path-landing.tsx` failed typecheck; removed.
- The S26 row assertion required whitespace after the position number, but the card's `textContent`
  concatenates (`"1Accounting FoundationsNot started"`); changed to a digit-boundary lookahead.
- The roadmap's mark-complete helper lost a click in Firefox on one run; the click-and-verify pair is
  now retried as a unit with `expect(...).toPass()`.

`PhaseSection` retired: `rtk git grep -n "PhaseSection"` finds only the new `PhaseProgress` sibling and
no remaining caller of plan 02's `PhaseSection`. The `<nav aria-label="… syllabus">` wrapper name is
kept.
