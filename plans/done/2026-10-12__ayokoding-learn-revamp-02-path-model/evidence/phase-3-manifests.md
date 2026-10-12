# Phase 3 Proof — Manifests

## AC-3.1 RED (before data)

`UNIT-NODE` the three files: 25 failed / 12 passed — integrity failed for all 8 manifests
(legacy files normalized to one `all-courses` phase, no marker, old prerequisites), marker usage
failed (4 unused allowlist entries); membership (8) and skills order (4) passed. Raw output:
`local-tmp/ayokoding-learn/plan-02/ac31-red-output.log` (scratch, deleted at cleanup).

## AC-3.2 GREEN (after migration)

Reran the three `UNIT-NODE` files: **37/37 passed** — zero violations for all 8 manifests with
real frontmatter, clean marker usage, membership unchanged, skills order unchanged. No closure or
core-mismatch divergence: the data matches tech-docs/004 as authored.

- Agent A: 43 prerequisite files (see `phase-3-prerequisites.md`).
- Agent B: 4 career manifests replaced with their "Target JSON" blocks; 4 skills manifests with
  their "What Plan 02 Writes" blocks (markers `plan-06`/`plan-07`); all 8 parse as JSON; skills
  titles/descriptions byte-identical to HEAD.
- Agent C: 6 fixture manifests rewritten (same courses/order, listed phases + `assumes`, core
  outcome `{"can": "complete this fixture path"}`); `generalist-track` has core + extension and
  gains only `capstone-secure-service`; all 6 parse as JSON.

## AC-3.3 REFACTOR

`careers/*.unit.test.ts` + `skills/*.unit.test.ts` read `phases` (flattened via
`normalizeCourseRef`) where they asserted on the file's `courseOrder`; intent kept.
`UNIT-NODE tests/unit/features/course-paths/manifests`: 9 files / 56 passed.
4 new scenarios bound in `fe-steps/core-closure.steps.ts` (same AC-3.1 loaders):
`UNIT-FE core-closure.steps.ts` 49 passed; `BEHAVIOUR` exit 0.

## Phase 3 gate

- `QUICK` exit 0 (direct; 175 files / 3468 tests).
- `BEHAVIOUR` exit 0.
- `E2E-BEHAVIOUR` exit 0.
- `E2E` exit 0 — chromium 346, firefox 344 (+2 skipped), webkit 344 (+2 skipped), fresh
  `--skip-nx-cache` build with fixture env.
- `INTEGRATION` exit 0.
- `VALIDATE-INDEXES` exit 0.
