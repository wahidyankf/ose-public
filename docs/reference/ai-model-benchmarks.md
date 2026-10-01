---
title: "AI Model Benchmarks Reference"
description: Cited benchmark scores for all AI models used in this project — primary source backing for tier assignments in model-selection.md
category: reference
tags:
  - ai-models
  - benchmarks
  - model-selection
created: 2026-04-19
---

# AI Model Benchmarks Reference

Canonical benchmark reference for all AI models used in this project. Last updated: 2026-10-01 (generated tables — roster, pricing, frontier, capability-summary); hand-curated model-by-model prose was last refreshed 2026-07-05 and describes the older benchmark set — see the captions inside each generated block for the authoritative date, and [Current Composite](#current-composite-independent-results-only) for how the generated tables score models.

> **Derived data tables.** The data tables in this reference are generated from
> [`apps/ayokoding-www/src/features/ai-benchmark/core/data/models.ts`](../../apps/ayokoding-www/src/features/ai-benchmark/core/data/models.ts)
> (the single source of truth) — namely the OpenCode Go roster, the per-harness pricing, the
> frontier/big-brand reference, and the composite-benchmark capability summary. Each table is
> rewritten between a matched pair of HTML-comment markers (`BEGIN GENERATED` / `END GENERATED`), so
> hand-edits inside those pairs are overwritten on every refresh — edit `models.ts` instead, then
> regenerate. Refresh with
> `./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run ayokoding-www:generate-benchmark-reference`;
> check for drift with
> `./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ayokoding-www:validate-benchmark-reference`. All other prose (benchmark
> definitions, tier rationale, caveats) is hand-maintained and preserved verbatim.

## Purpose and Scope

This document provides cited benchmark scores for every model used in `.claude/agents/` and
`.opencode/agents/`. Its purpose is to make tier assignments in
[AI Agent Model Selection Convention](../../repo-governance/development/agents/model-selection.md) **auditable and
defensible** — anyone reading a tier decision can follow the citation chain from claim to
primary source here.

All docs that cite benchmark numbers link to this file. This file links to primary sources.

**Scope**:

- **Claude models** — all currently active models, legacy models, and deprecated models available via the Anthropic API
- **OpenCode Go models** — all models available via the `opencode-go/` provider in the OpenCode flat-rate subscription

---

## Benchmark Definitions

### Current Composite (Independent Results Only)

Since 2026-10-01 the generated tables below — and the
[ayokoding.com AI benchmark tool](https://ayokoding.com/en/tools/ai-benchmark) — score models on
three coding-agent benchmarks, equally weighted, using only results run by an independent operator.
Vendor-reported figures are not recorded.

| Benchmark      | Version | What it measures                                      | Operators, in order of preference                                            |
| -------------- | ------- | ----------------------------------------------------- | ---------------------------------------------------------------------------- |
| DeepSWE        | 1.1     | Long-horizon changes across real repositories         | Artificial Analysis Coding Agent Index → Datacurve board                     |
| Terminal-Bench | 4.0     | Autonomous work in real shell environments            | Artificial Analysis (index, then evaluation page) → official board → Vals AI |
| SWE-Atlas      | QnA     | Answering questions about large, unfamiliar codebases | Artificial Analysis Coding Agent Index → Scale AI board                      |

- **Index** — the mean of a model's scores on the benchmarks it has; at least two are required,
  otherwise the model is listed as `insufficient`.
- **Tiers** — one previous-generation anchor each: `ultra` ≥ Claude Opus 5, `planning` ≥ GPT-5.6
  Sol, `execution` ≥ GPT-5.6 Terra, `fast` below. A model goes in the highest tier whose anchor's
  index its own index matches or beats, so tier always follows index. Indexes built from different
  benchmarks are not exactly comparable (GPT-5.6 Terra has no independent SWE-Atlas QnA result).
- **Retired from the composite** — SWE-bench Verified (saturated), SWE-bench Pro (V1 tasks found
  broken; V2 unverified), Terminal-Bench 2.x (superseded), and GPQA Diamond (saturated). The sections
  below still describe them for the hand-curated model notes.

### Quick Reference

| Benchmark          | What it measures                                                                          | Relevance to coding agents           | Official Leaderboard                                                                                            |
| ------------------ | ----------------------------------------------------------------------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| SWE-bench Verified | Real GitHub issues resolved end-to-end; ~500 human-verified test cases                    | Primary signal for agentic code work | [swebench.com](https://www.swebench.com/verified.html)                                                          |
| SWE-bench Pro      | Harder variant — proprietary issues requiring deeper context and multi-file reasoning     | Secondary signal for complex tasks   | [Scale AI SEAL](https://labs.scale.com/leaderboard/swe_bench_pro_public)                                        |
| GPQA Diamond       | Expert-level science questions (chemistry, biology, physics) requiring graduate reasoning | Proxy for deep analytical capability | [Artificial Analysis](https://artificialanalysis.ai/evaluations/gpqa-diamond)                                   |
| AIME 2025          | Competition math problems; tests multi-step formal reasoning                              | Proxy for structured problem-solving | [MathArena](https://matharena.ai/) / [Artificial Analysis](https://artificialanalysis.ai/evaluations/aime-2025) |
| Terminal-Bench 2.0 | Autonomous agent navigation of real shell and system environments                         | Direct signal for CLI-native agents  | [tbench.ai](https://www.tbench.ai/leaderboard/terminal-bench/2.0)                                               |
| OSWorld-Verified   | Computer-use tasks in real GUI environments; multimodal agents                            | Relevant for computer-use agents     | [os-world.github.io](https://os-world.github.io/)                                                               |
| HumanEval          | Function synthesis from docstrings; largely saturated at frontier (90%+)                  | Less discriminative at top tier      | [Artificial Analysis](https://artificialanalysis.ai/evaluations/humaneval)                                      |
| CursorBench        | Real Cursor engineering sessions; multi-dimension scoring (private leaderboard)           | High ecological validity             | Private (Cursor internal)                                                                                       |
| ZClawBench         | Z.ai proprietary benchmark; methodology undisclosed                                       | Not independently verifiable         | Z.ai only                                                                                                       |

### SWE-bench Verified

**Official URL**: [swebench.com/verified.html](https://www.swebench.com/verified.html) (Princeton NLP Group)

**Where updated**: Live leaderboard at [swebench.com](https://www.swebench.com). Labs submit results to Princeton NLP. New entries appear as labs benchmark their models. The Verified variant uses ~500 human-validated tasks from a larger pool.

**Why we use it**: Closest publicly available proxy for real-world autonomous debugging and code modification. Tasks require the agent to understand an existing codebase, write a targeted patch, and pass a full automated test suite — directly simulating production coding agent workflows. Pass@1 on full test suites under a real agent scaffold is harder to game than function synthesis benchmarks.

**Known limitations**: Growing contamination risk as frontier models are trained on GitHub data (which includes SWE-bench solutions). Anthropic applies memorization-screen adjustments. Less discriminative at the top end now that scores exceed 85% — see SWE-bench Pro for harder discrimination. The Verified variant uses human-validated tasks, reducing noise versus the raw 2,294-task set.

### SWE-bench Pro

**Official URL**: [labs.scale.com/leaderboard/swe_bench_pro_public](https://labs.scale.com/leaderboard/swe_bench_pro_public) (Scale AI SEAL)

**Where updated**: Scale AI maintains the leaderboard and requires standardized scaffolding (250-turn limit, uncapped cost). Labs submit via a controlled evaluation protocol. Updated as labs request evaluation.

**Why we use it**: More discriminative than SWE-bench Verified at the frontier. 1,865 multi-language, multi-file tasks (avg 107 lines across 4.1 files) sourced from proprietary enterprise repositories — models cannot have seen training examples. The standardized scaffold removes scaffold-as-variable confounds present in SWE-bench Verified submissions.

**Known limitations**: Private test set; results depend on submitting through Scale AI's evaluation process. The gap between Verified and Pro scores (e.g., Claude Opus 4.7: 87.6% vs 64.3%) reflects both contamination/memorization in Verified and genuine task difficulty increase in Pro. Opus 4.7 has not yet been submitted to the standardized SEAL scaffold as of 2026-05-07.

### GPQA Diamond

**Official URL**: [artificialanalysis.ai/evaluations/gpqa-diamond](https://artificialanalysis.ai/evaluations/gpqa-diamond) | [epoch.ai/benchmarks/gpqa-diamond](https://epoch.ai/benchmarks/gpqa-diamond)

**Where updated**: Artificial Analysis and Epoch AI maintain live leaderboards. Original paper: [arXiv:2311.12022](https://arxiv.org/abs/2311.12022). New models appear as evaluators submit results; Anthropic publishes system card numbers.

**Why we use it**: Graduate-level chemistry/biology/physics questions validated by 20 PhD-level experts. Proxy for deep multi-step analytical reasoning — correlates with ability to reason about complex algorithms, debug obscure failures, and serve as an intelligent technical partner rather than a pattern-matcher.

**Known limitations**: Not directly a coding benchmark. The gap between "analytical reasoning" and "capable of multi-file tool use" can be large. Score varies significantly based on whether adaptive thinking/extended thinking is used (e.g., Sonnet 4.6: 74.1% standard vs 89.9% adaptive) — always note evaluation conditions when citing this score.

### AIME 2025

**Official URL**: [matharena.ai](https://matharena.ai/) | [artificialanalysis.ai/evaluations/aime-2025](https://artificialanalysis.ai/evaluations/aime-2025)

**Where updated**: MathArena and Artificial Analysis track live leaderboard entries. American Invitational Mathematics Examination problems are released annually; the 2025 set (30 problems: 15 AIME I + 15 AIME II) is the current standard.

**Why we use it**: Formal, multi-step competition math requiring structured problem decomposition. Scores above 90% indicate the model can chain complex logical steps — which correlates with agentic planning quality for multi-step coding tasks.

**Known limitations**: Known contamination risk — AIME problems circulate widely online. Anthropic explicitly flags this in the Opus 4.5 system card §2.2, and Opus 4.7 does not publish an AIME 2025 score likely for this reason. Treat any score near or above 95% with skepticism without contamination controls. AIME 2026 (used in some GLM and Kimi benchmarks) is not directly comparable to AIME 2025.

### Terminal-Bench 2.0

**Official URL**: [tbench.ai/leaderboard/terminal-bench/2.0](https://www.tbench.ai/leaderboard/terminal-bench/2.0)

**Where updated**: Laude Institute maintains the leaderboard. GitHub: [github.com/laude-institute/terminal-bench](https://github.com/laude-institute/terminal-bench). Evaluations submitted by labs and researchers; updated as new models are tested.

**Why we use it**: Requires agents to navigate a real terminal environment autonomously — shell, file systems, system administration. Direct signal for CLI-native agent capability; harder to game than code synthesis benchmarks because it requires real execution rather than text prediction.

**Known limitations**: Smaller task set than SWE-bench; agent scaffold choice may affect scores significantly. Less widely standardized than SWE-bench.

### OSWorld / OSWorld-Verified

**Official URL**: [os-world.github.io](https://os-world.github.io/) | [xlang.ai/blog/osworld-verified](https://xlang.ai/blog/osworld-verified)

**Where updated**: XLANG Lab / University of Hong Kong. Live leaderboard at the official site. OSWorld-Verified is a subset with more reliable task verification.

**Why we use it**: Key benchmark for computer-use capability — real GUI environments (desktop apps, web browsers, file managers). Assesses the vision + action loop for multimodal agents. Relevant for any agent that needs to interact with software interfaces rather than just code.

**Known limitations**: Requires running real OS environments; results can vary by screenshot quality and resolution. Scores can be sensitive to scaffold implementation.

### CursorBench

**Official blog**: [cursor.com/blog/cursorbench](https://cursor.com/blog/cursorbench)

**Where updated**: Cursor maintains this privately. No public leaderboard — scores are disclosed selectively via Anthropic and other lab announcements. Methodology is described in the blog post.

**Why we use it**: High ecological validity — tasks sourced from actual developer Cursor sessions (via Cursor Blame), not synthetic benchmarks. Multi-dimension scoring (correctness, quality, efficiency, interaction quality).

**Known limitations**: Private leaderboard — Cursor intentionally keeps detailed scores private to prevent benchmark gaming. Numbers cited (e.g., Opus 4.7: 70%) come from Anthropic's own announcements using their Cursor collaboration data. Cannot be independently verified or reproduced by third parties.

---

## Claude Models (Anthropic)

### Currently Active Models

The following three models are Anthropic's current recommended API models as of 2026-07-05. Claude
Opus 4.8 and Claude Sonnet 5 superseded Opus 4.7/Sonnet 4.6 during this refresh (see
`### Claude Opus 4.8`/`### Claude Sonnet 5` below); Claude Haiku 4.5 is unchanged.

**Source**: [Anthropic Models Overview](https://platform.claude.com/docs/en/about-claude/models/overview),
[Introducing Claude Sonnet 5](https://www.anthropic.com/news/claude-sonnet-5),
[VentureBeat on Claude Opus 4.8](https://venturebeat.com/technology/anthropics-claude-opus-4-8-is-here-with-3x-cheaper-fast-mode-and-near-mythos-level-alignment)
(accessed 2026-07-05)

| Feature                   | Claude Opus 4.8         | Claude Sonnet 5    | Claude Haiku 4.5            |
| ------------------------- | ----------------------- | ------------------ | --------------------------- |
| **API Model ID**          | `claude-opus-4-8`       | `claude-sonnet-5`  | `claude-haiku-4-5-20251001` |
| **Alias**                 | `opus`                  | `sonnet`           | `haiku`                     |
| **Pricing (in/out MTok)** | $5 / $25                | $2 / $10 (a)       | $1 / $5                     |
| **SWE-bench Verified**    | 88.6% `[Verified]`      | 85.2% `[Verified]` | 73.3% `[Verified]`          |
| **SWE-bench Pro**         | 69.2% `[Verified]`      | 63.2% `[Verified]` | 39.5% `[Self-reported]`     |
| **Terminal-Bench 2.1**    | not confirmed this pass | 80.4% `[Verified]` | not confirmed this pass     |
| **OSWorld-Verified**      | 83.4% `[Verified]`      | 81.2% `[Verified]` | 50.7% `[Self-reported]`     |
| **Release date**          | 2026-05-28              | 2026-06-30         | 2025-10-15                  |

(a) launched as an introductory rate; Anthropic later made $2 / $10 the standard price and cancelled
the scheduled rise to $3 / $15.

**Scope note (2026-07-05 refresh)**: this table's Opus 4.8/Sonnet 5 rows carry only the benchmarks
independently re-verified for the `upgrade-opencode-go-models` plan (SWE-bench Verified/Pro,
Terminal-Bench 2.1, OSWorld-Verified) — secondary benchmarks this doc previously tracked for Opus
4.7/Sonnet 4.6 (GPQA Diamond, AIME 2025, HLE, CharXiv, MCP-Atlas, BrowseComp, Finance Agent,
CursorBench) were not re-researched for the new models in this pass and are omitted rather than
guessed; check Anthropic's own launch materials for the full current suite. Anthropic also shipped a
tier **above** Opus on 2026-06-09 — **Claude Fable 5** (GA, SWE-bench Pro ~80.3% `[Verified]` via
[Vellum](https://www.vellum.ai/blog/claude-fable-5-and-mythos-5-benchmarks-explained)) and **Claude
Mythos 5** (gated to Project Glasswing, not generally available) — neither is what the `opus` alias
resolves to; Fable 5/Mythos 5 are noted here for completeness only, not tracked as a tier in this
document. **Claude Opus 5 shipped 2026-07-24** (after this table's 2026-07-05 refresh) and is the
dataset's current `opus` anchor for benchmark bands in the generated tables below — but the
hand-written `opus` alias in this table and in the Model Selection Mapping below still points at
`claude-opus-4-8`; repointing the alias is a separate governance decision (see the "opus anchor vs.
opus alias" note under Model Selection Mapping).

---

### Claude Opus 4.8

**Model ID**: `claude-opus-4-8` | **Alias**: `opus` (omit in agent frontmatter for budget-adaptive inherit)

**Primary sources**:

- [Anthropic Models Overview](https://platform.claude.com/docs/en/about-claude/models/overview) (official API docs, accessed 2026-07-05)
- [VentureBeat: Claude Opus 4.8 is here](https://venturebeat.com/technology/anthropics-claude-opus-4-8-is-here-with-3x-cheaper-fast-mode-and-near-mythos-level-alignment) (2026-05-28)

| Benchmark          | Score     | Confidence   | Source                      |
| ------------------ | --------- | ------------ | --------------------------- |
| SWE-bench Verified | **88.6%** | `[Verified]` | VentureBeat launch coverage |
| SWE-bench Pro      | **69.2%** | `[Verified]` | VentureBeat launch coverage |
| OSWorld-Verified   | **83.4%** | `[Verified]` | VentureBeat launch coverage |

**Pricing**: $5 / $25 per MTok (in/out) — unchanged from Opus 4.7.

**Scope note**: only the benchmarks re-verified for the `upgrade-opencode-go-models` plan
(2026-07-05) are listed above. GPQA Diamond, AIME 2025, Terminal-Bench, HLE, CharXiv, MCP-Atlas,
BrowseComp, Finance Agent, and CursorBench scores were not re-researched for this model in this
pass — check Anthropic's own launch materials for the full current suite rather than assuming
continuity with Opus 4.7's figures above.

---

### Claude Sonnet 5

**Model ID**: `claude-sonnet-5` | **Alias**: `sonnet`

**Primary sources**:

- [Introducing Claude Sonnet 5](https://www.anthropic.com/news/claude-sonnet-5) (Anthropic, 2026-06-30)
- [MarkTechPost: Claude Sonnet 5 vs Sonnet 4.6 vs Opus 4.8](https://www.marktechpost.com/2026/06/30/anthropic-claude-sonnet-5-vs-sonnet-4-6-vs-opus-4-8-agentic-coding-benchmarks-api-pricing-and-cost-performance-tradeoffs-compared/) (2026-06-30)

| Benchmark          | Score     | Confidence   | Source                                             |
| ------------------ | --------- | ------------ | -------------------------------------------------- |
| SWE-bench Verified | **85.2%** | `[Verified]` | Official launch post; corroborated by MarkTechPost |
| SWE-bench Pro      | **63.2%** | `[Verified]` | Official launch post; corroborated by MarkTechPost |
| Terminal-Bench 2.1 | **80.4%** | `[Verified]` | Official launch post; corroborated by MarkTechPost |
| OSWorld-Verified   | **81.2%** | `[Verified]` | Official launch post; corroborated by MarkTechPost |

**Pricing**: $2/$10 per MTok (in/out), now the permanent standard rate — the scheduled rise to
$3/$15 was cancelled — per [Anthropic API Pricing](https://platform.claude.com/docs/en/about-claude/pricing).

**Scope note**: only the benchmarks re-verified for the `upgrade-opencode-go-models` plan
(2026-07-05) are listed above; other secondary benchmarks this doc tracked for Sonnet 4.6 (GPQA
Diamond, AIME 2025, ARC-AGI-2, MCP-Atlas) were not re-researched for Sonnet 5 in this pass.

---

### Claude Haiku 4.5

**Model ID**: `claude-haiku-4-5-20251001` | **Alias**: `haiku`

**Primary sources**:

- [Anthropic Models Overview](https://platform.claude.com/docs/en/about-claude/models/overview) (official API docs, accessed 2026-05-07)
- [Introducing Claude Haiku 4.5](https://www.anthropic.com/news/claude-haiku-4-5) (Anthropic, 2025-10-15)
- [Claude Haiku 4.5 System Card](https://www.anthropic.com/claude-haiku-4-5-system-card) (PDF; binary, not text-extractable at research time)

| Benchmark            | Score         | Conditions                                            | Confidence             | Source                                                                       |
| -------------------- | ------------- | ----------------------------------------------------- | ---------------------- | ---------------------------------------------------------------------------- |
| SWE-bench Verified   | **73.3%**     | 50-trial avg, 128K think budget, no test-time compute | `[Verified]`           | Official launch post (verbatim quoted); consistent across all sources        |
| SWE-bench Pro (SEAL) | **39.5%**     | Standardized SEAL scaffold                            | `[Self-reported]`      | Morph citing official                                                        |
| OSWorld-Verified     | **50.7%**     | 10 runs, 128K thinking budget                         | `[Self-reported]`      | DataCamp citing official                                                     |
| MMMU                 | **73.2%**     | 10 runs, 128K thinking budget                         | `[Self-reported]`      | DataCamp citing official                                                     |
| GPQA Diamond         | **74.1%**     | Standard mode                                         | `[Needs Verification]` | Morph aggregator; 67.2% also circulates but 74.1% is more consistently cited |
| AIME 2025            | **80.7%**     | 10 runs, 128K thinking budget                         | `[Needs Verification]` | Aggregator paraphrase; 83.7% also circulates                                 |
| Context window       | 200k tokens   | —                                                     | —                      | Official API docs                                                            |
| Max output           | 64k tokens    | —                                                     | —                      | Official API docs                                                            |
| Speed                | ~89.6 tok/sec | —                                                     | —                      | Artificial Analysis measurement                                              |

**Haiku 3 retirement**: `claude-3-haiku` was retired 2026-04-19. All `haiku`-tier agents now resolve to `claude-haiku-4-5-20251001`.

**GPQA / AIME note**: Two conflicting values circulate for both scores. The Haiku 4.5 system card PDF was inaccessible to automated text extraction. The 74.1% GPQA and 80.7% AIME figures are the more consistently cited values across aggregators; 67.2% and 83.7% appear in fewer sources and may reflect earlier aggregator pulls or different evaluation conditions. Both remain `[Needs Verification]` until the system card PDF is confirmed.

---

### Legacy Models

These models remain available via the Anthropic API but are no longer the recommended current versions. Migration is encouraged.

**Source**: [Anthropic Models Overview](https://platform.claude.com/docs/en/about-claude/models/overview) (legacy section, accessed 2026-05-07)

| Model             | API ID                       | Pricing (in/out MTok) | Context | Max Out | Release    | SWE-bench Verified         | SWE-bench Pro (SEAL) | GPQA Diamond                                |
| ----------------- | ---------------------------- | --------------------- | ------- | ------- | ---------- | -------------------------- | -------------------- | ------------------------------------------- |
| Claude Opus 4.7   | `claude-opus-4-7`            | $5 / $25              | 1M      | 128k    | 2026-04-16 | **87.6%**                  | **64.3%**            | **94.2%**                                   |
| Claude Sonnet 4.6 | `claude-sonnet-4-6`          | $3 / $15              | 1M      | 64k     | 2026-02-17 | **79.6%** (80.2% w/ mod)   | —                    | **89.9%** (adaptive) / **74.1%** (standard) |
| Claude Opus 4.6   | `claude-opus-4-6`            | $5 / $25              | 1M      | 128k    | 2026       | **80.8%**                  | **51.90%**           | **91.3%**                                   |
| Claude Sonnet 4.5 | `claude-sonnet-4-5-20250929` | $3 / $15              | 200k    | 64k     | 2025-09-29 | **77.2%** (82.0% parallel) | **43.60%**           | —                                           |
| Claude Opus 4.5   | `claude-opus-4-5-20251101`   | $5 / $25              | 200k    | 64k     | 2025-11-01 | **80.9%**                  | **45.89%**           | —                                           |
| Claude Opus 4.1   | `claude-opus-4-1-20250805`   | $15 / $75             | 200k    | 32k     | 2025-08-05 | —                          | **23.1%**            | **80.9%**                                   |

All legacy model scores `[Self-reported]` from respective official Anthropic announcements and system cards. SWE-bench Pro (SEAL) scores from Scale AI public leaderboard.

### Claude Opus 4.7

Superseded by Claude Opus 4.8 (above). See the Legacy Models table above for its benchmark row.

### Claude Sonnet 4.6

Superseded by Claude Sonnet 5 (above). See the Legacy Models table above for its benchmark row.

---

### Deprecated Models (Retiring June 15, 2026)

| Model             | API ID                                           | Pricing   | Context | Status                                    |
| ----------------- | ------------------------------------------------ | --------- | ------- | ----------------------------------------- |
| Claude Sonnet 4.0 | `claude-sonnet-4-20250514` / `claude-sonnet-4-0` | $3 / $15  | 200k    | DEPRECATED — migrate before June 15, 2026 |
| Claude Opus 4.0   | `claude-opus-4-20250514` / `claude-opus-4-0`     | $15 / $75 | 200k    | DEPRECATED — migrate before June 15, 2026 |

**Source**: [Anthropic Model Deprecations](https://platform.claude.com/docs/en/about-claude/model-deprecations)

---

### Preview Models (Not General API)

**Claude Mythos Preview** — Available only to ~50 invitation-only Project Glasswing partner organizations. NOT available via standard Claude API or Claude Code. Included here for reference only.

- **Bedrock ID**: `anthropic.claude-mythos-preview`
- **Access**: [Project Glasswing](https://www.anthropic.com/news/project-glasswing) (invitation-only)
- **Pricing**: $25 / $125 per MTok in/out (Glasswing participants)
- **Context**: 1M tokens input, 128k max output

| Benchmark          | Score | Confidence        |
| ------------------ | ----- | ----------------- |
| SWE-bench Verified | 93.9% | `[Self-reported]` |
| SWE-bench Pro      | 77.8% | `[Self-reported]` |
| GPQA Diamond       | 94.6% | `[Self-reported]` |
| Terminal-Bench 2.0 | 82.0% | `[Self-reported]` |
| OSWorld-Verified   | 79.6% | `[Self-reported]` |

---

## OpenCode Go Models (opencode-go/ provider)

OpenCode Go is a flat-rate subscription ($5 first month, then $10/month) providing access to
curated models from six AI labs (Z.ai, MiniMax, Moonshot AI, Xiaomi, Alibaba, DeepSeek). All models
use the `opencode-go/` provider prefix in OpenCode configuration. Claude Code agents use Claude
models — the `opencode-go/` models are only active in the OpenCode runtime (and, per the
`upgrade-opencode-go-models` plan, in Pi's `.pi/settings.json` model pin).

**Subscription model**: No per-token billing for subscribers. Rate limits (requests per 5-hour
window) serve as the effective capability signal — lower limit = heavier/more capable model,
higher limit = lighter/faster model.

**Current roster**: 15 models as of the 2026-07-28 generated snapshot (see the roster table below) — 13 models at the prior 2026-07-05 refresh (independently re-confirmed via the `opencode models` CLI, v1.14.49 — a live client check, not docs-only). The roster changes without a fixed cadence — observed twice in the ~2 months between the prior `adopt-opencode-go` plan (2026-05-03) and the 2026-07-05 refresh, and again between that refresh and the 2026-07-28 snapshot. Check the live model list in the OpenCode TUI or at [opencode.ai/docs/go](https://opencode.ai/docs/go/).

**Source**: [OpenCode Go Docs](https://opencode.ai/docs/go/), live `opencode models` CLI output
(both accessed 2026-07-05)

### The thinking/execution/fast tier design and the Opus comparison bar

**Superseded as of 2026-09-06**: the OpenCode mirror no longer pins a model at any grade. The
`opencode` entry in `repo-config.yml` declares no `model-map:`, so the emitted agent carries no
`model` key and the developer's own OpenCode configuration decides — see
[AI Agent Model Selection Convention](../../repo-governance/development/agents/model-selection.md).
The tier design described below is retained because the roster comparison that follows was the
evidence behind it, and because it still records why no `opencode-go` model was treated as an
Opus-grade substitute.

As of the 2026-07-05 refresh this repo mapped Claude Code's `opus`/`sonnet`/`haiku` aliases to three
tiers — **thinking**, **execution**, **fast**: thinking (`opus`) and execution (`sonnet`/omitted)
both resolved to `opencode-go/glm-5.2`; fast (`haiku`) resolved to `opencode-go/minimax-m3`.

**Claude Opus 5 shipped 2026-07-24** and is the current Opus generation — it is the dataset's `opus`
anchor (`claude-opus-5`, SWE-bench Verified 96.0% `[Self-reported]`), per [Anthropic's model
overview](https://platform.claude.com/docs/en/models/overview) (accessed 2026-07-28). An earlier
draft of the plan behind the 2026-07-05 refresh referenced "Opus 5" as a speculative thinking-tier
comparison bar before it shipped; it has since shipped, so that bar is now real rather than
hypothetical. **Claude Opus 4.8** (shipped 2026-05-28) is the prior Opus generation and remains in
the dataset one generation back; its SWE-bench Pro 69.2% is the latest published Opus Pro figure, so
it still anchors the roster comparison below. Anthropic's tier _above_ Opus, shipped 2026-06-09, is
**Claude Fable 5** (GA) — a distinct model family, not what the `opus` alias resolves to (see the
"Currently Active Models" scope note above).

**No `opencode-go` roster model clears Opus 4.8's 69.2% SWE-bench Pro bar** — at the time of that
decision, `glm-5.2` at 62.1% was the strongest confirmed roster model and the closest to the bar,
~7.1pp below (the 2026-07-28 roster snapshot in the generated table below now leads with `grok-4.5`
at 64.7% SWE-bench Pro `[Self-reported]`, ~4.5pp below the bar — still under it, so the
thinking-tier collapse rationale still holds, just with a narrower gap). The thinking tier therefore
collapses onto the execution tier's target (`glm-5.2`) rather than being held to a bar nothing in
the roster meets — an explicit, accepted tradeoff, not an oversight. See Decision 1 in the
`upgrade-opencode-go-models` plan's `tech-docs.md` for the full rationale and decision-branch diagram.

### Roster Overview

<!-- BEGIN GENERATED: roster -->

> Last updated 2026-10-01 — 29 OpenCode Go models with an identified vendor. Muse Spark is listed on OpenCode Go under its `-contributor` id. Derived from `apps/ayokoding-www/src/features/ai-benchmark/core/data/models.ts`.

| Model ID                     | Name                                    | Vendor      | Tier         | Index | Other harnesses                 |
| ---------------------------- | --------------------------------------- | ----------- | ------------ | ----- | ------------------------------- |
| gpt-6-luna                   | GPT-6 Luna                              | OpenAI      | fast         | 41.07 | codex-cli, opencode-zen         |
| gpt-5.6-luna                 | GPT-5.6 Luna                            | OpenAI      | fast         | 43.23 | codex-cli, cursor, opencode-zen |
| grok-4.7                     | Grok 4.7                                | xAI         | planning     | 56.27 | cursor, opencode-zen            |
| grok-4.6                     | Grok 4.6                                | xAI         | execution    | 46.97 | cursor, opencode-zen            |
| glm-5.3                      | GLM-5.3                                 | Z.ai        | execution    | 53.56 | cursor, opencode-zen            |
| glm-5.2                      | GLM-5.2                                 | Z.ai        | execution    | 45.95 | cursor, opencode-zen            |
| glm-5.3-flash                | GLM-5.3 Flash                           | Z.ai        | execution    | 48.09 | cursor, opencode-zen            |
| kimi-k3                      | Kimi K3                                 | Moonshot AI | execution    | 51.93 | cursor, opencode-zen            |
| kimi-k2.6                    | Kimi K2.6                               | Moonshot AI | insufficient | —     | opencode-zen                    |
| kimi-k2.7-code               | Kimi K2.7 Code                          | Moonshot AI | insufficient | —     | cursor, opencode-zen            |
| deepseek-v4-pro              | DeepSeek V4 Pro                         | DeepSeek    | fast         | 43.05 | opencode-zen                    |
| deepseek-v4.1-flash          | DeepSeek V4.1 Flash                     | DeepSeek    | insufficient | —     | opencode-zen                    |
| deepseek-v4-flash            | DeepSeek V4 Flash                       | DeepSeek    | fast         | 38.74 | opencode-zen                    |
| deepseek-v4-flash-vision-exp | DeepSeek V4 Flash Vision (experimental) | DeepSeek    | insufficient | —     | opencode-zen                    |
| qwen3.8-max                  | Qwen3.8 Max                             | Alibaba     | fast         | 43.27 | opencode-zen                    |
| qwen3.8-flash                | Qwen3.8 Flash                           | Alibaba     | insufficient | —     | opencode-zen                    |
| qwen3.7-plus                 | Qwen3.7 Plus                            | Alibaba     | insufficient | —     | opencode-zen                    |
| muse-spark-1.3               | Muse Spark 1.3                          | Meta        | execution    | 54.30 | cursor, opencode-zen            |
| muse-spark-1.2               | Muse Spark 1.2                          | Meta        | fast         | 30.46 | opencode-zen                    |
| minimax-m3                   | MiniMax M3                              | MiniMax     | insufficient | —     | opencode-zen                    |
| minimax-m2.7                 | MiniMax M2.7                            | MiniMax     | insufficient | —     | opencode-zen                    |
| mimo-v2.6-pro                | MiMo V2.6 Pro                           | Xiaomi      | insufficient | —     | —                               |
| mimo-v2.5-pro                | MiMo V2.5 Pro                           | Xiaomi      | insufficient | —     | —                               |
| mimo-v2.6-flash              | MiMo V2.6 Flash                         | Xiaomi      | insufficient | —     | —                               |
| mimo-v2.5                    | MiMo V2.5                               | Xiaomi      | insufficient | —     | —                               |
| hy4-preview                  | Hy4 (preview)                           | Tencent     | insufficient | —     | —                               |
| hy3                          | Hy3                                     | Tencent     | insufficient | —     | —                               |
| longcat-2.5-preview-free     | LongCat 2.5 (preview)                   | Meituan     | insufficient | —     | opencode-zen                    |
| longcat-2.0                  | LongCat 2.0                             | Meituan     | insufficient | —     | —                               |

<!-- END GENERATED: roster -->

(a) vs. older Opus 4.6, not Opus 4.8 — generation mismatch flagged in the original source. (b) no
official Alibaba figure found; third-party estimate, still below `glm-5.2`'s confirmed 62.1% despite
costing ~1.8x more per input token — rejected as a thinking-tier candidate (see
`upgrade-opencode-go-models` plan's `tech-docs.md`, "Qwen3.7-Max/Plus re-checked" section).

**Retired from the roster since the last refresh (2026-05-07)**: unsuffixed `opencode-go/glm-5`
(retirement window narrowed to 2026-06-12–2026-07-05 by a third-party snapshot), `opencode-go/kimi-k2.5`,
`opencode-go/minimax-m2.5`, `opencode-go/qwen3.5-plus`. Req/5h figures for the 8 unchanged roster
models were not independently re-confirmed in this pass (only the two new tier-target models,
`glm-5.2` and `minimax-m3`, were checked against their official/rate-limit sources) — treat the
"not reconfirmed this pass" cells as carried over from the prior refresh, subject to the same
without-fixed-cadence drift risk noted above.

---

### opencode-go/glm-5.2

**Provider**: Z.ai (formerly Zhipu AI) | **Release**: 2026-06 (exact date not confirmed this pass)

**Primary sources**:

- [Z.ai GLM-5.2 Docs](https://docs.z.ai/guides/llm/glm-5.2)
- [HuggingFace zai-org/GLM-5.2](https://huggingface.co/zai-org/GLM-5.2)

| Benchmark          | Score     | vs. Sonnet 5 (63.2%) | vs. Opus 4.8 (69.2%) | Confidence        | Source                   |
| ------------------ | --------- | -------------------- | -------------------- | ----------------- | ------------------------ |
| SWE-bench Pro      | **62.1%** | −1.1pp (noise-level) | −7.1pp               | `[Self-reported]` | Z.ai docs; HF model card |
| Terminal-Bench 2.1 | **81.0%** | +0.6pp               | —                    | `[Self-reported]` | Z.ai docs; HF model card |

**Pricing**: $1.40 / $4.40 per 1M tokens (in/out) — [Z.ai Pricing](https://docs.z.ai/guides/overview/pricing), retrieved 2026-07-05.

**Rate limit**: 880 req/5h — tied for the tightest in the 13-model roster at the 2026-07-05 refresh (the 2026-07-28 snapshot's 15-model roster is in the generated table below; req/5h figures for the two newly-added models, `grok-4.5` and `kimi-k3`, were not re-confirmed this pass), confirming `glm-5.2` is priced and throttled as the flagship, not a light/fast option.

**Role in this repo**: strongest model in the roster on every published benchmark checked — used as
both the thinking-tier (`opus`) and execution-tier (`sonnet`/omitted) target in `convert_model()`,
collapsed onto one literal per Decision 1 in the `upgrade-opencode-go-models` plan (does not clear
Claude Opus 4.8's tier; at/slightly above Claude Sonnet 5's tier).

---

### opencode-go/glm-5.1

**Provider**: Z.ai (formerly Zhipu AI) | **Release**: 2026-04-07

**Primary sources**:

- [Z.ai GLM-5.1 Docs](https://docs.z.ai/guides/llm/glm-5.1)
- [HuggingFace zai-org/GLM-5.1](https://huggingface.co/zai-org/GLM-5.1)

| Benchmark          | Score                    | Confidence        | Source                                                             |
| ------------------ | ------------------------ | ----------------- | ------------------------------------------------------------------ |
| SWE-bench Pro      | **58.4%**                | `[Self-reported]` | HF model card; reported as #1 on SWE-bench Pro at Apr 2026 release |
| SWE-bench Verified | Not separately published | —                 | GLM-5 baseline was 77.8%; GLM-5.1 improvement unconfirmed          |
| GPQA Diamond       | **86.2%**                | `[Self-reported]` | HF model card                                                      |
| AIME 2026 I        | **95.3%**                | `[Self-reported]` | HF model card (note: AIME 2026, not 2025)                          |
| HLE (with tools)   | **52.3%**                | `[Self-reported]` | HF model card                                                      |

**Architecture**: 754B total / 40B active (MoE) | **Context**: 200K tokens | **License**: MIT (open-weight)

---

### opencode-go/kimi-k2.6

**Provider**: Moonshot AI | **Release**: 2026-04-20

**Primary sources**:

- [Kimi K2.6 Tech Blog](https://www.kimi.com/blog/kimi-k2-6)
- [HuggingFace moonshotai/Kimi-K2.6](https://huggingface.co/moonshotai/Kimi-K2.6)

| Benchmark          | Score     | Confidence        | Source        |
| ------------------ | --------- | ----------------- | ------------- |
| SWE-bench Verified | **80.2%** | `[Self-reported]` | Official blog |
| SWE-bench Pro      | **58.6%** | `[Self-reported]` | Official blog |
| GPQA Diamond       | **90.5%** | `[Self-reported]` | Official blog |

**Context**: 262,144 tokens (256K) | **License**: Open-source | **Notable**: Supports agent swarms with up to 300 sub-agents and 4,000 coordination steps.

---

### opencode-go/kimi-k2.7-code

**Provider**: Moonshot AI | **Release**: not confirmed this pass

**Primary sources**:

- [Flowtivity: Kimi K2.7-code review](https://flowtivity.ai/blog/kimi-k2-7-code-review/)

| Benchmark     | Score         | Confidence     | Source            |
| ------------- | ------------- | -------------- | ----------------- |
| SWE-bench Pro | **58.6%** (a) | `[Unverified]` | Flowtivity review |

(a) compared against older Opus 4.6 in the original source, not Opus 4.8 — generation mismatch,
flagged rather than silently normalized.

**Pricing**: $0.95 (cache miss) / $0.19 (cache hit) input, $4.00 output per 1M tokens — [Kimi Platform Pricing](https://platform.kimi.ai/docs/pricing/chat-k27-code), retrieved 2026-07-05.

---

### opencode-go/mimo-v2.5-pro

**Provider**: Xiaomi (MiMo team) | **Release**: 2026-04-22

**Primary sources**:

- [MiMo-V2.5-Pro Official](https://mimo.xiaomi.com/mimo-v2-5-pro/)
- [HuggingFace XiaomiMiMo/MiMo-V2.5-Pro](https://huggingface.co/XiaomiMiMo/MiMo-V2.5-Pro)

| Benchmark                              | Score              | Confidence        | Source                                              |
| -------------------------------------- | ------------------ | ----------------- | --------------------------------------------------- |
| SWE-bench Pro                          | **57.2%**          | `[Self-reported]` | Official release; exceeds Claude Opus 4.6's 53.4%   |
| SWE-bench Verified                     | ~82%               | `[Unverified]`    | Third-party synthesis; primary source not confirmed |
| Terminal-Bench 2.0                     | **65.8%**          | `[Self-reported]` | HF model card                                       |
| Claw-Eval General                      | **62.1%**          | `[Self-reported]` | HF model card                                       |
| Artificial Analysis Intelligence Index | **54** (composite) | `[Verified]`      | Artificial Analysis                                 |

**Architecture**: 1.02T total / 42B active (MoE), multimodal | **Context**: 1M tokens | **License**: Open-weight | **Notable**: Supports 1,000+ sequential tool calls without coherence loss.

---

### opencode-go/mimo-v2.5

**Provider**: Xiaomi (MiMo team) | **Release**: 2026-04-22

**Primary sources**:

- [HuggingFace XiaomiMiMo/MiMo-V2.5](https://huggingface.co/XiaomiMiMo/MiMo-V2.5)

| Benchmark          | Score         | Confidence        | Source        |
| ------------------ | ------------- | ----------------- | ------------- |
| SWE-bench Pro      | **56.1%**     | `[Self-reported]` | HF model card |
| Terminal-Bench 2.0 | **65.8%**     | `[Self-reported]` | HF model card |
| Claw-Eval General  | **62.1%**     | `[Self-reported]` | HF model card |
| SWE-bench Verified | Not published | —                 | —             |

**Architecture**: 310B total / 15B active (MoE), multimodal | **Context**: 1M tokens (post-training extended) | **License**: Open-weight

---

### opencode-go/deepseek-v4-pro

**Provider**: DeepSeek | **Release**: 2026-04-24

**Primary sources**:

- [HuggingFace deepseek-ai/DeepSeek-V4-Pro](https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro)
- [DeepSeek API Changelog](https://api-docs.deepseek.com/news/news260424)

| Benchmark          | Score         | Confidence             | Source        |
| ------------------ | ------------- | ---------------------- | ------------- |
| SWE-bench Verified | **80.6%**     | `[Self-reported]`      | HF model card |
| SWE-bench Pro      | **55.4%**     | `[Self-reported]`      | HF model card |
| GPQA Diamond       | **90.1%**     | `[Self-reported]`      | HF model card |
| MMLU-Pro           | **87.5%**     | `[Self-reported]`      | HF model card |
| Terminal-Bench 2.0 | **67.9%**     | `[Self-reported]`      | HF model card |
| AIME 2025          | Not published | `[Needs Verification]` | —             |

**Architecture**: 1.6T total / 49B active (MoE), FP4+FP8 | **Context**: 1M tokens | **License**: MIT (open-weight)

---

### opencode-go/qwen3.6-plus

**Provider**: Alibaba (Qwen team) | **Release**: 2026-03-31

**Primary sources**: Third-party aggregators (official Qwen primary source not directly confirmed at research time)

| Benchmark          | Score     | Confidence     | Source                                       |
| ------------------ | --------- | -------------- | -------------------------------------------- |
| SWE-bench Verified | **78.8%** | `[Unverified]` | Third-party aggregators                      |
| Terminal-Bench 2.0 | **61.6%** | `[Unverified]` | Third-party (leads Claude Opus 4.5 at 59.3%) |

**Context**: 1M tokens | **License**: Proprietary

---

### opencode-go/minimax-m2.7

**Provider**: MiniMax | **Release**: 2026-03-18

**Primary sources**:

- [MiniMax M2.7 Official](https://www.minimax.io/news/minimax-m27-en)
- [HuggingFace MiniMaxAI/MiniMax-M2.7](https://huggingface.co/MiniMaxAI/MiniMax-M2.7)

| Benchmark              | Score         | Confidence             | Source                                                           |
| ---------------------- | ------------- | ---------------------- | ---------------------------------------------------------------- |
| SWE-bench Verified     | ~78%          | `[Unverified]`         | Third-party estimate; official announcement did not publish      |
| SWE-bench Pro          | **56.22%**    | `[Self-reported]`      | Official announcement                                            |
| SWE-bench Multilingual | **76.5%**     | `[Self-reported]`      | Official announcement                                            |
| Multi-SWE-Bench        | **52.7%**     | `[Self-reported]`      | Official announcement                                            |
| VIBE-Pro               | **55.6%**     | `[Self-reported]`      | Official announcement                                            |
| Terminal-Bench 2.0     | **57.0%**     | `[Self-reported]`      | Official announcement                                            |
| GDPval-AA ELO          | **1495**      | `[Self-reported]`      | Official (highest open-source on office productivity at release) |
| GPQA Diamond           | Not published | `[Needs Verification]` | —                                                                |

**Architecture**: 230B total / 10B active (MoE) | **Context**: 200K tokens | **License**: Open-weight (non-commercial — commercial use requires separate agreement)

---

### opencode-go/minimax-m3

**Provider**: MiniMax | **Release**: not confirmed this pass

**Primary sources**:

- [MiniMax M3 blog](https://www.minimax.io/blog/minimax-m3)

| Benchmark          | Score     | vs. Sonnet 5 (63.2%) | vs. Opus 4.8 (69.2%) | Confidence        | Source        |
| ------------------ | --------- | -------------------- | -------------------- | ----------------- | ------------- |
| SWE-bench Pro      | **59.0%** | −4.2pp               | −10.2pp              | `[Self-reported]` | Official blog |
| Terminal-Bench 2.1 | **66.0%** | −14.4pp              | —                    | `[Self-reported]` | Official blog |

**Pricing**: $0.30 (≤512K context) / $0.60 (>512K) input, $1.20 (≤512K) / $2.40 (>512K) output per
1M tokens — [MiniMax Pay-as-you-go](https://platform.minimax.io/docs/guides/pricing-paygo), retrieved 2026-07-05.

**Role in this repo**: fast-tier (`haiku`) target in `convert_model()` — the closest roster model to
Claude Sonnet 5's tier without exceeding it, chosen over collapsing every tier onto `glm-5.2` so the
fast tier stays genuinely lighter and cheaper (input $0.30 vs. glm-5.2's $1.40). Supersedes
`opencode-go/minimax-m2.7` as the fast-tier target as of the `upgrade-opencode-go-models` plan
(2026-07-05).

---

### opencode-go/qwen3.7-max

**Provider**: Alibaba (Qwen team) | **Release**: not confirmed this pass

**Primary sources**: [amitray.com Qwen3.7-Max benchmark](https://amitray.com/qwen3-7-max-benchmark/),
[Weights & Biases report](https://wandb.ai/byyoung3/ml-news/reports/Qwen3-7-Max-Benchmark-Scores---VmlldzoxNjk1MzA1MQ)
— no official Alibaba-published SWE-bench score found; the official `qwen.ai` blog is
client-side-rendered and could not be fetched at research time.

| Benchmark     | Score  | Confidence     | Source                                                        |
| ------------- | ------ | -------------- | ------------------------------------------------------------- |
| SWE-bench Pro | ~60.6% | `[Unverified]` | Third-party estimate, consistent across 2 independent sources |

**Pricing**: $2.50 input / $7.50 output per 1M tokens (Singapore/International tier) — [Alibaba Cloud Model Studio Pricing](https://www.alibabacloud.com/help/en/model-studio/model-pricing), retrieved 2026-07-05 — notably above `glm-5.2`'s $1.40/$4.40 despite scoring lower.

**Checked and rejected as a thinking-tier candidate** (2026-07-05, `upgrade-opencode-go-models`
plan): even the unverified 60.6% figure doesn't clear `glm-5.2`'s confirmed 62.1%, despite costing
~1.8x more per input token.

---

### opencode-go/qwen3.7-plus

**Provider**: Alibaba (Qwen team) | **Release**: not confirmed this pass

**Primary sources**: no primary source located as of 2026-07-05; described only as "within 2pp of
Max on SWE-bench Pro" in secondary coverage, no standalone figure found.

| Benchmark     | Score     | Confidence             | Source                                     |
| ------------- | --------- | ---------------------- | ------------------------------------------ |
| SWE-bench Pro | not found | `[Needs Verification]` | No primary source located as of 2026-07-05 |

**Pricing**: $0.40 (0-256K context) / $1.20 (256K-1M) input, $1.60 (0-256K) / $4.80 (256K-1M) output
per 1M tokens — [Alibaba Cloud Model Studio Pricing](https://www.alibabacloud.com/help/en/model-studio/model-pricing), retrieved 2026-07-05.

---

### opencode-go/deepseek-v4-flash

**Provider**: DeepSeek | **Release**: 2026-04-24

**Primary sources**:

- [HuggingFace deepseek-ai/DeepSeek-V4-Flash](https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash)

| Benchmark          | Score         | Confidence             | Source                                       |
| ------------------ | ------------- | ---------------------- | -------------------------------------------- |
| SWE-bench Verified | **79.0%**     | `[Self-reported]`      | HF model card (1.6pp behind V4 Pro at 80.6%) |
| SWE-bench Pro      | Not published | `[Needs Verification]` | —                                            |
| GPQA Diamond       | Not published | `[Needs Verification]` | —                                            |

**Architecture**: 284B total / 13B active (MoE) | **Context**: 1M tokens | **License**: MIT (open-weight) | **Note**: Highest rate limit in entire roster (31,650 req/5h) — designed as the speed/throughput tier.

---

## Model Selection Mapping

Cross-reference with [AI Agent Model Selection Convention](../../repo-governance/development/agents/model-selection.md)
tier assignments. The Claude-to-OpenCode mapping records what the former in-tree binding generator
produced; the current generator (`./rhino harness adapters generate`, configured by `repo-config.yml`
`harness:`) writes OpenCode agent adapters with no `model` field.

| Claude Alias              | Claude Model (2026)         | Pricing (in/out MTok) | SWE-bench Verified | OpenCode Go ID           |
| ------------------------- | --------------------------- | --------------------- | ------------------ | ------------------------ |
| `opus` (thinking)         | `claude-opus-4-8`           | $5 / $25              | 88.6% `[Verified]` | `opencode-go/glm-5.2`    |
| `sonnet`/omit (execution) | `claude-sonnet-5`           | $2→$3 / $10→$15       | 85.2% `[Verified]` | `opencode-go/glm-5.2`    |
| `haiku` (fast)            | `claude-haiku-4-5-20251001` | $1 / $5               | 73.3% `[Verified]` | `opencode-go/minimax-m3` |

**Note on OpenCode Go mapping**: The opencode-go roster has 15 models as of the 2026-07-28 generated snapshot (13 at the prior 2026-07-05 refresh — see the roster table above for the authoritative current count). The
thinking and execution tiers both map to `glm-5.2` — an explicit, intentional collapse (Decision 1,
`upgrade-opencode-go-models` plan `tech-docs.md`): no roster model separately clears Claude Opus
4.8's tier. The fast tier maps to `minimax-m3`, superseding the retired `glm-5` (unsuffixed) mapping.
This reflects the 3-branch structure encoded in the retired in-tree Rhino's `converter.rs` at time
of last sync. As the OpenCode Go roster evolves, the converter may be updated to point to
higher-capability models. See `model-selection.md` for the authoritative mapping rationale.

**`opus` anchor vs. `opus` alias — a deliberate distinction**: the dataset's `opus` anchor for the
benchmark bands in this doc is `claude-opus-5` (the current Opus generation, shipped 2026-07-24 — see
the tier-design prose and the generated frontier/capability-summary tables), but the repo's
`convert_model()` alias shown in the table above still resolves `opus` to `claude-opus-4-8` (the
prior Opus generation). The two are intentionally decoupled: the benchmark bands track the latest
shipped Opus, while the alias mapping is a separate governance decision not changed by a data
refresh. Do not read the `claude-opus-5` rows in the generated tables as a statement that the alias
has been repointed.

---

## Per-Harness Standard-Tier Pricing

One standard API price per model (generated — see the block below for its date), from the vendor's
own pricing page, or from OpenCode's docs where the vendor publishes no reachable price page.
Subscriptions (including the OpenCode Go plan) are not compared. The per-model prose pricing notes
higher up were last hand-researched 2026-07-05 and may lag the generated table — where the two
disagree, the generated block below is authoritative.

<!-- BEGIN GENERATED: pricing -->

> Standard API prices, USD per 1M tokens, last updated 2026-10-01. Blended = (3 × input + output) ÷ 4. `opencode` = the rate OpenCode lists, used only where the vendor publishes no reachable price page.

| Model                                   | Vendor      | Input  | Output | Blended | Listed by | Note                                                                                      |
| --------------------------------------- | ----------- | ------ | ------ | ------- | --------- | ----------------------------------------------------------------------------------------- |
| Claude Fable 5.1                        | Anthropic   | $10    | $50    | $20     | vendor    |                                                                                           |
| Claude Fable 5                          | Anthropic   | $10    | $50    | $20     | vendor    |                                                                                           |
| Claude Opus 5.5                         | Anthropic   | $4     | $20    | $8      | vendor    |                                                                                           |
| Claude Opus 5                           | Anthropic   | $5     | $25    | $10     | vendor    |                                                                                           |
| Claude Opus 4.8                         | Anthropic   | $5     | $25    | $10     | vendor    |                                                                                           |
| Claude Sonnet 5.5                       | Anthropic   | $2     | $10    | $4      | vendor    |                                                                                           |
| Claude Sonnet 5                         | Anthropic   | $2     | $10    | $4      | vendor    |                                                                                           |
| Claude Sonnet 4.6                       | Anthropic   | $3     | $15    | $6      | vendor    |                                                                                           |
| Claude Haiku 4.5                        | Anthropic   | $1     | $5     | $2      | vendor    |                                                                                           |
| Claude Mythos 5.1                       | Anthropic   | $10    | $50    | $20     | vendor    | Invitation only (Project Glasswing).                                                      |
| Claude Mythos 5                         | Anthropic   | $10    | $50    | $20     | vendor    | Invitation only (Project Glasswing).                                                      |
| GPT-6 Astra                             | OpenAI      | $10    | $50    | $20     | vendor    | Prompts over 272K tokens: 2× input, 1.5× output.                                          |
| GPT-6.1 Sol                             | OpenAI      | $2     | $10    | $4      | vendor    |                                                                                           |
| GPT-6 Sol                               | OpenAI      | $2     | $10    | $4      | vendor    |                                                                                           |
| GPT-5.6 Sol                             | OpenAI      | $4     | $20    | $8      | vendor    | Promotional price, held at least through 2026-11-21.                                      |
| GPT-5.6 Terra                           | OpenAI      | $2     | $12    | $4.5    | vendor    |                                                                                           |
| GPT-5.4 mini                            | OpenAI      | $0.75  | $4.5   | $1.688  | vendor    | The mini tier that Terra succeeds. Codex CLI only with an API key.                        |
| GPT-6 Luna                              | OpenAI      | $0.1   | $0.5   | $0.2    | vendor    |                                                                                           |
| GPT-5.6 Luna                            | OpenAI      | $0.2   | $1.2   | $0.45   | vendor    |                                                                                           |
| GPT-5.4 nano                            | OpenAI      | $0.2   | $1.25  | $0.463  | vendor    | The nano tier that Luna succeeds.                                                         |
| Gemini 4 Argon                          | Google      | —      | —      | —       | —         | Limited access; no public API price yet.                                                  |
| Gemini 3.1 Pro (preview)                | Google      | $2     | $12    | $4.5    | vendor    | Prompts over 200K tokens: $4 / $18.                                                       |
| Gemini 3.8 Flash                        | Google      | $0.75  | $3.75  | $1.5    | vendor    | Promotional through 2026-12-31; $1.50 / $7.50 from 2027-01-01.                            |
| Gemini 3.7 Flash                        | Google      | $0.75  | $3.75  | $1.5    | vendor    | Promotional through 2026-12-31; $1.50 / $7.50 from 2027-01-01.                            |
| Gemini 3.6 Flash                        | Google      | $0.75  | $3.75  | $1.5    | vendor    | Promotional through 2026-12-31; $1.50 / $7.50 from 2027-01-01.                            |
| Gemini 3.5 Flash-Lite                   | Google      | $0.3   | $2.5   | $0.85   | vendor    |                                                                                           |
| Gemini 3.1 Flash-Lite                   | Google      | $0.25  | $1.5   | $0.563  | vendor    | Shuts down 2027-05-07.                                                                    |
| Grok 4.7                                | xAI         | $2     | $6     | $3      | vendor    | Prompts of 200K tokens or more: $4 / $12.                                                 |
| Grok 4.6                                | xAI         | $2     | $6     | $3      | vendor    | Prompts of 200K tokens or more: $4 / $12.                                                 |
| Grok 4.5                                | xAI         | $2     | $6     | $3      | vendor    | Prompts of 200K tokens or more: $4 / $12.                                                 |
| Grok Build 0.1                          | xAI         | $1     | $2     | $1.25   | vendor    |                                                                                           |
| GLM-5.3                                 | Z.ai        | $1.4   | $4.4   | $2.15   | vendor    |                                                                                           |
| GLM-5.2                                 | Z.ai        | $1.4   | $4.4   | $2.15   | vendor    |                                                                                           |
| GLM-5.1                                 | Z.ai        | $1.4   | $4.4   | $2.15   | vendor    |                                                                                           |
| GLM-5.3 Flash                           | Z.ai        | $0.15  | $0.5   | $0.237  | vendor    |                                                                                           |
| GLM-4.7-Flash                           | Z.ai        | $0     | $0     | $0      | vendor    | Free on the Z.ai API.                                                                     |
| Kimi K3                                 | Moonshot AI | $3     | $15    | $6      | vendor    |                                                                                           |
| Kimi K2.6                               | Moonshot AI | $0.95  | $4     | $1.712  | vendor    |                                                                                           |
| Kimi K2.7 Code                          | Moonshot AI | $0.95  | $4     | $1.712  | vendor    |                                                                                           |
| DeepSeek V4 Pro                         | DeepSeek    | $1.32  | $3.96  | $1.98   | vendor    | Peak-hour rate; off-peak is half.                                                         |
| DeepSeek V4.1 Flash                     | DeepSeek    | $0.3   | $1.2   | $0.525  | vendor    | Peak-hour rate; off-peak is half.                                                         |
| DeepSeek V4 Flash                       | DeepSeek    | $0.3   | $1.2   | $0.525  | opencode  | DeepSeek routes this name to V4.1 Flash; peak-hour rate.                                  |
| DeepSeek V4 Flash Vision (experimental) | DeepSeek    | $0.3   | $1.2   | $0.525  | opencode  | Peak-hour rate; off-peak is half.                                                         |
| Qwen3.8 Max                             | Alibaba     | $2     | $6     | $3      | vendor    |                                                                                           |
| Qwen3.7 Max                             | Alibaba     | $2.5   | $7.5   | $3.75   | vendor    |                                                                                           |
| Qwen3.6 Max (preview)                   | Alibaba     | $1.3   | $7.8   | $2.925  | vendor    | Prompts over 128K tokens: $2 / $12.                                                       |
| Qwen3.8 Flash                           | Alibaba     | $0.15  | $0.47  | $0.23   | vendor    |                                                                                           |
| Qwen3.7 Flash                           | Alibaba     | $0.1   | $0.4   | $0.175  | vendor    | Prompts of 32K–256K tokens; up to 32K: $0.03 / $0.13; over 256K: $0.20 / $0.80.           |
| Qwen3.6 Flash                           | Alibaba     | $0.25  | $1.5   | $0.563  | vendor    | Prompts over 256K tokens: $1 / $4.                                                        |
| Qwen3.7 Plus                            | Alibaba     | $0.4   | $1.6   | $0.7    | vendor    | Prompts over 256K tokens: $1.20 / $4.80.                                                  |
| Qwen3.6 Plus                            | Alibaba     | $0.5   | $3     | $1.125  | vendor    | Prompts over 256K tokens: $2 / $6.                                                        |
| Qwen3.5 Plus                            | Alibaba     | $0.4   | $2.4   | $0.9    | vendor    | Prompts over 256K tokens cost more.                                                       |
| Muse Spark 1.3                          | Meta        | $1.25  | $4.25  | $2      | opencode  | OpenCode Go carries the cheaper Contributor tier, on which Meta may train on submissions. |
| Muse Spark 1.2                          | Meta        | $1.25  | $4.25  | $2      | opencode  | OpenCode Go carries the cheaper Contributor tier, on which Meta may train on submissions. |
| Muse Spark 1.1                          | Meta        | $1.25  | $4.25  | $2      | vendor    |                                                                                           |
| MiniMax M3                              | MiniMax     | $0.3   | $1.2   | $0.525  | vendor    | Up to 512K tokens, after a vendor discount with no stated end date.                       |
| MiniMax M2.7                            | MiniMax     | $0.3   | $1.2   | $0.525  | vendor    |                                                                                           |
| MiniMax M2.5                            | MiniMax     | $0.3   | $1.2   | $0.525  | vendor    | Listed by MiniMax as a legacy model.                                                      |
| MiMo V2.6 Pro                           | Xiaomi      | $0.435 | $0.87  | $0.544  | opencode  |                                                                                           |
| MiMo V2.5 Pro                           | Xiaomi      | $0.435 | $0.87  | $0.544  | opencode  | Xiaomi takes this model offline on 2026-10-21.                                            |
| MiMo V2.6 Flash                         | Xiaomi      | $0.14  | $0.28  | $0.175  | opencode  |                                                                                           |
| MiMo V2.5                               | Xiaomi      | $0.14  | $0.28  | $0.175  | opencode  | Xiaomi takes this model offline on 2026-10-21.                                            |
| Hy4 (preview)                           | Tencent     | $0.834 | $2.501 | $1.251  | opencode  |                                                                                           |
| Hy3                                     | Tencent     | $0.14  | $0.58  | $0.25   | opencode  |                                                                                           |
| LongCat 2.5 (preview)                   | Meituan     | —      | —      | —       | —         | Free on OpenCode for a limited time; no API price published.                              |
| LongCat 2.0                             | Meituan     | $0.3   | $1.2   | $0.525  | opencode  | Promotional rate with no published end date.                                              |

<!-- END GENERATED: pricing -->

Notes: (a) Alibaba Cloud Model Studio prices by region; Singapore/International rates are shown as the globally reachable rate. (b) DeepSeek prices by time of day; the peak rate is shown. (c) Xiaomi, Meta, Tencent, and Meituan publish no reachable API price page, so their rows use OpenCode's listed rate.

---

## Frontier/Big-Brand Model Reference (Informational Only — Not Available via `opencode-go`)

Current Anthropic/OpenAI/Google/xAI pricing and independent benchmark results (generated — see the
block caption for its date; per-model prose above was last hand-researched 2026-07-05). A few of these
(GPT Luna, Grok) are also selectable on OpenCode Go, but they are listed here purely for
cost/capability contrast — **none of these are, or will be, routed to by this repo's `convert_model()`
or Pi's model pin** (see Decision 0, `upgrade-opencode-go-models` plan `tech-docs.md`: BYOM harnesses
in this repo must not route to Anthropic, OpenAI, Google, or other frontier/big-brand providers).

<!-- BEGIN GENERATED: frontier -->

> Anthropic, OpenAI, Google, and xAI models, last updated 2026-10-01. Independent results only.

| Vendor    | Model                    | Access  | DeepSWE 1.1        | Terminal-Bench 4.0   | SWE-Atlas QnA  | Index | Tier         | Input | Output |
| --------- | ------------------------ | ------- | ------------------ | -------------------- | -------------- | ----- | ------------ | ----- | ------ |
| Anthropic | Claude Fable 5.1         | general | 64.31% (AA)        | 57.58% (AA)          | 64.78% (AA)    | 62.22 | ultra        | $10   | $50    |
| Anthropic | Claude Fable 5           | general | 69.91% (Datacurve) | 44.55% (TB official) | 39.00% (Scale) | 51.15 | execution    | $10   | $50    |
| Anthropic | Claude Opus 5.5          | general | 68.44% (AA)        | 63.13% (AA)          | 66.40% (AA)    | 65.99 | ultra        | $4    | $20    |
| Anthropic | Claude Opus 5            | general | 62.54% (AA)        | 54.55% (AA)          | 62.10% (AA)    | 59.73 | ultra        | $5    | $25    |
| Anthropic | Claude Opus 4.8          | general | 58.97% (Datacurve) | 23.64% (TB official) | 57.26% (Scale) | 46.62 | execution    | $5    | $25    |
| Anthropic | Claude Sonnet 5.5        | general | 71.98% (AA)        | 66.16% (AA)          | 66.94% (AA)    | 68.36 | ultra        | $2    | $10    |
| Anthropic | Claude Sonnet 5          | general | 53.85% (Datacurve) | 12.42% (TB official) | —              | 33.13 | fast         | $2    | $10    |
| Anthropic | Claude Sonnet 4.6        | general | 29.93% (Datacurve) | —                    | 31.20% (Scale) | 30.56 | fast         | $3    | $15    |
| Anthropic | Claude Haiku 4.5         | general | —                  | —                    | —              | —     | insufficient | $1    | $5     |
| Anthropic | Claude Mythos 5.1        | limited | —                  | —                    | —              | —     | insufficient | $10   | $50    |
| Anthropic | Claude Mythos 5          | limited | —                  | —                    | —              | —     | insufficient | $10   | $50    |
| OpenAI    | GPT-6 Astra              | limited | 67.55% (AA)        | 55.56% (AA)          | 61.83% (AA)    | 61.65 | ultra        | $10   | $50    |
| OpenAI    | GPT-6.1 Sol              | general | 73.16% (AA)        | 54.55% (AA)          | 61.02% (AA)    | 62.91 | ultra        | $2    | $10    |
| OpenAI    | GPT-6 Sol                | general | 69.03% (AA)        | 43.43% (AA)          | 57.53% (AA)    | 56.66 | planning     | $2    | $10    |
| OpenAI    | GPT-5.6 Sol              | general | 72.27% (AA)        | 37.37% (AA)          | 54.03% (AA)    | 54.56 | planning     | $4    | $20    |
| OpenAI    | GPT-5.6 Terra            | general | 69.62% (Datacurve) | 21.52% (TB official) | —              | 45.57 | execution    | $2    | $12    |
| OpenAI    | GPT-5.4 mini             | general | —                  | 2.52% (Vals)         | —              | —     | insufficient | $0.75 | $4.5   |
| OpenAI    | GPT-6 Luna               | general | 63.72% (AA)        | 15.15% (AA)          | 44.35% (AA)    | 41.07 | fast         | $0.1  | $0.5   |
| OpenAI    | GPT-5.6 Luna             | general | 66.37% (AA)        | 14.65% (AA)          | 48.66% (AA)    | 43.23 | fast         | $0.2  | $1.2   |
| OpenAI    | GPT-5.4 nano             | general | —                  | —                    | —              | —     | insufficient | $0.2  | $1.25  |
| Google    | Gemini 4 Argon           | limited | 78.76% (AA)        | 56.06% (AA)          | 56.45% (AA)    | 63.76 | ultra        | —     | —      |
| Google    | Gemini 3.1 Pro (preview) | general | 11.73% (Datacurve) | 2.52% (Vals)         | 13.50% (Scale) | 9.25  | fast         | $2    | $12    |
| Google    | Gemini 3.8 Flash         | general | 65.78% (AA)        | 14.65% (AA)          | 45.16% (AA)    | 41.86 | fast         | $0.75 | $3.75  |
| Google    | Gemini 3.7 Flash         | general | 65.49% (Datacurve) | 11.21% (TB official) | —              | 38.35 | fast         | $0.75 | $3.75  |
| Google    | Gemini 3.6 Flash         | general | 46.68% (Datacurve) | —                    | —              | —     | insufficient | $0.75 | $3.75  |
| Google    | Gemini 3.5 Flash-Lite    | general | —                  | —                    | —              | —     | insufficient | $0.3  | $2.5   |
| Google    | Gemini 3.1 Flash-Lite    | general | —                  | —                    | —              | —     | insufficient | $0.25 | $1.5   |
| xAI       | Grok 4.7                 | general | 72.57% (AA)        | 33.33% (AA)          | 62.90% (AA)    | 56.27 | planning     | $2    | $6     |
| xAI       | Grok 4.6                 | general | 64.90% (AA)        | 17.68% (AA)          | 58.33% (AA)    | 46.97 | execution    | $2    | $6     |
| xAI       | Grok 4.5                 | general | 53.76% (Datacurve) | 12.42% (TB official) | —              | 33.09 | fast         | $2    | $6     |
| xAI       | Grok Build 0.1           | general | —                  | —                    | —              | —     | insufficient | $1    | $2     |

<!-- END GENERATED: frontier -->

Notes: `limited` access = invitation-only or staged rollout (Claude Mythos 5.1, GPT-6 Astra, Gemini 4
Argon). Each figure names its operator: AA = Artificial Analysis, Datacurve, TB official = the
Terminal-Bench board, Vals = Vals AI, Scale = Scale AI.

---

## Model Capability Summary (Coding-Agents Lens)

<!-- BEGIN GENERATED: capability-summary -->

> Independent composite-benchmark results for every model, last updated 2026-10-01. Index = equal-weight mean of the scored benchmarks (at least two); tier = highest tier whose anchor's index the model's index matches or beats. Cost per task from Artificial Analysis.

| Model                                   | Vendor      | DeepSWE 1.1        | Terminal-Bench 4.0   | SWE-Atlas QnA  | Index | Tier         | Cost/task |
| --------------------------------------- | ----------- | ------------------ | -------------------- | -------------- | ----- | ------------ | --------- |
| Claude Fable 5.1                        | Anthropic   | 64.31% (AA)        | 57.58% (AA)          | 64.78% (AA)    | 62.22 | ultra        | $12.39    |
| Claude Fable 5                          | Anthropic   | 69.91% (Datacurve) | 44.55% (TB official) | 39.00% (Scale) | 51.15 | execution    | —         |
| Claude Opus 5.5                         | Anthropic   | 68.44% (AA)        | 63.13% (AA)          | 66.40% (AA)    | 65.99 | ultra        | $13.04    |
| Claude Opus 5                           | Anthropic   | 62.54% (AA)        | 54.55% (AA)          | 62.10% (AA)    | 59.73 | ultra        | $10.79    |
| Claude Opus 4.8                         | Anthropic   | 58.97% (Datacurve) | 23.64% (TB official) | 57.26% (Scale) | 46.62 | execution    | —         |
| Claude Sonnet 5.5                       | Anthropic   | 71.98% (AA)        | 66.16% (AA)          | 66.94% (AA)    | 68.36 | ultra        | $14.19    |
| Claude Sonnet 5                         | Anthropic   | 53.85% (Datacurve) | 12.42% (TB official) | —              | 33.13 | fast         | —         |
| Claude Sonnet 4.6                       | Anthropic   | 29.93% (Datacurve) | —                    | 31.20% (Scale) | 30.56 | fast         | —         |
| Claude Haiku 4.5                        | Anthropic   | —                  | —                    | —              | —     | insufficient | —         |
| Claude Mythos 5.1                       | Anthropic   | —                  | —                    | —              | —     | insufficient | —         |
| Claude Mythos 5                         | Anthropic   | —                  | —                    | —              | —     | insufficient | —         |
| GPT-6 Astra                             | OpenAI      | 67.55% (AA)        | 55.56% (AA)          | 61.83% (AA)    | 61.65 | ultra        | $7.47     |
| GPT-6.1 Sol                             | OpenAI      | 73.16% (AA)        | 54.55% (AA)          | 61.02% (AA)    | 62.91 | ultra        | $1.04     |
| GPT-6 Sol                               | OpenAI      | 69.03% (AA)        | 43.43% (AA)          | 57.53% (AA)    | 56.66 | planning     | $2.99     |
| GPT-5.6 Sol                             | OpenAI      | 72.27% (AA)        | 37.37% (AA)          | 54.03% (AA)    | 54.56 | planning     | $6.35     |
| GPT-5.6 Terra                           | OpenAI      | 69.62% (Datacurve) | 21.52% (TB official) | —              | 45.57 | execution    | —         |
| GPT-5.4 mini                            | OpenAI      | —                  | 2.52% (Vals)         | —              | —     | insufficient | —         |
| GPT-6 Luna                              | OpenAI      | 63.72% (AA)        | 15.15% (AA)          | 44.35% (AA)    | 41.07 | fast         | $0.18     |
| GPT-5.6 Luna                            | OpenAI      | 66.37% (AA)        | 14.65% (AA)          | 48.66% (AA)    | 43.23 | fast         | $0.44     |
| GPT-5.4 nano                            | OpenAI      | —                  | —                    | —              | —     | insufficient | —         |
| Gemini 4 Argon                          | Google      | 78.76% (AA)        | 56.06% (AA)          | 56.45% (AA)    | 63.76 | ultra        | $5.84     |
| Gemini 3.1 Pro (preview)                | Google      | 11.73% (Datacurve) | 2.52% (Vals)         | 13.50% (Scale) | 9.25  | fast         | —         |
| Gemini 3.8 Flash                        | Google      | 65.78% (AA)        | 14.65% (AA)          | 45.16% (AA)    | 41.86 | fast         | $2.47     |
| Gemini 3.7 Flash                        | Google      | 65.49% (Datacurve) | 11.21% (TB official) | —              | 38.35 | fast         | —         |
| Gemini 3.6 Flash                        | Google      | 46.68% (Datacurve) | —                    | —              | —     | insufficient | —         |
| Gemini 3.5 Flash-Lite                   | Google      | —                  | —                    | —              | —     | insufficient | —         |
| Gemini 3.1 Flash-Lite                   | Google      | —                  | —                    | —              | —     | insufficient | —         |
| Grok 4.7                                | xAI         | 72.57% (AA)        | 33.33% (AA)          | 62.90% (AA)    | 56.27 | planning     | $8.82     |
| Grok 4.6                                | xAI         | 64.90% (AA)        | 17.68% (AA)          | 58.33% (AA)    | 46.97 | execution    | $3.57     |
| Grok 4.5                                | xAI         | 53.76% (Datacurve) | 12.42% (TB official) | —              | 33.09 | fast         | —         |
| Grok Build 0.1                          | xAI         | —                  | —                    | —              | —     | insufficient | —         |
| GLM-5.3                                 | Z.ai        | 61.36% (AA)        | 39.90% (AA)          | 59.41% (AA)    | 53.56 | execution    | $4.24     |
| GLM-5.2                                 | Z.ai        | 43.78% (Datacurve) | —                    | 48.12% (Scale) | 45.95 | execution    | —         |
| GLM-5.1                                 | Z.ai        | —                  | 2.00% (AA)           | —              | —     | insufficient | —         |
| GLM-5.3 Flash                           | Z.ai        | 63.39% (Datacurve) | 32.80% (AA)          | —              | 48.09 | execution    | —         |
| GLM-4.7-Flash                           | Z.ai        | —                  | —                    | —              | —     | insufficient | —         |
| Kimi K3                                 | Moonshot AI | 68.44% (AA)        | 21.21% (AA)          | 66.13% (AA)    | 51.93 | execution    | $5.05     |
| Kimi K2.6                               | Moonshot AI | —                  | —                    | —              | —     | insufficient | —         |
| Kimi K2.7 Code                          | Moonshot AI | 30.53% (Datacurve) | —                    | —              | —     | insufficient | —         |
| DeepSeek V4 Pro                         | DeepSeek    | 57.23% (AA)        | 10.10% (AA)          | 61.83% (AA)    | 43.05 | fast         | $0.24     |
| DeepSeek V4.1 Flash                     | DeepSeek    | —                  | 26.80% (AA)          | —              | —     | insufficient | —         |
| DeepSeek V4 Flash                       | DeepSeek    | 54.28% (AA)        | 10.61% (AA)          | 51.34% (AA)    | 38.74 | fast         | $0.09     |
| DeepSeek V4 Flash Vision (experimental) | DeepSeek    | —                  | —                    | —              | —     | insufficient | —         |
| Qwen3.8 Max                             | Alibaba     | 51.03% (AA)        | 16.67% (AA)          | 62.10% (AA)    | 43.27 | fast         | $3.48     |
| Qwen3.7 Max                             | Alibaba     | —                  | 2.00% (AA)           | —              | —     | insufficient | —         |
| Qwen3.6 Max (preview)                   | Alibaba     | —                  | —                    | —              | —     | insufficient | —         |
| Qwen3.8 Flash                           | Alibaba     | —                  | —                    | —              | —     | insufficient | —         |
| Qwen3.7 Flash                           | Alibaba     | —                  | —                    | —              | —     | insufficient | —         |
| Qwen3.6 Flash                           | Alibaba     | —                  | —                    | —              | —     | insufficient | —         |
| Qwen3.7 Plus                            | Alibaba     | —                  | —                    | —              | —     | insufficient | —         |
| Qwen3.6 Plus                            | Alibaba     | —                  | —                    | —              | —     | insufficient | —         |
| Qwen3.5 Plus                            | Alibaba     | —                  | —                    | —              | —     | insufficient | —         |
| Muse Spark 1.3                          | Meta        | 71.68% (AA)        | 31.82% (AA)          | 59.41% (AA)    | 54.30 | execution    | $3.98     |
| Muse Spark 1.2                          | Meta        | 54.87% (Datacurve) | 6.06% (Vals)         | —              | 30.46 | fast         | —         |
| Muse Spark 1.1                          | Meta        | 53.32% (Datacurve) | 6.00% (AA)           | 42.20% (Scale) | 33.84 | fast         | —         |
| MiniMax M3                              | MiniMax     | —                  | 2.00% (AA)           | —              | —     | insufficient | —         |
| MiniMax M2.7                            | MiniMax     | —                  | —                    | —              | —     | insufficient | —         |
| MiniMax M2.5                            | MiniMax     | —                  | —                    | 10.30% (Scale) | —     | insufficient | —         |
| MiMo V2.6 Pro                           | Xiaomi      | —                  | 34.80% (AA)          | —              | —     | insufficient | —         |
| MiMo V2.5 Pro                           | Xiaomi      | —                  | 0.51% (Vals)         | —              | —     | insufficient | —         |
| MiMo V2.6 Flash                         | Xiaomi      | —                  | 24.24% (Vals)        | —              | —     | insufficient | —         |
| MiMo V2.5                               | Xiaomi      | —                  | —                    | —              | —     | insufficient | —         |
| Hy4 (preview)                           | Tencent     | —                  | 8.08% (Vals)         | —              | —     | insufficient | —         |
| Hy3                                     | Tencent     | —                  | —                    | —              | —     | insufficient | —         |
| LongCat 2.5 (preview)                   | Meituan     | —                  | —                    | —              | —     | insufficient | —         |
| LongCat 2.0                             | Meituan     | —                  | —                    | —              | —     | insufficient | —         |

<!-- END GENERATED: capability-summary -->

Dropped from OpenCode Go between the 2026-07-28 and 2026-10-01 refreshes: Grok 4.5, GLM-5.1, Qwen3.7 Max,
Qwen3.6 Plus. Space Bunny Free is on OpenCode Go but excluded here: it names no vendor.

---

## Limitations and Caveats

1. **Claude Opus 4.8/Sonnet 5 secondary benchmarks not re-researched this pass**: only SWE-bench Verified/Pro, Terminal-Bench 2.1, and OSWorld-Verified were independently re-verified for the 2026-07-05 refresh. GPQA Diamond, AIME 2025, HLE, CharXiv, MCP-Atlas, BrowseComp, Finance Agent, and CursorBench scores were tracked for the superseded Opus 4.7/Sonnet 4.6 (now in the Legacy Models table) but not re-derived for the current models — check Anthropic's own launch materials for the current full suite.

2. **Haiku 4.5 GPQA / AIME discrepancy is unresolved**: Two values circulate for each. 74.1% GPQA and 80.7% AIME are the more consistently cited across aggregators; 67.2% and 83.7% appear in fewer sources. Both tagged `[Needs Verification]` — update when system card PDF is confirmed.

3. **Claude Opus 5 shipped 2026-07-24** ([Anthropic model overview](https://platform.claude.com/docs/en/models/overview), accessed 2026-07-28): an earlier draft referenced "Opus 5" as the thinking-tier comparison bar before it shipped; it has since shipped and is the dataset's current `opus` anchor (`claude-opus-5`, SWE-bench Verified 96.0% `[Self-reported]`). Claude Opus 4.8 (2026-05-28) is the prior Opus generation, one back in the dataset. Claude Fable 5 (GA 2026-06-09) is a distinct, higher tier — not what the `opus` alias resolves to.

4. **All OpenCode Go model scores are self-reported by their respective labs unless tagged `[Verified]`/corroborated**: No independent third-party replication of most GLM, Kimi, MiMo, MiniMax, Qwen, or DeepSeek scores has been identified. Treat with appropriate skepticism compared to Claude scores corroborated by multiple outlets.

5. **MiniMax M2.7 SWE-bench Verified not officially published**: The ~78% figure is a third-party estimate. Only SWE-bench Pro (56.22%) is from the official announcement. (M2.7 is now superseded as the fast-tier target by MiniMax M3 — see the Model Selection Mapping section.)

6. **GLM-5.1 SWE-bench Verified not separately published**: GLM-5.1 is a post-training upgrade to GLM-5 (now retired from the live roster). Only SWE-bench Pro (58.4%) is in the GLM-5.1 official benchmark table.

7. **Qwen3.6 Plus, Qwen3.7 Max, and Qwen3.7 Plus scores from third-party aggregators only, or not found at all**: Official Qwen primary sources were not directly confirmed at research time (the official `qwen.ai` blog is client-side-rendered and could not be fetched). Qwen3.7 Max/Plus were specifically checked as possible thinking-tier candidates and rejected — see the Roster Overview notes.

8. **CursorBench has no public leaderboard**: not re-researched for Opus 4.8/Sonnet 5 in this refresh; the historical 70% figure for Opus 4.7 (now in the Legacy Models table) was partner-reported via Anthropic's launch post and cannot be independently reproduced.

9. **OpenCode Go roster changes without fixed cadence**: The roster table above reflects the 2026-07-28 generated snapshot (15 models); the prior 2026-07-05 refresh independently re-confirmed 13 models via the live `opencode models` CLI (not docs-only). The roster has changed three times in the ~3 months since the 2026-05-07 refresh — 4 models retired (unsuffixed GLM-5, Kimi K2.5, MiniMax M2.5, Qwen3.5 Plus), 5 added by 2026-07-05 (GLM-5.2, Kimi K2.7 Code, MiniMax M3, Qwen3.7 Max, Qwen3.7 Plus), and 2 further additions by 2026-07-28 (Grok 4.5, Kimi K3). Check the live list in the OpenCode TUI for the current roster before relying on this table.

10. **AIME 2026 ≠ AIME 2025**: the retired GLM-5 and its GLM-5.1 successor reported AIME 2026 scores in the prior refresh. These are NOT directly comparable to Claude Sonnet 4.6's (now-legacy) AIME 2025 score of 95.6%.

11. **Prices and context windows** are as of the access date shown. Check official API docs for current values before making cost comparisons.

12. **Accuracy as of**: 2026-07-28 for the generated tables (roster, pricing, frontier, capability-summary); 2026-07-05 for the hand-curated model-by-model prose. Model versions, scores, pricing, and OpenCode Go roster change frequently. Re-verify when making tier assignment decisions more than 3 months from these dates.

13. **Per-harness pricing vs. `opencode-go` subscription pricing**: the "Per-Harness Standard-Tier Pricing" table above mixes both — metered harnesses (`claude-code`, `codex-cli`, `cursor`, `opencode-zen`) at each model's own provider's direct pay-as-you-go rate, and `opencode-go` rows showing the flat-rate subscription this repo's actual OpenCode/Pi configuration pays. The two pricing models are not interchangeable for cost planning.

---

## Historical / Comparative References

These models are not current tier choices but are referenced in comparison or as platform fallbacks.

| Model             | SWE-bench Verified       | Context | Notes                                                            |
| ----------------- | ------------------------ | ------- | ---------------------------------------------------------------- |
| Claude Sonnet 4.5 | ~77.2% `[Self-reported]` | 200k    | Bedrock/Vertex platform fallback                                 |
| Claude Opus 4.6   | 80.8% `[Self-reported]`  | 1M      | Comparison baseline for GLM-5.1 SWE-bench Pro; SEAL shows 51.90% |

---

## Sources

1. Anthropic Models Overview — <https://platform.claude.com/docs/en/about-claude/models/overview> (accessed 2026-05-07)
2. Anthropic Model Deprecations — <https://platform.claude.com/docs/en/about-claude/model-deprecations>
3. Anthropic System Cards Index — <https://www.anthropic.com/system-cards>
4. Introducing Claude Opus 4.7 — <https://www.anthropic.com/news/claude-opus-4-7> (2026-04-16)
5. Claude Opus 4.7 What's New — <https://platform.claude.com/docs/en/about-claude/models/whats-new-claude-4-7>
6. Claude Opus 4.7 System Card — <https://www.anthropic.com/claude-opus-4-7-system-card>
7. Introducing Claude Sonnet 4.6 — <https://www.anthropic.com/news/claude-sonnet-4-6> (2026-02-17)
8. Claude Sonnet 4.6 System Card — <https://www.anthropic.com/claude-sonnet-4-6-system-card>
9. Introducing Claude Haiku 4.5 — <https://www.anthropic.com/news/claude-haiku-4-5> (2025-10-15)
10. Claude Haiku 4.5 System Card — <https://www.anthropic.com/claude-haiku-4-5-system-card>
11. Project Glasswing / Claude Mythos Preview — <https://www.anthropic.com/news/project-glasswing>
12. OpenCode Go Docs — <https://opencode.ai/docs/go/> (accessed 2026-05-07)
13. Z.ai GLM-5.1 Docs — <https://docs.z.ai/guides/llm/glm-5.1>
14. HuggingFace zai-org/GLM-5.1 — <https://huggingface.co/zai-org/GLM-5.1>
15. HuggingFace zai-org/GLM-5 — <https://huggingface.co/zai-org/GLM-5>
16. GLM-5 technical paper — <https://arxiv.org/html/2602.15763v1>
17. Kimi K2.6 Tech Blog — <https://www.kimi.com/blog/kimi-k2-6>
18. Kimi K2.5 Tech Blog — <https://www.kimi.com/blog/kimi-k2-5>
19. HuggingFace moonshotai/Kimi-K2.6 — <https://huggingface.co/moonshotai/Kimi-K2.6>
20. MiMo-V2.5-Pro Official — <https://mimo.xiaomi.com/mimo-v2-5-pro/>
21. HuggingFace XiaomiMiMo/MiMo-V2.5-Pro — <https://huggingface.co/XiaomiMiMo/MiMo-V2.5-Pro>
22. HuggingFace XiaomiMiMo/MiMo-V2.5 — <https://huggingface.co/XiaomiMiMo/MiMo-V2.5>
23. MiniMax M2.7 Official — <https://www.minimax.io/news/minimax-m27-en>
24. MiniMax M2.5 Official — <https://www.minimax.io/news/minimax-m25>
25. HuggingFace MiniMaxAI/MiniMax-M2.7 — <https://huggingface.co/MiniMaxAI/MiniMax-M2.7>
26. HuggingFace MiniMaxAI/MiniMax-M2.5 — <https://huggingface.co/MiniMaxAI/MiniMax-M2.5>
27. HuggingFace deepseek-ai/DeepSeek-V4-Pro — <https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro>
28. HuggingFace deepseek-ai/DeepSeek-V4-Flash — <https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash>
29. DeepSeek API Changelog — <https://api-docs.deepseek.com/news/news260424>
30. SWE-bench Verified Official Leaderboard — <https://www.swebench.com/verified.html>
31. Scale AI SWE-bench Pro Leaderboard — <https://labs.scale.com/leaderboard/swe_bench_pro_public>
32. GPQA Diamond — Artificial Analysis — <https://artificialanalysis.ai/evaluations/gpqa-diamond>
33. AIME 2025 — Artificial Analysis — <https://artificialanalysis.ai/evaluations/aime-2025>
34. MathArena — <https://matharena.ai/>
35. Terminal-Bench 2.0 Leaderboard — <https://www.tbench.ai/leaderboard/terminal-bench/2.0>
36. OSWorld Official — <https://os-world.github.io/>
37. CursorBench Blog — <https://cursor.com/blog/cursorbench>
38. Vellum Claude Opus 4.7 Benchmarks Explained — <https://www.vellum.ai/blog/claude-opus-4-7-benchmarks-explained>
39. DataCamp Claude Haiku 4.5 — <https://www.datacamp.com/blog/anthropic-claude-haiku-4-5>
40. NxCode Claude Sonnet 4.6 Complete Guide — <https://www.nxcode.io/resources/news/claude-sonnet-4-6-complete-guide-benchmarks-pricing-2026>
41. Introducing Claude Sonnet 5 — <https://www.anthropic.com/news/claude-sonnet-5> (2026-06-30)
42. VentureBeat: Claude Opus 4.8 is here — <https://venturebeat.com/technology/anthropics-claude-opus-4-8-is-here-with-3x-cheaper-fast-mode-and-near-mythos-level-alignment> (2026-05-28)
43. MarkTechPost: Claude Sonnet 5 vs Sonnet 4.6 vs Opus 4.8 — <https://www.marktechpost.com/2026/06/30/anthropic-claude-sonnet-5-vs-sonnet-4-6-vs-opus-4-8-agentic-coding-benchmarks-api-pricing-and-cost-performance-tradeoffs-compared/>
44. Vellum: Claude Fable 5 and Mythos 5 Benchmarks Explained — <https://www.vellum.ai/blog/claude-fable-5-and-mythos-5-benchmarks-explained>
45. Anthropic API Pricing — <https://platform.claude.com/docs/en/about-claude/pricing>
46. Z.ai GLM-5.2 Docs — <https://docs.z.ai/guides/llm/glm-5.2>
47. HuggingFace zai-org/GLM-5.2 — <https://huggingface.co/zai-org/GLM-5.2>
48. Z.ai Pricing — <https://docs.z.ai/guides/overview/pricing>
49. MiniMax M3 blog — <https://www.minimax.io/blog/minimax-m3>
50. MiniMax Pay-as-you-go Pricing — <https://platform.minimax.io/docs/guides/pricing-paygo>
51. Flowtivity: Kimi K2.7-code review — <https://flowtivity.ai/blog/kimi-k2-7-code-review/>
52. Kimi Platform Pricing — <https://platform.kimi.ai/docs/pricing/chat-k27-code>, <https://platform.kimi.ai/docs/pricing/chat-k26>
53. amitray.com Qwen3.7-Max benchmark — <https://amitray.com/qwen3-7-max-benchmark/>
54. Weights & Biases Qwen3.7-Max Benchmark Scores — <https://wandb.ai/byyoung3/ml-news/reports/Qwen3-7-Max-Benchmark-Scores---VmlldzoxNjk1MzA1MQ>
55. Alibaba Cloud Model Studio Pricing — <https://www.alibabacloud.com/help/en/model-studio/model-pricing>
56. DeepSeek API Pricing — <https://api-docs.deepseek.com/quick_start/pricing>
57. Xiaomi MiMo Pay-as-you-go Pricing — <https://mimo.mi.com/docs/price/pay-as-you-go>
58. OpenAI API Pricing — <https://developers.openai.com/api/docs/pricing>
59. Scale AI SWE-bench Pro Public Leaderboard — <https://labs.scale.com/leaderboard/swe_bench_pro_public>
60. Gemini API Pricing — <https://ai.google.dev/gemini-api/docs/pricing>
61. Gemini 3.1 Pro model card — <https://deepmind.google/models/model-cards/gemini-3-1-pro/>
62. Gemini 3.5 Flash model card — <https://deepmind.google/models/model-cards/gemini-3-5-flash/>
