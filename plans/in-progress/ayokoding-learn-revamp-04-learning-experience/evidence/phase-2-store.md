# Phase 2 — Progress Store, Hook, and Shared Components

Date: 2026-10-14. Execution branch `ayokoding-learn-revamp-04-learning-experience`.

## Gherkin note

This phase adds no scenario. S1, S2, S4, S5, S8, and S9 bind in the phases that render them
(Phase 3 lesson pages, Phase 4 roadmap, Phase 6 Learn home, Phase 8 accessibility).

## Files

Created under `apps/ayokoding-www/src/features/learning-progress/shell/`: `progress-storage.ts`
(`ProgressSnapshot`, `ProgressStore`, `createProgressStore`, lazy `learningProgressStore`),
`use-learning-progress.ts`, `progress-meter.tsx`, `course-status-label.tsx`,
`progress-placeholder.tsx`, `storage-notice.tsx`.
Created tests under `apps/ayokoding-www/tests/unit/features/learning-progress/`:
`progress-storage.test.ts` (17), `use-learning-progress.test.tsx` (1), `progress-meter.test.tsx` (4),
`course-status-label.test.tsx` (2), `progress-placeholder.test.tsx` (1), `storage-notice.test.tsx` (2),
`progress-translations.test.ts` (3).
Modified: `src/features/i18n/core/translations.ts` (the 11 `status*`/`progress*` keys in both locales;
`translations` exported for the key-parity test).

## RED → GREEN

`env -u NODE_ENV rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . --cwd apps/ayokoding-www -- npx vitest run … --maxWorkers=1`

| Step                    | Exit | Key output                                                       |
| ----------------------- | ---- | ---------------------------------------------------------------- |
| RED store               | 1    | `Failed to resolve import "…/shell/progress-storage"`            |
| GREEN store             | 0    | `Test Files 1 passed (1)`, `Tests 17 passed (17)`                |
| RED hook                | 1    | `Failed to resolve import "…/shell/use-learning-progress"`       |
| GREEN hook              | 0    | `Tests 1 passed (1)`                                             |
| RED components + keys   | 1    | `Test Files 5 failed \| 2 passed`, `Tests 3 failed \| 18 passed` |
| GREEN components + keys | 0    | `Test Files 7 passed (7)`, `Tests 30 passed (30)`                |

## Phase 2 Gate

- `QUICK` (prescribed command, `--maxWorkers=1`): **exit 0**, `Test Files 215 passed (215)`,
  `Tests 3822 passed (3822)`, `All files | 98.45 | 90.72 | 99.16 | 99.49` — lines 99.49% ≥ 99%.
- Hydration test: `use-learning-progress.test.tsx > renders the placeholder on the server and hydrates
to the stored progress with no hydration error` — `1 passed`; the test asserts the `console.error`
  spy never sees a message matching `/hydrat|did not match/i`, so **zero hydration errors**.
- `rtk git grep -n "localStorage" -- apps/ayokoding-www/src/features/learning-progress` shows only a
  doc comment in `core/progress-schema.ts` (Phase 1) and `shell/progress-storage.ts` itself; the only
  real access is `shell/progress-storage.ts` (`() => window.localStorage`). Rule 7 holds.
- `typecheck` exit 0; `lint` exit 0 (0 errors).
