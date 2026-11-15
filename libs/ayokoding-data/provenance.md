# Provenance — ayokoding-data

How each dataset was sourced, when it was last checked, and the rules its
numbers obey. Values and dates below are copied verbatim from the source
comments that used to live only in the TypeScript data modules; nothing here
was re-sourced during the JSON migration.

## AI benchmark — `data/ai-benchmark.json`

- **Last checked as a whole:** `2026-11-15` (`dataset.lastUpdated`). The
  November figures refresh re-read every operator board: AA Coding Agent Index
  v2.1 (DeepSWE dropped, Terminal-Bench 4.1, re-graded SWE-Atlas-QnA-AA),
  Datacurve DeepSWE v1.1 (unchanged), AA Terminal-Bench 4.0 eval (top-3),
  official Terminal-Bench board (moved to 4.1, unusable for 4.0), Vals AI
  Terminal-Bench 4.0 (updated 2026-11-11, top-3 named), Scale SWE-Atlas QnA
  board (unchanged figures). Version pins kept (DeepSWE 1.1, Terminal-Bench
  4.0, SWE-Atlas QnA); figures follow the operator order against current
  publications, unchanged historical figures kept where no current pinned
  figure exists. Added the FrontierCode-AA 2.0 benchmark (fourth composite
  parameter, equal weight) from AA's per-model runs. No roster rows added or
  removed; no model is older than two years.
- **Roster rule.** Every model from the four frontier vendors (Anthropic,
  OpenAI, Google, xAI); every model on the catalog harnesses (OpenCode Go and
  Command Code) with an identified vendor; each listed harness's own in-house
  models (`Cursor Composer`), keeping up to three generations of each line
  that are still served. A serving variant a catalog lists under its own id
  is its own row.
- **Figure priority.** Independent runs only; for each (model, benchmark) the
  first available source wins:
  1. Artificial Analysis Coding Agent Index v1.5 — the model's best published
     configuration in its own harness (multi-model combinations excluded);
  2. DeepSWE: Datacurve's v1.1 board (best effort level);
     Terminal-Bench 4.0: Artificial Analysis' evaluation page, then the
     official board, then Vals AI; SWE-Atlas QnA: Scale AI's board.
- **Price fallback.** The vendor's standard API rate per 1M tokens; where the
  vendor publishes no reachable price page, the OpenCode-listed rate for a
  model an OpenCode harness sells (`listedBy: "opencode"`), else the Command
  Code-listed rate (`listedBy: "commandcode"`).
- **Operator checks.** All five operator pages last read `2026-11-15`.
  Source-stated updates: Datacurve `2026-09-22`, Terminal-Bench official board
  now 4.1 (`2026-11`), Vals AI 4.0 board `2026-11-11`. Pricing pages last read
  `2026-11-14`.
- **Scoring configuration.** Four composite benchmarks (DeepSWE 1.1,
  Terminal-Bench 4.0, SWE-Atlas QnA, FrontierCode-AA 2.0), equal weights,
  pinned operator order, minimum coverage of 2, anchored tiers (ultra →
  `claude-opus-5`, planning → `gpt-5.6-sol`, execution → `claude-sonnet-5`),
  blend ratio 3:1 input:output tokens.
- **Re-sourcing:** `apps/ayokoding-www/docs/ai-benchmark/data-sourcing-prompt.md`.

## Cost of living — `data/cost-of-living.json`

- **Snapshot date:** `2026-07-30` (countries/cities and role matrix alike).
- **Sources.** Numbeo (June–July 2026), PwC Worldwide Tax Summaries,
  national tax and social-security authorities, and official
  government/education sources, cited inline per field before migration.
- **Salary sources.** levels.fyi (March–July 2026), ravio.com 2026,
  japan-dev.com, tokyodev.com, highfive.global (ID/VN 2026), fullscale.io
  (PH), vietnamdevs.com 2026, nordictechjobs.com, ginitalent.com (BR),
  howdy.com (MX), devopswebdesigners.co.ke (KE), AmbitionBox (IN), SEEK
  (AU), and Glassdoor / Jobstreet / PayScale per-country figures. Proxy
  cells are derived from published multipliers, never fabricated.
- **Confidence tiers.** `high` = primary source, `moderate` = secondary or
  corroborated, `proxy` = derived.
- **Scope.** Tech-hub cities worldwide excluding Israel.
- **Re-sourcing:** `apps/ayokoding-www/docs/cost-of-living-calculator/data-sourcing-prompt.md`.

## FX — `data/fx.json`

- **Snapshot date:** `2026-07-29`, independent of the cost-of-living
  snapshot date above.
- **Sources.** ECB Euro reference rates `2026-07-29`, Xe.com mid-market
  `2026-07-29`, cross-checked against investing.com, exchange-rates.org, and
  tradingeconomics.com (`2026-07-24` to `2026-07-29`).
- **Semantics.** Each entry is the USD value of 1 unit of that currency. A
  city's USD rate is derived from this table via its `currency` field — no
  city stores its own rate.
- **Refresh policy.** This date tracks the FX snapshot alone; it must not be
  moved together with the dataset dates above.

## Format migration (this package)

- Extracted from the evaluated TypeScript objects (no re-sourcing, no value
  or date refresh): list order, numbers, policies, and source notes kept;
  optional fields that were `undefined` (no price, no note, no release date,
  no sub-national block) became absent JSON keys.
- The old cities `dataset` embedded `fx` by import; the JSON keeps fx only
  in `data/fx.json`, and the TypeScript adapter recomposes the same object.
- `test-vectors/*.json` are snapshots of the current implementation's
  outputs (scoring, cost, savings, minimum role, formatting, query encoding).
  They are fixed expectations for every runtime, including the Go port: a
  mismatch returns to extraction, never to an edited expectation.

## Consumers

- TypeScript adapters (same module paths and named exports as before):
  `apps/ayokoding-www/src/features/ai-benchmark/core/data/{models,benchmarks,operators}.ts`
  and
  `apps/ayokoding-www/src/features/cost-of-living-calculator/core/data/{cities,roles,fx}.ts`.
- Go readers (new app): `apps/ayokoding-web` decodes the same JSON directly.
