# Phase 6 Proof — Contract the Manifest Schema

## RED

- `core/schemas.test.ts`: replaced case (q) with "a file containing `courseOrder` is
  rejected" + new "an unknown top-level key is rejected". Both failed pre-contract (legacy
  union still parsed). Also rewrote cases (a)/(b) to the phase shape — they asserted success
  on legacy files and would otherwise fail post-contract for the wrong reason.

## GREEN

- Removed the legacy union branch + normalization from `core/schemas.ts`; kept `.strict()`
  on `PathManifestFileSchema` (now exactly the phase shape). Marked skills files keep their
  literal `all-courses` phase as data.
- `UNIT-FE schemas.test.ts`: 24 passed.

## REFACTOR

- `expand-contract` grep: only unrelated course-content prose hits remain; no code marker.
- `all-courses` grep: only the 4 skills manifests (data), `skills-restructure-allowlist.ts`,
  the schema's marked-shape error message, and test files.
- `manifest-repository.test.ts` migrated to phase-shaped fixture files (4 cases failed
  post-contract — they wrote legacy files the contract now correctly rejects; same intent,
  new shape). 31/31 with schemas.test.ts.
- `path-model-integrity.unit.test.ts` + membership + skills-order: unchanged, still green
  (they load real phase-shaped manifests).

## Phase 6 gate

- `QUICK` exit 0 (direct; 183 files / 3560 tests).
- `BEHAVIOUR`, `E2E-BEHAVIOUR`, `INTEGRATION` exit 0.
- `BUILD` exit 0 (fresh `--skip-nx-cache` build with fixture env).
- `E2E` exit 0 — chromium 354, firefox 352 (+2 skipped), webkit 352 (+2 skipped).
  One `ECONNRESET` transport failure on the rehome catalog-fetch scenario under parallel load
  (chromium + webkit first runs); passes solo (13.7s) and on full-suite reruns — environmental
  burst-load flake, unrelated to the diff (no redirect/drilling surface touched). No test
  loosened, skipped, or deleted.
