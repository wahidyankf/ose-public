# Phase 1 — Pure Core

Date: 2026-10-14. Execution branch `ayokoding-learn-revamp-04-learning-experience`.

Seven pure modules under `apps/ayokoding-www/src/features/learning-progress/core/`, unit-tested,
with no React, storage, or Next.js imports.

## Gherkin trace table (this phase adds no scenario)

| Module                    | Scenarios served        |
| ------------------------- | ----------------------- |
| `progress-schema.ts`      | S1–S7                   |
| `progress-state.ts`       | S1–S7                   |
| `lesson-sequence.ts`      | S10, S12–S16, S33       |
| `course-location.ts`      | S10, S11, S17           |
| `lesson-path-context.ts`  | S10, S11, S17           |
| `progress-derivations.ts` | S19, S24, S25, S35      |
| `next-step.ts`            | S21, S22, S28, S33, S34 |

## RED → GREEN

Run form: `env -u NODE_ENV rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . --cwd apps/ayokoding-www -- npx vitest run --project unit <files> --maxWorkers=1`

1. **RED (schema + state)** — `progress-schema.unit.test.ts` and `progress-state.unit.test.ts` fail:
   `Cannot find package '@/features/learning-progress/core/progress-schema'` (same for `progress-state`).
2. **GREEN (schema + state)** — `Test Files 2 passed (2)`, `Tests 32 passed (32)`.
3. **RED (lesson sequence + location)** — both fail: `Cannot find package '…/core/lesson-sequence'` /
   `…/core/course-location`.
4. **GREEN (lesson sequence + location)** — `Test Files 2 passed (2)`, `Tests 14 passed (14)`. First run
   had one synthetic-fixture defect (root `overview` and `learning` both weight 1, so the slug tie-break
   ordered them wrongly); real content was checked (`extending-neovim/overview.md` weight 1 vs
   `learning/_index.md` weight 103) and the **fixture** corrected — no assertion or module changed.
5. **Corpus** — `lesson-sequence.corpus.unit.test.ts` and `progress-schema.corpus.unit.test.ts` read the
   real English content from `process.cwd()` the way plan 03's start-slug corpus check does
   (`FileSystemContentRepository` → `buildTrees` → `findSubtree` → `resolveCourseStartSlug`, `isRealPage`
   from the real content map). `Test Files 2 passed (2)`, `Tests 4 passed (4)`, printing:
   `lesson-sequence corpus: courses=182 pages=873 skippedSyntheticPages=269`.
6. **RED (path context, derivations, next step)** — all three fail: `Cannot find package '…'`.
7. **GREEN (path context, derivations, next step)** — `Test Files 3 passed (3)`, `Tests 33 passed (33)`.
8. **REFACTOR** — one shared `isCourseDone` helper in `progress-derivations.ts`, reused by
   `phaseProgress`, `pathProgress`, `courseNextTarget`, and `resolvePathNextStep`. The React/Next/window
   import check
   (`rtk git grep --no-index -n "from \"react\"\|from \"next\|window\." -- apps/ayokoding-www/src/features/learning-progress/core`)
   prints nothing.

## Phase 1 Gate

- `QUICK` (prescribed command, `--maxWorkers=1`): **exit 0**, `Test Files 208 passed (208)`,
  `Tests 3792 passed (3792)`, coverage `All files | 98.39 | 90.6 | 99.13 | 99.47` (lines 99.47% ≥ 99).
  The new `learning-progress/core` modules report 100% line coverage each.
- Independent re-run of the nine new test files: `Test Files 9 passed (9)`, `Tests 83 passed (83)`.
- `rtk git status --short` lists only the two new untracked directories plus `<plan>/`.

## Notes

- `corePhases` and `isPendingSkillsRestructure` are imported under their merged names from
  `@/features/course-paths/core/path-phases` and `…/skills-restructure-allowlist`. `extensionPhases` has
  no Phase-1 consumer (per-phase extension counts flow through the phase-agnostic `phaseProgress`), and
  importing it unused would fail `noUnusedLocals`; its first real consumer is Phase 4's roadmap.
- No pattern widening was needed: Phase 0 found zero non-matching course ids, page paths, or path ids.
