# P1D extraction proof — TS evaluated objects to neutral JSON

Command (from worktree root, HIPPO `ephemeral/standard`):

```bash
rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npx tsx local-tmp/plan/ayokoding-app-web/P1D/extract.ts
```

Output:

```text
wrote data/ai-benchmark.json
wrote data/cost-of-living.json
wrote data/fx.json
cities dataset recomposes from cost-of-living.json + fx.json
```

## What the script checks before writing (fails loudly on any drift)

1. Each payload's `JSON.parse(JSON.stringify(payload))` deep-equals the
   evaluated TS object modulo `undefined`-dropping (recursive
   `stripUndefined` + `node:util.isDeepStrictEqual`). This proves values,
   key order, and numbers transfer exactly, and that optional fields
   (`price`, `costPerTask`, `note`, `releaseDate`, `subNational`) become
   absent JSON keys instead of drifting.
2. The old cities `dataset` (`{ snapshotDate, fx, countries, cities }`)
   recomposes exactly from `cost-of-living.json` + `fx.json`, proving the
   split keeps fx in exactly one home.

## Artifacts (all new, all under `libs/ayokoding-data/`)

- `data/ai-benchmark.json` — `{ dataset, benchmarks, operators,
priceSources }`; 93 models, `lastUpdated` 2026-10-14; model without price
  (e.g. `gemini-4-argon`) carries no `price` key.
- `data/cost-of-living.json` — `{ snapshotDate, countries, cities,
roleMatrix: { snapshotDate, ladder, salaries } }`; 28 countries,
  31 cities, 15 ladder rungs, 28 salary countries; both snapshot dates
  `2026-07-30`.
- `data/fx.json` — `{ fxSnapshotDate: 2026-07-29, ratesUsdPerUnit }`;
  independent of the dataset dates by construction (separate file, separate
  date, asserted different by tests).

No value, date, or note was refreshed: the JSON is the evaluated TS output.
