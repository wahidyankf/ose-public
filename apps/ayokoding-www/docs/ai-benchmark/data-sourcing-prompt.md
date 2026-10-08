---
title: "AI Benchmark — Data-Sourcing Prompt"
description: Copy-paste prompts for a web-research tool that return roster, independent benchmark results, and API prices matching the AI Benchmark dataset schema, ready to drop into models.ts.
category: how-to
---

# AI Benchmark — Data-Sourcing Prompt

## Purpose

The AI Benchmark page is driven by one hand-curated dataset module —
`src/features/ai-benchmark/core/data/models.ts`. It is the **single source of truth** for both the
public `/tools/ai-benchmark` page and the generated
[`docs/reference/ai-model-benchmarks.md`](../../../../docs/reference/ai-model-benchmarks.md) tables.

This page holds the prompts you paste into a web-research tool (the `web-researcher` agent,
Perplexity, a browsing chat) to refresh that data so the result drops straight into the schema.
Prefer reading leaderboards in a real browser: several boards render their tables client-side, and
a summarizing fetch can drop rows or digits.

| Output of the prompt          | Lands in (`models.ts`)                                    |
| ----------------------------- | --------------------------------------------------------- |
| Roster (models × harnesses)   | `models[]` — `harnesses`, `line`, `releaseDate`, `access` |
| Independent benchmark results | `models[].figures`, `models[].costPerTask`                |
| Standard API prices           | `models[].price`                                          |

## Rules every refresh must follow

These are enforced by the dataset invariant tests (`tests/unit/features/ai-benchmark/core/data/models.unit.test.ts`).

- **Roster**: every model from Anthropic, OpenAI, Google, and xAI, every model listed on the two
  catalog harnesses — OpenCode Go and Command Code — whose vendor is identified, and each listed
  harness's own in-house models (Cursor Composer; `HARNESS_IN_HOUSE_LINES` in
  `core/data/benchmarks.ts`). Keep up to three generations of each line (the latest and the two before
  it), as long as the vendor's API or one of the harnesses still serves them; a catalog model outside
  that window stays out. A serving variant a catalog lists under its own id (a Fast, HighSpeed,
  UltraSpeed, Contributor, or dated snapshot) is its own row, with figures only from an operator that
  ran that variant. Models a catalog lists with no identified vendor (stealth models) or that are not
  selectable chat models (Command Code's Jev decision model and `taste-1`) stay out.
  Tier anchors (`TIER_ANCHORS` in `core/data/benchmarks.ts`) stay in the roster even when they fall
  out of that window. Invitation-only or staged-rollout models are kept with `access: "limited"` and
  a `note`.
- **Harness ids**: `claude-code`, `codex-cli`, `command-code`, `command-code-pro`, `cursor`,
  `opencode-go`, `opencode-zen` — native pickers only (Claude Code lists Anthropic models, Codex CLI
  lists OpenAI models). `command-code` is Command Code's whole catalog
  (`https://api.commandcode.ai/provider/v1/models`); `command-code-pro` is the model list on its Pro
  plan page (`https://commandcode.ai/docs/plans/pro`), read from the list itself rather than its prose.
- **Model ids**: the vendor's or OpenCode's own API id (`gpt-5.6-terra`, `glm-5.3`, `claude-opus-5`);
  for a model only Command Code carries, its Command Code id without the provider prefix, lowercased
  (`mistral-large-4`).
- **Benchmarks** (versions pinned in `BENCHMARK_SPECS`): DeepSWE **1.1**, Terminal-Bench **4.0**,
  SWE-Atlas **QnA**. A result on any other version is not recorded.
- **Independent results only**: a figure must come from an operator that ran the model itself.
  Vendor launch posts, model cards, and vendor blogs are never recorded — not even for display.
- **Operator order per (model, benchmark)** — the first available wins:
  1. Artificial Analysis Coding Agent Index — the model's best published configuration in its own
     harness (highest index); multi-model combinations (e.g. Devin Fusion) are excluded.
  2. DeepSWE → Datacurve board (best effort level). Terminal-Bench → Artificial Analysis evaluation
     page → official tbench.ai board → Vals AI. SWE-Atlas QnA → Scale AI board.
- **Record per figure**: value (0–100), version, operator, configuration (harness + effort, and any
  provider fallback the operator reports), source URL. One figure per benchmark per model.
- **Cost per task**: only from Artificial Analysis, and only for a model it scored.
- **Prices**: one standard API price per model, USD per 1M tokens, from the vendor's own pricing
  page (`listedBy: "vendor"`). Only where no vendor page is reachable, use the OpenCode-listed rate
  (`listedBy: "opencode"`) for a model an OpenCode harness sells at a paid rate, otherwise the rate
  Command Code lists at `https://commandcode.ai/models` (`listedBy: "commandcode"`). Record the
  price that applies today; dated promotions, peak/off-peak schedules, and long-context surcharges go
  in `note`. No subscriptions.
- **Never invent a number** not present in a cited source; leave a figure or price out instead.
- **Dates**: set `dataset.lastUpdated` and each source's `checkedOn` in `core/data/operators.ts`.

## Prompt 1 — Roster

```text
You are a coding-model roster researcher. As of today, list:
1. Every model selectable on OpenCode Go (https://opencode.ai/docs/go/) and on Command Code
   (https://api.commandcode.ai/provider/v1/models, prices at https://commandcode.ai/models), with its
   vendor, harness id, and per-1M-token price as listed there. Flag entries with no identified vendor
   and entries that are not selectable chat models. For each of those model lines, also find up to two
   older generations still served by the vendor's API or a harness. Separately, list exactly which
   catalog models the model list on Command Code's Pro plan page (https://commandcode.ai/docs/plans/pro)
   includes.
2. For Anthropic, OpenAI, Google, and xAI: up to three generations of each model line (the latest
   and the two before it) that the vendor's API or a harness still serves,
   with API id, release date, standard API input/output price per 1M tokens, and whether access is
   general or limited (invitation-only or staged rollout). Cite the vendor's models and pricing pages.
3. Each listed harness's own in-house models (Cursor Composer today): up to three generations of
   each line still served, with release date, the harness vendor's own per-1M-token price, and
   where the model can be used. Cite the harness's models and pricing page.
4. For every model above, whether it is selectable in Claude Code, Codex CLI, Cursor, OpenCode
   Zen (https://opencode.ai/docs/zen/), OpenCode Go, and Command Code (and its Pro plan), citing each
   harness's docs.
State the date each page says it was last updated. Do not invent entries; say when a page could not
be fetched.
```

## Prompt 2 — Independent benchmark results

```text
You are an LLM-benchmark researcher. Read these leaderboards in full (expand hidden rows) and return
every row as JSON with: model, harness/agent, effort setting, score (0-100, two decimals), and any
reported provider fallback or cost per task.
- Artificial Analysis Coding Agent Index: https://artificialanalysis.ai/agents/coding-agents
  (per-row DeepSWE 1.1, Terminal-Bench 4.0, and SWE-Atlas QnA scores, index, cost per task)
- Artificial Analysis Terminal-Bench 4.0 evaluation: https://artificialanalysis.ai/evaluations/terminalbench-4-0
- Datacurve DeepSWE v1.1: https://deepswe.datacurve.ai/
- Terminal-Bench 4.0 official board: https://www.tbench.ai/leaderboard
- Vals AI Terminal-Bench 4: https://www.vals.ai/benchmarks/terminal-bench-4
- Scale AI SWE-Atlas QnA: https://labs.scale.com/leaderboard/sweatlas-qna
Report only what each board publishes. Never substitute a vendor-reported score. State each board's
own "last updated" date.
```

## After you get the data

1. Write the rows into `models.ts` with its helpers: `aa()` for an Artificial Analysis index row,
   `datacurve()`, `aaTb4()`, `tbench()`, `vals()`, `scale()` for single fallbacks, `aaCost()` for
   cost per task, and `vendorPrice()` / `opencodePrice()` for prices.
2. Update `dataset.lastUpdated`, the header date in `models.ts`, and `checkedOn` in `operators.ts`.
3. Keep the Indonesian notes in step: add, change, or remove the `ID_NOTES` entry in
   `src/features/ai-benchmark/shell/note-text.ts` for every model or price `note` you added, changed, or
   dropped. The entry is keyed by the English note text verbatim, and its unit test fails both ways: a
   note with no entry, and an entry no note uses.
4. When a catalog harness's roster changes, update its hard-coded model count in
   `tests/unit/features/ai-benchmark/core/data/models.unit.test.ts` (OpenCode Go, Command Code, and
   Command Code Pro): the count and as-of date in the test title, and the count in its `toHaveLength`
   assertion.
5. Check the tiers still make sense: every anchor must land in its own tier (an invariant test), and
   any model that moves tier should be explainable from its figures.
6. Run the guards:
   `./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ayokoding-www:test:quick`,
   then regenerate the reference with
   `./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run ayokoding-www:generate-benchmark-reference`
   and confirm
   `./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ayokoding-www:validate-benchmark-reference`.

## See also

- Schema: [`types.ts`](../../src/features/ai-benchmark/core/data/types.ts).
- Scoring constants (benchmarks, versions, weights, anchors):
  [`benchmarks.ts`](../../src/features/ai-benchmark/core/data/benchmarks.ts).
- Sources and checked dates: [`operators.ts`](../../src/features/ai-benchmark/core/data/operators.ts).
