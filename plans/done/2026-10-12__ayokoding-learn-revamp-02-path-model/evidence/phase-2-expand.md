# Phase 2 Proof — Expand the Manifest Schema and Add Pure Path-Model Functions

Branch `ayokoding-learn-revamp-02-path-model`. Plan 03 confirmed not landed (no `estimatedHours`
in `content/core/schemas.ts`), so the simple expand form applies.

## Gherkin

- Created `specs/apps/ayokoding/www/behaviours/frontend/course-paths/core-closure.feature`
  (10 scenarios, each with both exemption comments and `@integration-exempt` `@e2e-exempt` tags).
- Reworded `manifest-integrity.feature` + `prerequisite-consistent-ordering.feature`:
  "lists a courseOrder of course IDs" → "lists phases of course IDs".
- RED: BEHAVIOUR failed naming only the new/reworded scenarios (recorded pre-subagent;
  resumed work re-verified GREEN post-binding).

## AC-2.1 — schema expand

- RED: new cases in `core/schemas.test.ts` failed (phase parse, missing outcome, empty phase,
  bad phase ID, legacy normalisation).
- GREEN: `phaseOutcomeSchema`, `pathPhaseSchema`, `PathManifestFileSchema` + legacy union with
  `all-courses` normalisation in `core/schemas.ts`; `PathPhase` exported and re-exported from
  `core/manifest.ts`.
- REFACTOR: legacy branch marked `// expand-contract: removed in Phase 6`; `PathManifest`
  literal tests switched to `manifestFixture` (incl. `course-path-manifest.steps.ts`), no casts.

## AC-2.2 — phase helpers

- RED: `path-phases.test.ts` failed (module missing).
- GREEN: `core/path-phases.ts` (`corePhases`, `extensionPhases`, `phaseOfCourse`; position is
  1-based in the path).
- REFACTOR: TSDoc names plan 04 as consumer.

## AC-2.3 — computeCore

- RED: `path-core.test.ts` failed (module missing).
- GREEN: `core/path-core.ts` (`computeCore`, BFS, `ReadonlySet`).
- REFACTOR: `PrerequisitesByCourse` imported from `core/prerequisites.ts`, no duplication.

## AC-2.4 — checkPathModelIntegrity (R1–R8)

- RED: new integrity cases failed; the path-nav cross-boundary case already passed (pins existing
  behaviour — Next walks `courseOrder`, no change needed). Recorded per plan.
- GREEN: `PathModelContext`, `PathModelViolations`, `checkPathModelIntegrity`, `isCleanPathModel`
  in `core/manifest-integrity.ts` (marker parts excluded; `checkManifestIntegrity` signature kept,
  reads derived `courseOrder`).
- REFACTOR: one small named function per rule; module stays pure (no IO, no `console`).

## AC-2.5 — closed skills marker (R9)

- RED: new cases in `skills-restructure-allowlist.test.ts`, `core/schemas.test.ts`, and
  `manifest-integrity.test.ts` failed.
- GREEN: `core/skills-restructure-allowlist.ts` (`SKILLS_RESTRUCTURE_ALLOWLIST`,
  `isMarkedShape`, `isPendingSkillsRestructure`, `checkMarkerUsage`); `restructurePendingIn` +
  marker `superRefine` branch in `core/schemas.ts`; `markerNotAllowed` + marked exemption in
  `checkPathModelIntegrity`.
- REFACTOR: `// Decision 39: plan 06 removes the accounting entries; plan 07 deletes this module`
  atop the allowlist module and beside the schema field.

## Frozen inputs (hand-copied from manifests on this branch, verified)

- `tests/unit/features/course-paths/manifests/legacy-membership.ts`: sorted sets.
  IR 116, IE SE 114, IE AI 26, FS 121, skills 19 / 24 / 27 / 30. All four real manifests have
  unique course IDs (no duplicates pre-change).
- `tests/unit/features/course-paths/manifests/legacy-skills-order.ts`: unsorted orders,
  19 / 24 / 27 / 30. Each array verified byte-equal to its syllabus "What Plan 02 Writes" list
  (`manifest-skills-*.md`): ALL MATCH.

## Scenario bindings

- Created `tests/unit/fe-steps/core-closure.steps.ts` (10 scenarios bound to
  `checkPathModelIntegrity` / `PathManifestFileSchema` over `manifestFixture` inputs;
  `course-path-manifest.steps.ts` updated to reworded steps).
- `UNIT-FE core-closure.steps.ts`: 36 passed (one authoring fix: `ghost-course` removed from the
  S10 library list so R1 reports it — matches the R9 unit test).
- `UNIT-FE` both step files: 48 passed. `BEHAVIOUR`: exit 0.

## Phase 2 gate

- `QUICK` exit 0 (direct run — hippo shed workaround, same substitution as Phase 1).
- `BEHAVIOUR` exit 0 (hippo).
- `E2E-QUICK` exit 0 (hippo).
- `git diff --stat origin/main -- apps/ayokoding-www/src/features/course-paths/manifests apps/ayokoding-www-fe-e2e/fixtures/manifests` empty — no data changed.
