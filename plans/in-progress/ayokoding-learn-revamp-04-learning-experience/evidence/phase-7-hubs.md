# Phase 7 — Path Cards on the Path Hubs

Date: 2026-10-14. Execution branch `ayokoding-learn-revamp-04-learning-experience`.

## Files

- `src/features/course-paths/shell/careers-arc-sections.tsx` (new); edits to `path-card.tsx` (hub
  sections only — the site-home `hero` variant stays `PathCard`), `category-landing.tsx` (careers:
  `ArcCard` chooser → `CareersArcSections`; skills: `PathCard` → `LearnPathCard`, statement and
  `RampMilestoneStrip` unchanged), and `arc-landing.tsx` (`PathCard` → `LearnPathCard`).
- `src/app/[locale]/(content)/[...slug]/page.tsx` passes `loadLessonPagePaths("en")` from
  `renderPathsRoute`.
- Tests: `tests/unit/features/course-paths/shell/careers-arc-sections.test.tsx` (new) and edits to
  `category-landing.test.tsx`, `arc-landing.test.tsx`, `route-paths-hub.test.tsx`; S32/U3 bound in
  the unit and E2E step files (`learn-home.steps.tsx`, `category-landing-arc-chooser.steps.tsx`,
  `arc-landing-two-role.steps.tsx`, `paths-hub-category-grouping.steps.tsx`, and the E2E
  `course-paths.steps.ts` / `learn-home.steps.ts`).
- Gherkin: S32 added to `learning-progress/learn-home.feature`; U3 applied to
  `course-paths/category-landing-arc-chooser.feature`.

## Gates

- Unit gate (`--maxWorkers=1`): `Test Files 240 passed (240)`, `Tests 4119 passed (4119)`, coverage
  `All files … Lines 99.54` ≥ 99%.
- `typecheck` (ayokoding-www and ayokoding-www-fe-e2e), `lint`, and `bddgen` exit 0.
- Flow-scoped `E2E` (learn-home, category-landing-arc-chooser, paths-hub; Chromium/Firefox/WebKit,
  `--workers=1`): the `learn-home` feature passes **21/21** (7 scenarios × 3 browsers), including the
  previously failing S32; the other filtered features pass too.

### Fixes found while getting the E2E green

- S32's flat pending-restructure skills path renders "N of M courses done" (all courses) rather than
  "core courses done"; the assertion now matches by the manifest's `restructurePendingIn`.
- S32's `readPathCards` helper took the first `/en/learn/paths/…` link in a broad `li`, which on the
  skills landing was the **sidebar rail** entry (its href is byte-identical to the card's, and its
  label is the content page's title "Conventional Accounting"). The helper now excludes the page
  chrome (`nav[aria-label="Sidebar navigation"], header, footer`) and reads the card's own title link.
- The uncommitted step file had a pre-existing `HomeManifest` type gap (`restructurePendingIn`), which
  broke `ayokoding-www-fe-e2e:typecheck`; the option was added.

`rtk git grep -n "<PathCard" -- apps/ayokoding-www/src` shows only the site-home hero use.
