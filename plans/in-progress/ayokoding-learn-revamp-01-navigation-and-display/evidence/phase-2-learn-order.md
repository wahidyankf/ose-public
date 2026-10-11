# Phase 2 Evidence — Overview First in the Learn Sidebar (S8)

> RED/GREEN outputs per delivery.md Phase 2 Proof. All test commands ran with
> `env -u NODE_ENV` (see phase-0-baseline.md environment notes).

## RED

- **Unit** (`UNIT-FE tests/unit/fe-steps/navigation.steps.tsx`): exit 1 — both S8 assertions fail
  (`expected 'Paths' to be 'Overview'`; received order Paths, Courses, Legacy, Overview from the
  real weights 90/95/96/100 read via gray-matter); all 41 pre-existing assertions pass.
- **E2E** (targeted, `--grep "The learn overview is the first entry"`): the scenario fails in all
  three browsers with the y-order evidence (`paths@113, courses@147, legacy@181, overview@215` —
  Overview renders last).

## GREEN

- **Change**: `weight: 101` in `content/en/learn/paths/_index.md`, `weight: 102` in
  `content/en/learn/courses/_index.md`, `weight: 103` in `content/en/learn/legacy/_index.md`
  (overview.md stays 100); `GEN-INDEXES` regenerated `content/en/learn/_index.md` (Overview moved
  from last to first); `VALIDATE-INDEXES` exit 0.
- **Unit rerun**: exit 0 — 43/43 passed.
- **E2E rerun**: the full suite ran per-browser after a fixture-correct rebuild (see the build
  note below): chromium **337 passed**, firefox **1 flaky + 334 passed**, webkit **335 passed**,
  2 skipped each, **0 failed** in any browser. The one flaky entry is the pre-existing
  "Code blocks render with syntax highlighting via Shiki" scenario in firefox (passed on retry,
  unrelated surface).

## Build note (root cause recorded)

Two intermediate E2E runs failed on surfaces this phase does not touch until the root cause was
found: the playwright webServer serves the standalone build, and the build must be produced with
the plan target's exact env (`AYOKODING_WEB_MANIFESTS_DIR=…fixtures/manifests`) AND after the
weight change. A rebuild without the env var baked the real manifests (course-paths fixture tests
failed: hero goal-path card missing, canonical-fallback nav 2→4 links); an nx cache hit restored a
pre-weight-change build (S8 failed in every browser). The passing run above used
`nx run ayokoding-www:build --skip-nx-cache` with the target's env, matching the `E2E` target's
own build step.
