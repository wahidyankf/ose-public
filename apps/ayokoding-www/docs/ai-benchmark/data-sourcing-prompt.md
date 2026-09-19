---
title: "AI Benchmark — Data-Sourcing Prompt"
description: Copy-paste prompts for an external research tool (Perplexity, web-researcher, etc.) that return data matching the AI Benchmark dataset schema, ready to drop into models.ts.
category: how-to
---

# AI Benchmark — Data-Sourcing Prompt

## Purpose

The AI Benchmark page is driven by a single hand-curated dataset module —
`src/features/ai-benchmark/core/data/models.ts`. That module is the **single source of truth** for
both the public `/tools/ai-benchmark` page and the generated
[`docs/reference/ai-model-benchmarks.md`](../../../../docs/reference/ai-model-benchmarks.md) reference.

This page holds the prompts you paste into an external web-research tool (Perplexity, ChatGPT with
browsing, the `web-researcher` agent, etc.) to (re)source that data so the result drops straight
into the schema. Run them when refreshing the snapshot, adding a model, or reconciling a figure.

| Output of the prompt              | Lands in                                                               |
| --------------------------------- | ---------------------------------------------------------------------- |
| Roster (models × harnesses)       | `src/features/ai-benchmark/core/data/models.ts` (`models[].harnesses`) |
| Benchmark figures (4 benchmarks)  | `src/features/ai-benchmark/core/data/models.ts` (`models[].figures`)   |
| Per-harness standard-tier pricing | `src/features/ai-benchmark/core/data/models.ts` (`models[].pricing`)   |

Because the roster, figures, and prices each come from a different class of source, the work is
split into three prompts. Re-check every `secondary`-graded figure against a **primary** source
before writing it (a vendor or benchmark-operator page, not an aggregator).

## Conventions every prompt must follow

These are the non-negotiable rules baked into the schema and the dataset invariant tests. They are
repeated inside each prompt, but read them once here:

- **Roster rule (DD-7a)**: a model is included when it is **selectable in at least one of the five
  harnesses' current rosters** (Claude Code, Codex CLI, Cursor, OpenCode Go, OpenCode Zen) and is
  either the current generation of its family or one generation prior. **Exclude** any entry the
  harness marks deprecated, legacy, or invitation-only/preview, and exclude any entry with **no
  identifiable vendor**. One row per **model**, with harness availability as an attribute.
- **The five harness ids**: `claude-code` (= CC), `codex-cli` (= CX), `cursor` (= CU),
  `opencode-go` (= GO), `opencode-zen` (= ZEN).
- **The four benchmarks and their weights (DD-5)**: `swe-bench-verified` (25), `swe-bench-pro`
  (25), `terminal-bench-2-1` (20), `gpqa-diamond` (30). Other benchmarks (AIME, LMArena, ARC-AGI,
  Artificial Analysis) are **not** in the composite.
- **Benchmark-version trap (invariant 9)**: Terminal-Bench **2.1** is current — a **2.0** figure
  must **never** be placed in a `terminal-bench-2-1` slot (it is excluded from the composite and
  counts as absent). SWE-bench **Multilingual** is a different benchmark — its figures must **never**
  be placed in a `swe-bench-verified` slot. SWE-bench harness releases 1.x and 2.x are not
  comparable. Where a model has no published score on the correct version, **omit** the figure
  (absent, not zero).
- **Evidence grades (DD-19)** — every figure carries exactly one: `verified` (independent verifier
  like Scale AI SEAL / ARC-Prize-Verified, or an official model card), `self-reported` (vendor about
  its own model), `secondary` (aggregator, no primary retrieved), `conflicted` (multiple
  irreconcilable published values — store the range, never an average), `unavailable` (vendor
  publishes no figure).
- **Conflicted figures**: store `low` and `high` with `low ≤ high`; the **LOW** value enters the
  composite (`value === low`), the full range is kept for display.
- **Pricing depth (DD-12)**: standard-tier input and output **USD per 1M tokens** only. Cache,
  batch, and long-context tiers go in a `conditions` note, never averaged into the number.
- **Pricing whose rate (DD-16)**: the rate **the harness charges**, stored **per harness**. Where a
  harness does not carry a model, **omit** that harness from the price set.
- **Promotions (DD-17a)**: a promotion with a **known expiry** → publish the post-expiry standard
  rate (Claude Sonnet 5 → `$3/$15` from 2026-09-01, not the `$2/$10` intro). A promotion with **no
  stated expiry** → publish the currently effective rate and record the list price in provenance.
- **Subscriptions (invariant 10)**: a flat-rate model (every OpenCode Go entry) carries
  `kind: "subscription"` with `planCostUsd` and `caps` — **never** a per-token rate, never `$0`.
- **Region**: the international / default endpoint (Alibaba Singapore, not Beijing).
- **Source URL on every figure and every price**: non-empty, naming the origin (vendor pricing page
  or benchmark operator/aggregator). No figure ships without provenance. **Never invent a number**
  not present in a cited source.
- **Snapshot date**: stamp the dataset with the ISO date the figures were gathered.

## Current coverage (match this unless extending)

- **38 models** across 11 vendors: Anthropic (6), OpenAI (9), Google (5), xAI (2), Cursor (2),
  Z.ai (2), Moonshot (3), MiniMax (2), Alibaba (3), DeepSeek (2), Xiaomi (2).
- **Two anchors** define the bands: `claude-opus-5` (Opus band) and `claude-sonnet-5` (Sonnet band).

---

## Prompt 1 — Roster (models × harnesses)

Run this **once per harness** (five times). Substitute `{HARNESS}` and `{HARNESS_DOCS_URL}`.

```text
You are a coding-agent-harness researcher. Return the CURRENT model roster for {HARNESS} from
{HARNESS_DOCS_URL}.

For each model selectable in the current picker/roster, give: the model's display name, its vendor,
and the config id used in this harness. Separately list any entries the harness marks deprecated,
legacy, or invitation-only/preview, and any entry with no identifiable vendor — these are EXCLUDED.

The five harnesses and their doc homes:
- Claude Code (CC): https://platform.claude.com/docs/en/models/overview
- Codex CLI (CX): https://developers.openai.com/codex/models
- Cursor (CU): https://www.cursor.com/pricing
- OpenCode Go (GO): https://opencode.ai/docs (flat-rate subscription; list the 16 config ids)
- OpenCode Zen (ZEN): https://opencode.ai/docs (per-token; cross-check against the live /v1/models)

Output as a JSON array, one object per model: { name, vendor, configId, harness: "{HARNESS_ABBR}" }.
State the ISO snapshot date. Do not invent entries; if a roster cannot be fetched, say so.
```

After running all five, take the **union** of models (one row per model, harness availability as an
attribute), then apply DD-7a (current or one generation prior; drop deprecated/legacy/preview/
no-vendor).

## Prompt 2 — Benchmark figures

Run this **once per model that appears in the roster** (or per benchmark leaderboard). Substitute
`{MODEL}`.

```text
You are an LLM-benchmark researcher. For the model {MODEL}, return its publicly-reported score on
EACH of these four benchmarks. For every figure, name the PRIMARY source (vendor model card / launch
post, or the benchmark operator's leaderboard) — if you only have an aggregator, say so.

Benchmarks:
- SWE-bench Verified (pass@1, ~500 human-validated GitHub issues). NOTE: a "SWE-bench Multilingual"
  score is a DIFFERENT benchmark and must NOT be reported here.
- SWE-bench Pro (harder proprietary-issue variant; some entries scored by Scale AI SEAL).
- Terminal-Bench 2.1 (autonomous agent tasks in real shells). NOTE: "2.1" is current — a 2.0-scale
  score must NOT be reported here; record its version explicitly.
- GPQA Diamond (198 Google-proof graduate-science questions; record the thinking/effort mode).

For each benchmark, report:
- score (percentage 0-100) and the benchmark version it was measured on
- grade: verified | self-reported | secondary | conflicted | unavailable
  (verified = independent verifier or official model card; self-reported = vendor about its own
  model; secondary = aggregator only; conflicted = multiple irreconcilable values — give the RANGE;
  unavailable = vendor publishes no figure)
- the source URL
- the evaluation condition / effort mode

If multiple irreconcilable values circulate, give the full [low, high] range and mark it conflicted
— do NOT average. If the vendor publishes no figure for a benchmark, say "unavailable". Do not
invent scores.
```

After collecting: for conflicted figures, the **LOW** value enters the composite and the full range
is stored. Drop any figure that is the wrong benchmark version (Multilingual in Verified, 2.0 in
2.1) — it counts as absent.

## Prompt 3 — Per-harness standard-tier pricing

Run this **once per vendor pricing page** (and once for each harness that charges its own rate —
notably Cursor and OpenCode Zen). Substitute `{VENDOR}` / `{HARNESS}`.

```text
You are an API-pricing researcher. For {VENDOR}'s models, return the STANDARD-TIER input and output
USD price per 1M tokens from the vendor's own pricing page. Standard tier only — do NOT average in
cache, batch, or long-context rates (note those separately).

For each model report:
- inputUsdPer1M and outputUsdPer1M (standard tier, international/default endpoint)
- the source URL (the vendor pricing page)
- any promotion: its rate, its label, and its expiry date if stated
- any context-tiering or regional multiplier (e.g. xAI doubles all rates at 200k tokens; Alibaba
  Beijing is 30-70% cheaper — record these as conditions, not in the number)

Pricing rules to honour:
- If a promotion has a KNOWN expiry date, report the POST-EXPIRY standard rate and note the promo.
- If a promotion has NO stated expiry, report the currently effective rate and note the list price.
- For OpenCode Go: it is a FLAT-RATE SUBSCRIPTION ($5 first month then $10/mo; caps $12/5hr,
  $30/week, $60/month) — report planCostUsd and caps, NOT per-token rates.
- For OpenCode Zen / Cursor: report the rate the HARNESS charges, which may passthrough the vendor
  rate or differ (e.g. Zen lists DeepSeek V4 Pro at $1.74/$3.48 vs DeepSeek's direct $0.435/$0.87).

Output one JSON object per model: { model, harness, input, output | {kind:"subscription",...},
source, conditions }. State the ISO snapshot date. Do not invent rates; if a price is not
retrievable, mark it unavailable rather than guessing.
```

## After you get the data

1. Translate the tool's JSON into the existing TypeScript literal shapes in `models.ts` — use the
   `fig()` / `cf()` / `met()` / `goSubscription()` helpers to keep the literals terse and to enforce
   the version/grade/conflicted/subscription invariants at the call site.
2. Update `dataset.snapshotDate` and the header-comment date at the top of `models.ts`.
3. Re-check every `secondary`-graded figure against a primary source before writing it; if a
   primary cannot be found, leave the grade as `secondary` (or `conflicted` / `unavailable`).
4. Run the dataset's own guards:
   `./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ayokoding-www:test:unit` (the
   `models.unit.test.ts` file beside the data module enforces the ten invariants), then
   `./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ayokoding-www:typecheck` and
   `./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ayokoding-www:lint`.
5. Record any unresolved gap in
   [`plans/done/2026-07-30__ayokoding-www-tools-ai-benchmark/evidence/`](../../../../plans/done/2026-07-30__ayokoding-www-tools-ai-benchmark/evidence/)
   with the same `K-N` style the research snapshot uses.

## See also

- Schema source of truth: the `type` definitions at the top of
  [`models.ts`](../../src/features/ai-benchmark/core/data/models.ts).
- Design decisions (composite, coverage, roster, pricing, evidence grades):
  [`tech-docs.md`](../../../../plans/done/2026-07-30__ayokoding-www-tools-ai-benchmark/tech-docs.md).
- Verified research snapshot (the transcription source):
  [`tech-docs.md` §Appendix A](../../../../plans/done/2026-07-30__ayokoding-www-tools-ai-benchmark/tech-docs.md#appendix-a--verified-research-snapshot-2026-07-28).
