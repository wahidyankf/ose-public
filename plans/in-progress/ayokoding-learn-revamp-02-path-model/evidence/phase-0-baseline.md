# Phase 0 Baseline — AyoKoding Learn Revamp 02: Path Model

Worktree: `worktrees/ayokoding-learn-revamp-02-path-model/`, branch
`ayokoding-learn-revamp-02-path-model`, base `origin/main` @ `40bb04e00` (promotion PR #683).
Vercel MCP probe: **absent** (no Vercel MCP in this session; plan assumes absent).

## Preconditions

- Plan 01 merged: `plans/done/2026-10-12__ayokoding-learn-revamp-01-navigation-and-display` present on `origin/main`.
- Plan 03 not landed: no `estimatedHours` in `content/core/schemas.ts` on `origin/main` → Phase 1 uses the simple `status: outline` enum, no coordination needed.
- Manifest drift vs `bb7f90137`: empty (no change in real or fixture manifests).
- Prerequisite/status drift vs `bb7f90137`: 2 files changed, both body-only from plan 01
  (link-title reword in `just-enough-go/learning/_index.md`; added overview link in
  `courses/_index.md`); no frontmatter `prerequisites`/`status` change. Course count: exactly 181.
- `plan-quality-gate: FAIL (2 cycles, 1 blocking open)` — see delivery.md `## Plan Quality Gate`;
  the owned row was repaired inline before Phase 0.

## Test baseline (all exit 0)

| Check                                                                                                                            | Result                                                          | Evidence                                                                                                          |
| -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `QUICK`                                                                                                                          | exit 0 with substitution (see note)                             | direct vitest below; typecheck+lint via nx green                                                                  |
| `test:unit` direct (`vitest run --project unit --project unit-fe --coverage --coverage.thresholds.lines=99 --testTimeout=60000`) | exit 0 — 166 files, 3305 tests passed, 99% lines threshold held | `/tmp/p02-unit-direct.log` (scratch, deleted at cleanup)                                                          |
| `BEHAVIOUR`                                                                                                                      | exit 0                                                          | `/tmp/p02-behaviour.log`                                                                                          |
| `E2E-BEHAVIOUR`                                                                                                                  | exit 0                                                          | `/tmp/p02-ebeh.log`                                                                                               |
| `E2E-QUICK`                                                                                                                      | exit 0                                                          | `/tmp/p02-e2equick.log`                                                                                           |
| `E2E`                                                                                                                            | exit 0 with substitution (see note)                             | per-browser runs: chromium 346 passed; firefox 344 passed, 2 skipped; webkit 343 passed, 2 skipped, 1 flake fixed |
| `INTEGRATION`                                                                                                                    | exit 0                                                          | `/tmp/p02-integration.log`                                                                                        |
| `VALIDATE-INDEXES`                                                                                                               | exit 0                                                          | `/tmp/p02-validx.log`                                                                                             |

Note (QUICK): the canonical `QUICK` via hippo sandbox was shed twice by host memory pressure
(`hippo.limit.pressure-shed`, exit 124, no test assertion failed — vitest killed mid-run on both
`standard` and `heavy` tiers). Root cause is environmental, not the tree: the identical flags run
directly pass (166 files / 3305 tests). Typecheck and lint passed via nx inside the same QUICK
invocations. Re-attempt the canonical command at a quieter host moment before Phase 10 if cheap;
otherwise this substitution stands as the baseline.

Note (E2E): the first full run failed 9 scenarios from a stale nx build cache — the cached build
baked real manifests into prerendered pages while the batch endpoint served fixtures
(landing-hero/canonical-fallback mismatches). Root-cause fix: `nx run ayokoding-www:build
--skip-nx-cache` with the fixture env; targeted specs went 9/9 green. Full parallel run then
showed 3 load flakes; per-browser sequential runs are green except one webkit computed-style
flake in `content-rendering.steps.ts` (style race: single-shot `getComputedStyle` before author
styles apply). Root-cause fix committed on the delivery branch: `waitForLoadState("networkidle")`
in both `When` steps — 4/4 green reruns (12/12 each) after the fix.

## Page baselines

- IR career path (en): HTTP 200, flat list, 116 unique course links. Screenshot:
  `phase-0-before-ir-path-en-1280px.png`.
- IR career path (id): HTTP 200, renders the same path page (title identical). Screenshot:
  `phase-0-before-ir-path-id-1280px.png`. Phase 8 compares rendering/status.
- Skills hub + 4 skills paths + accounting course in path context (all HTTP 200): screenshots
  `phase-0-before-skills-*-en-{375,1280}px.png` (14 files) and the syllabus/rail course lists in
  `phase-0-before-skills-lists-en.txt`. Note: `skills/conventional-accounting` renders its 19
  manifest courses plus one prerequisite link (`sql-essentials`); manifest ⊆ page.

## tRPC baseline (dev server :3101, default manifests)

- Success (en): status 200, `content-type: application/json`, 8 manifests each with `courseOrder`
  and no `phases`, no `outlineCourseIds`. Raw body: `local-tmp/ayokoding-learn/plan-02/trpc-en-before.json`
  (scratch, deleted at cleanup).
