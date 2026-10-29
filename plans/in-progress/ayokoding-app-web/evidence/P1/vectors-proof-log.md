# P1D vector snapshot — shared expected results

Command (from worktree root, HIPPO `ephemeral/standard`):

```bash
rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npx tsx local-tmp/plan/ayokoding-app-web/P1D/make-vectors.ts
```

Output:

```text
wrote test-vectors/benchmark.json
wrote test-vectors/calculator.json
wrote test-vectors/url-state.json
```

An earlier run failed loudly on a non-encode-stable calculator query
(`refrole=senior_swe` is the default and encodes to nothing); the guard
caught it, the query was corrected, and only encode-stable queries were
recorded.

## `test-vectors/benchmark.json`

- `compositeIndex` / `scoredBenchmarks` / `tiers` / `blendedPrice` for
  `glm-5.3`, `kimi-k3`, `claude-opus-5` (ultra), `gpt-5.6-sol` (planning),
  `claude-sonnet-5` (execution), `gemini-4-argon` (no price → null),
  `claude-haiku-4-5` and `composer-2.5` (insufficient → null).
- `priceRatio`: `gpt-6-luna`/`claude-sonnet-5` = 0.05; unpriced candidate →
  null.
- `filterCounts`: `{}` → 93, `cursor` → 29, `ultra` → 9,
  `command-code-pro`+`planning` → 3, `opencode-go` → 30 (matches the roster
  invariants pinned by the existing data tests).
- `substitutes`: `glm-5.3` in `command-code-pro` → kind `matches`,
  18 options pinned as `{ id, tier, index }` (first: `claude-sonnet-5-5`,
  `gpt-6-sol`, `grok-4.7`).

## `test-vectors/calculator.json`

- `essentialsLocal` / `netUsd` / `savingsRow` for Singapore, Jakarta,
  San Francisco (single + family households, center + rural).
- `minimumRole` baselines `[0, 2000, 8000, 50000, 1000000]` →
  `swe_1`, `swe_1`, `senior_swe`, `fellow`, `null`.
- `format`: `fmtNum`/`fmtCurrency` pairs (`1234.567` → `1,235`, etc.);
  `dualCurrency` display strings.
- `roleMedianGrossUsd` for three city/role pairs; `policy`
  (`areaMultipliers`, `sublinearDamping: 0.5`).

## `test-vectors/url-state.json`

- 5 benchmark queries (empty, single filter, tier, full finder state,
  sub-harness only) with decoded states; `benchmarkRosterScope` en + id
  (`OpenCode Go and Command Code` / `OpenCode Go dan Command Code`).
- 5 calculator queries (empty, savings+gross, geo+household, Japan scope,
  full min-role baseline with blank-vs-zero and non-default currencies).

These files are fixed expectations: the characterization tests assert the
current implementation reproduces them, the lib tests assert every vector
id/key resolves in the JSON, and the Go port will run against the same
files. A mismatch returns to extraction, never to an edited expectation.
