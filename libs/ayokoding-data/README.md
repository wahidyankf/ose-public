# ayokoding-data

Language-neutral shared datasets for the AyoKoding tools (AI benchmark and
cost-of-living calculator). One JSON source of truth, read by the TypeScript
adapters in `apps/ayokoding-www` today and by the Go port tomorrow.

## Layout

- `data/ai-benchmark.json` — evaluated benchmark dataset, scoring
  configuration, operators, and price sources.
- `data/cost-of-living.json` — evaluated country/city dataset plus the role
  matrix (`roleMatrix`), each with its own snapshot date.
- `data/fx.json` — the authoritative FX snapshot. City USD rates are derived
  from this table; no city stores its own rate.
- `test-vectors/` — checked-in expected results (scoring, cost, savings,
  minimum role, formatting, query encoding) shared by every runtime.
- `provenance.md` — snapshot dates, sources, and refresh policy.
- `tests/unit/data.test.ts` — in-memory structural, provenance, and vector
  consistency tests. No product service or export daemon lives here.

## Consumers

`apps/ayokoding-www/src/features/ai-benchmark/core/data/*.ts` and
`apps/ayokoding-www/src/features/cost-of-living-calculator/core/data/*.ts`
are typed adapters over these files: same module paths, same named exports.
`apps/ayokoding-www/project.json` pins the shared files as cache inputs so a
data edit invalidates the app's proof.

## Refresh policy

Do not refresh data values or source dates during the format migration. To
re-source a dataset, follow the prompt docs referenced in `provenance.md`,
then re-run the P1D extraction and vector snapshots and keep every proof
green: a value mismatch returns to extraction, never to an edited expectation.

## Behaviour coverage

`behaviour-coverage.json` declares the planned `specs/libs/ayokoding-data`
corpus as `pending` until the three-entry specification corpus lands; the
unit adapter over `tests/unit` is already enforced.
