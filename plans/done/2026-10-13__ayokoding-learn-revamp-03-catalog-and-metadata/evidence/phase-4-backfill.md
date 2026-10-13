# Phase 4 backfill evidence

- PARTIAL now: `nx affected -t build,test:quick,lint` reaches only `ayokoding-www:build` (exit 0).
- UNIT (direct vitest: project unit 1229 pass; fe features 795 pass; fe-steps all pass incl. canonical-fallback regression fix).
- INTEGRATION (direct + nx): 202 pass.
- Corpus guard (unit + integration `course-metadata.steps`): green — estimatedHours stored equals the computed
  table for all 119 non-outline courses; 62 outlines omit it; all Start pages resolve.
- `git diff -- apps/ayokoding-www/content`: 695 deletions only in the generated catalog `_index.md` list;
  every course file gains only the 2-4 inserted keys (18 multiline-prerequisites files repaired by moving
  the block after the YAML sequence).
- VALIDATE-INDEXES: exit 0.
- E2E/BE-E2E: new-feature specs verified by Playwright runs below; full-suite green is CI's job on the PR.

Browser/API gates (local): new-feature Playwright specs green on chromium (17), firefox, webkit;
sidebar chromium+firefox re-verified after drawer scoping; BE-E2E 37 passed. Full FE E2E suite
(3 browsers x all features) runs on the PR via CI; it cannot fit one local HIPPO run under
current host memory pressure (documented sheds, tests passing at shed point).
