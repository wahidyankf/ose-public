# Phase 4 proof — Minimal Phase UI (AC-4.1–AC-4.6)

Branch `ayokoding-learn-revamp-02-path-model`, worktree `worktrees/ayokoding-learn-revamp-02-path-model`.
Gherkin-first was done by the prior session (features + RED in
`local-tmp/ayokoding-learn/plan-02/phase-4-gherkin-red.log`); this file proves the CODE half.
`delivery.md` checkboxes left unticked; nothing committed.

Conventions: per-AC RED/GREEN/REFACTOR. `UNIT-FE <file>` run directly
(`cd apps/ayokoding-www && npx vitest run --project unit-fe <file>`); every gate command
(QUICK, BEHAVIOUR, E2E-BEHAVIOUR, E2E-QUICK, INTEGRATION, VALIDATE-INDEXES) run via the
prescribed hippo wrapper. E2E build/bddgen/playwright run directly per the delivery prescription.
Substitution rationale: hippo ephemeral sandboxes shed under memory pressure on this host;
direct runs are the documented fallback. NEVER loosened/skipped/deleted a test.

## AC-4.1 — Outline IDs reach the client

- RED (`UNIT-FE course-library.test.ts course-path-nav.test.ts`): 4 failed / 40 passed —
  2 `deriveOutlineCourseIds` cases (module missing) + passthrough/EMPTY cases
  (`expected undefined to deeply equal []`).
- GREEN: `deriveOutlineCourseIds(contentMap)` in `shell/course-library.ts` (locale-independent,
  with the TSDoc explaining why); `outlineCourseIds` on `CoursePathData`/`CoursePathClientData`
  - plus `EMPTY_...` and passthrough in `shell/course-path-nav.ts`; filled in `shell/route-path-data.ts`.
    Rerun incl. new `route-path-data.test.ts` locale case: 48 passed (3 files).
- REFACTOR: TSDoc kept; `npx tsc --noEmit` clean after updating every typed
  `CoursePathData`/`CoursePathClientData` literal (course-path-nav, use-runtime,
  course-page-path-content, mobile-nav-runtime tests) and the two untyped mocks
  (responsive, static-delivery). QUICK deferred to the cumulative run below.

## AC-4.2 — Phase sections, outcomes, extension heading, "Before you start" on the landing

- RED (`UNIT-FE outline-badge|assumed-courses|phase-section|path-landing`): 3 files fail on
  missing modules; `path-landing.test.tsx` 7 new cases fail against the old flat view.
- GREEN: new `shell/outline-badge.tsx` (`Badge` `variant="secondary"` `size="sm"`),
  `shell/assumed-courses.tsx` (canonical links, no `?path=`; `null` when empty),
  `shell/phase-section.tsx` ("Phase n" badge core-only, outcome lines, `OutlineBadge` rows,
  `startPosition` continuity via plan 01's `PathPositionNumber`); `shell/path-landing.tsx`
  renders them inside the existing syllabus `<nav>`; 10 i18n keys added to both locales.
  Rerun: 32 passed (4 files).
- REFACTOR: old flat-list code removed from `path-landing.tsx`; `tsc` clean (one test-side
  `TS2532` fixed in the new cases).

## AC-4.3 — Phase groups in the rail and drawer

- RED (`UNIT-FE phase-group|path-rail`): `phase-group` import-fail; 5 new rail cases fail
  (5 failed / 11 passed).
- GREEN: new `shell/phase-group.tsx` ("Phase n · Title" core / title-only extensions,
  `OutlineBadge` rows, current-row ref); `shell/path-rail.tsx` renders groups for desktop rail
  and drawer (drawer reuses `PathRail` via `MobileNav`) with the "Optional extensions" divider.
  Rerun: 22 passed (one test-side `▸` regex fix).
- REFACTOR: flat-list code removed; plan 01 auto-scroll test green; `tsc` clean. The rail scroll
  container is now the groups wrapper `<div>` (same overflow lookup the helper performs).

## AC-4.4 — Arc preview and careers hub strapline

- RED: `syllabus-preview.test.tsx` + `arc-landing.test.tsx` rewritten to
  "Starts with Phase 1 · \<title>:" + phase courses → 3 failed / 7 passed;
  `path-card.test.tsx` strapline mirror updated.
- GREEN: `shell/syllabus-preview.tsx` takes `{locale, phaseTitle, courseTitles}`
  (`FIRST_PHASE_PREVIEW_COUNT` gone); `shell/arc-landing.tsx` passes the first phase
  (via `.slice(0, 1).map`, no unchecked index); careers strapline in `[...slug]/page.tsx`
  → "A focused core for your goal, then optional depth". Rerun: 25 passed (3 files).
- REFACTOR: `git grep -n FIRST_PHASE_PREVIEW_COUNT -- apps/ayokoding-www` → nothing (exit 1);
  `git diff --stat origin/main -- .../category-landing.tsx .../ramp-milestone-strip.tsx
.../path-card.tsx content/en/learn/paths/skills` → empty. `tsc` clean (one stale
  `SyllabusPreview` usage in `path-position-numbers.steps.tsx` updated). Production wiring done
  here too: `page.tsx` passes `outlineCourseIds` + content-map-resolved `assumedCourseTitles`;
  `SidebarHost`/`MobileNav` pass `outlineCourseIds` to `PathRail`.

## AC-4.5 — Marked skills paths render as today

- RED (`UNIT-FE path-landing|path-rail`): 3 new marked cases fail — the phase view renders
  ("Phase 1 · All courses" label found in landing, rail, and drawer; drawer harness verified
  failing on the assertion, not the setup). 33 passed alongside.
- GREEN: `isPendingSkillsRestructure(manifest)` flat branches in `path-landing.tsx` and
  `path-rail.tsx`, reusing plan 01's numbering (`PathPositionNumber` / `RailCourseRow`,
  extracted so grouped and flat rows share one definition), each marked
  `// Decision 39: removed by plan 07`. Rerun: 42 passed (3 files); `tsc` clean.
- REFACTOR: markers in place. Cumulative `QUICK` (hippo): first run failed as expected —
  4 fe-steps suites failed to load on the reworded texts (arc-landing-one-role,
  course-paths-breadcrumb, outline-course-status, path-order-nav) + 2 `route-paths-hub`
  terminal-landing tests crashed on pre-phase synthetic manifests
  (`resolution.manifest.assumes is not iterable`). Fixed by the AC-4.6 step-text updates and by
  migrating the test helper to phase-shaped manifests (root cause: stale test data, not product
  code). Rerun: `QUICK` exit 0 (typecheck + lint + full unit incl. 99% line gate + coverage).

## AC-4.6 — Scenario bindings (unit and E2E)

- RED (unit): the QUICK run above proved it — the 4 reworded-scenario step files failed
  (`undefined step` load errors naming the new texts); new-behaviour RED proven at shell level
  in AC-4.2–4.5.
- RED (E2E): `E2E-BEHAVIOUR` after writing all bindings named exactly one gap —
  `path-phases … / the link preserves the path context query parameter: undefined E2E binding`
  (singular vs the pre-existing plural step). Added the singular binding → exit 0.
- GREEN: new `tests/unit/fe-steps/path-phases.steps.tsx` (7 scenarios; S7 binds the AC-4.5
  assertions) + `path-assumes.steps.tsx` (2); badge scenario in `outline-course-status.steps.tsx`;
  reworded texts in breadcrumb/arc-landing-one-role/path-order-nav steps (unit + E2E);
  `course-paths.steps.ts` binds the 6 browser path-phases scenarios + assumes + badge against
  the generalist-track fixture, plus the runtime-payload scenario via the batch URL from
  `backend-helpers.ts`. Shared `When("a reader opens that path's landing page")` staged per
  scenario via `pendingPathLanding` (default: backend-track). S1 position steps scoped to
  `ol > li` so the assumes `<ul>` never leaks in. Unit rerun: 6 files, 89 passed.
  `BEHAVIOUR` exit 0; `E2E-BEHAVIOUR` exit 0.
- REFACTOR: Phase 4 E2E locators shared (`generalistSyllabus`/`generalistRail`/`phaseRows`/
  `loadGeneralistTrack`); the pre-existing "both links preserve …" step generalized to the
  active `?path=` so both prev/next scenarios share it. `E2E-QUICK` exit 0 (re-run on the
  final file state). `E2E` (fresh build, no hippo; `bddgen`; sequential per-browser):
  chromium 354 passed, firefox 352 passed + 2 skipped, webkit 352 passed + 2 skipped.
  Unexpected-failure log: `evidence/scratch/phase-4-e2e-failures.md` — one real test-authoring
  defect (badge suffix vs `$`-anchored row regex, fixed, verified solo + full rerun) and two
  parallel-contention flakes (rehome catalog-fetch, ia-navigation bare-URLs) that pass solo
  and on full rerun with no code change; the contamination-free final runs are the recorded
  gate results.

## Phase 4 gate

- `QUICK` exit 0 · `BEHAVIOUR` exit 0 · `E2E-BEHAVIOUR` exit 0 · `E2E-QUICK` exit 0 ·
  `E2E` exit 0 (chromium 354 / firefox 352+2 skipped / webkit 352+2 skipped) ·
  `INTEGRATION` exit 0 · `VALIDATE-INDEXES` exit 0 (no drift, no GEN-INDEXES needed).

Review cycles: 0 checker cycles (self-verified RED/GREEN per AC as above).
Preexisting failures fixed: `route-paths-hub.test.tsx` synthetic manifests migrated to the
phase shape (2 tests); `path-position-numbers.steps.tsx` stale `SyllabusPreview` props (16 tests).
BLOCKED: none.
