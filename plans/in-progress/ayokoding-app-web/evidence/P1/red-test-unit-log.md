# P1D RED — characterization before the shared-data adapter

Command (from worktree root, HIPPO `ephemeral/standard`):

```bash
rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ayokoding-www:test:unit
```

Date (UTC): 2026-10-29. Baseline revision: `c17beb3a27bf270c912b42c45a6cc3c49bdbca74`
(plan text synced from `origin/main@af40b276d` per parent direction).

## Result: FAIL (expected — missing shared-data adapter)

- Test Files: 41 failed | 212 passed (253)
- Tests: 22 failed | 3626 passed (3648)
- Duration: ~621 s

## The 22 failing assertions (all in the two new characterization files)

`tests/unit/features/ai-benchmark/core/data/shared-data.unit.test.ts` — 12 tests, 10 failed:

- publishes the neutral dataset JSON
- publishes the shared benchmark and url-state vectors
- records the dataset date and sourcing provenance
- carries the same models in the same order
- carries the same scoring configuration
- carries the same operators and price sources
- keeps absent optional fields absent in the JSON
- reproduces every shared vector case
- keeps the roster scope wording from the defining constants
- round-trips every shared benchmark url-state vector

`tests/unit/features/cost-of-living-calculator/core/data/shared-data.unit.test.ts` — 15 tests, 12 failed:

- publishes the neutral country/city and fx JSON files
- publishes the shared calculator and url-state vectors
- records both dataset dates and sourcing provenance
- carries the same countries and cities in the same order
- keeps the fx table in its own file with its independent snapshot date
- carries the same role matrix with its own snapshot date
- keeps absent optional fields absent in the JSON
- resolves every city currency through the shared fx table
- reproduces every shared calculator vector case
- keeps the minimum-role examples on their ladder rungs
- keeps the dual-currency display format
- round-trips every shared calculator url-state vector

Every failure is a missing-artifact assertion (`shared artifact missing:
libs/ayokoding-data/...`), showing the missing shared-data adapter. The 5
passing tests in these files lock codec behavior (first-value duplicates,
default omission, blank-vs-zero) that already holds.

## Other 39 failed files: pre-existing, unrelated to P1D

All are `unit-fe` suite-collection failures with `Error: Failed to resolve
import "mermaid" from "src/features/content/shell/mermaid.tsx"`. The
`mermaid` package is installed at the root `node_modules`; the failure is in
vite resolution during collection, in suites none of my files touch. Recorded
as a pre-existing baseline/environmental failure for the coordinator (P0
territory); the failing set is byte-identical before and after my change
(GREEN run keeps exactly these 39).
