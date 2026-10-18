# Phase 5 — Course Header Progress

Date: 2026-10-14. Execution branch `ayokoding-learn-revamp-04-learning-experience`.

## Gherkin

Created `specs/apps/ayokoding/www/behaviours/frontend/learning-progress/course-landing-progress.feature`
with the "Course landing progress" feature and S33/S34 (prd wording, titles without the prefix, each
`@integration-exempt` with the standard repository comment). `BEHAVIOUR` named only S33 and S34 as
missing.

## Files

- `src/features/learning-progress/shell/course-progress-summary.tsx` (client; status in words,
  `progressPagesDone`, meter, "Saved in this browser", fixed `h-16`) and
  `course-progress-action.tsx` (client; Start / "Continue course: <page>" / "Review course", keeps
  `?path=`, records the visit on mount).
- `src/app/[locale]/(content)/[...slug]/page.tsx` loads `loadLessonSequence` for a course root page and
  supplies the header's `progress`/`primaryAction` data; `course-page-content.tsx` builds the two slots
  (it is the only place that knows the hydrated `?path=`).
- `src/features/i18n/core/translations.ts`: `courseContinueCourse`, `courseReviewCourse` in both locales.
- Tests: `tests/unit/features/learning-progress/course-progress-summary.test.tsx` (6) and
  `course-progress-action.test.tsx` (8); `tests/unit/fe-steps/course-landing-progress.steps.tsx` (unit
  bindings); `apps/ayokoding-www-fe-e2e/tests/e2e/steps/course-landing-progress.steps.ts` (E2E bindings).
- `tests/unit/fe-steps/canonical-fallback.steps.tsx` gained the now-needed `serverCaller.content.getTree`
  mock (no assertion changed).

## Gates

- Unit gate (`--maxWorkers=1`): `Test Files 230 passed (230)`, `Tests 4031 passed (4031)`, coverage
  `All files … Lines 99.53` ≥ 99%.
- `typecheck` (ayokoding-www and ayokoding-www-fe-e2e) and `lint` exit 0.
- Flow-scoped `E2E` (course-landing-progress, Chromium/Firefox/WebKit, `--workers=1`): **`6 passed`**.

### Fixes found while getting the E2E green

- Two header assertions used a leading `\b` before a digit that follows a word character in the
  header's concatenated text ("Done6 of 6 pages done" has no word boundary), so they never matched;
  simplified to `/(\d+) of \1 pages done/` and `/2 of \d+ pages done/`.
- S33's page-advance helper looked only for "Mark complete & continue", but once the page is complete
  the primary link reads "Continue →"; widened to `/^(Mark complete & continue|Continue)/`.

### Note on the header slot wiring

The plan text says `page.tsx` passes `progress`/`primaryAction` to `CourseHeader`, but `page.tsx` never
renders that header — `CoursePageContent` does, and it is the only place that knows the hydrated
`?path=`. So `page.tsx` supplies the plain serializable data and `CoursePageContent` builds the
elements, which keeps `?path=` on the header button (tech-docs/004 shared rule).
