# Phase 3 — Lesson Pages: Context Bar and Action Row

Date: 2026-10-14. Execution branch `ayokoding-learn-revamp-04-learning-experience`.

## Gherkin

Created `specs/apps/ayokoding/www/behaviours/frontend/learning-progress/` with `README.md`,
`lesson-navigation.feature` (S10–S18), and `progress-store.feature` (Feature header, Background, S1,
S2, S4). `test:coverage:behaviour` reports exactly those twelve scenarios as missing bindings and
zero scenario-shape errors.

**Repair recorded:** the prd's S10 and S11 opened with `Given`, which the repository's
`behaviour-coverage` scenario-shape validator rejects (every scenario needs a literal `When`). The
leading keyword of S10 and S11 was changed to `When` in both `prd.md` and `lesson-navigation.feature`.

## Files

- `src/features/learning-progress/shell/`: `lesson-sequences.ts` (`loadLessonSequence`,
  `loadLessonPagePaths`), `lesson-context-provider.tsx`, `context-bar.tsx`, `lesson-nav.tsx`.
- `src/features/course-paths/shell/course-page-content.tsx` (optional `lesson` prop → provider +
  context bar + storage notice + `LessonNav` in place of `PrevNext`), `course-page-path-content.tsx`
  (forwards `lesson`), `src/app/[locale]/(content)/[...slug]/page.tsx` (lesson prop only for a page
  in its course's sequence).
- `src/features/i18n/core/translations.ts` (context bar + lesson nav keys, both locales).
- Tests: `tests/unit/features/learning-progress/{lesson-sequences.unit.test.ts,lesson-fixtures.ts,lesson-context-provider.test.tsx,context-bar.test.tsx,lesson-nav.test.tsx}`,
  `tests/unit/fe-steps/{lesson-navigation.steps.tsx,progress-store.steps.tsx,helpers/lesson-page.tsx}`,
  `apps/ayokoding-www-fe-e2e/tests/e2e/steps/{lesson-navigation.steps.ts,progress-store.steps.ts,support/complete-course.ts}`.
- Storage hardening required by S4: `src/features/app-shell/shell/mobile-nav.tsx`,
  `libs/web-ui/src/primitives/resizable-panel/use-resizable-width.ts`,
  `libs/web-ui/src/components/theme-toggle/theme-toggle.tsx` — the pre-existing unguarded
  `localStorage` reads now fall back in `try/catch`, so the page renders when storage is blocked.

## Gates

- `QUICK`: `Test Files 221 passed (221)`, `Tests 3917 passed (3917)`, coverage
  `All files | 98.51 | 91.05 | 99.19 | 99.51` — lines 99.51% ≥ 99%.
- `BEHAVIOUR` (`test:coverage:behaviour`): 57 features / 459 expanded scenarios; the new scenarios
  now report as bound (was twelve missing before implementation).
- `E2E` (flow-scoped to `learning-progress`, Chromium/Firefox/WebKit, `--workers=1`): **`36 passed`**
  (the twelve scenarios × three browsers), 0 failed.
- `typecheck` (ayokoding-www and ayokoding-www-fe-e2e) and `lint` exit 0; `web-ui:test:quick` exit 0.

### E2E debugging notes

The first flow-scoped E2E run failed four scenarios × three browsers. Root causes, all defects in
the new E2E step files (fixed in the steps, no app weakening):

- Two context-bar scenarios used `/\bPage 2 of \d+\b/`; the bar's concatenated text is
  `…Course 1 of 3Page 2 of 6…`, so the leading `\b` never matched. Pattern simplified to
  `/Page 2 of \d+/`.
- S1 required every recorded request to be `GET`, but the page carries a third-party Google
  Analytics `POST` beacon. Narrowed to: no request carries the key or the record (any origin), and
  every request to the app's own origin is `GET`.
- S4 asserted zero `role="alert"` elements, but lesson content legitimately renders web-ui `<Alert
role="alert">` callouts; changed to assert that no alert reports an error.

### Deferred: Phase 3 DEV screenshot

The Phase 3 Gate's `DEV` + 1280×800 screenshot item is deferred for the same host reason as Phase 0's
(the `nx dev` server accepts TCP but stops responding under memory pressure); the same screens are
captured as `phase-10-*` evidence in Phase 10.
