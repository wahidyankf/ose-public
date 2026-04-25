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

Canonical benchmark reference for all AI models used in this project. Last updated: 2026-04-19.

## Purpose and Scope

This document provides cited benchmark scores for every model used in `.claude/agents/` and
`.opencode/agent/`. Its purpose is to make tier assignments in
[AI Agent Model Selection Convention](../../governance/development/agents/model-selection.md) **auditable and
defensible** — anyone reading a tier decision can follow the citation chain from claim to
primary source here.

All docs that cite benchmark numbers link to this file. This file links to primary sources.

## Benchmark Definitions

| Benchmark          | What it measures                                                                          | Relevance to coding agents           |
| ------------------ | ----------------------------------------------------------------------------------------- | ------------------------------------ |
| SWE-bench Verified | Real GitHub issues resolved end-to-end; ~500 human-verified test cases                    | Primary signal for agentic code work |
| SWE-bench Pro      | Harder variant — proprietary issues requiring deeper context and multi-file reasoning     | Secondary signal for complex tasks   |
| GPQA Diamond       | Expert-level science questions (chemistry, biology, physics) requiring graduate reasoning | Proxy for deep analytical capability |
| AIME 2025          | Competition math problems; tests multi-step formal reasoning                              | Proxy for structured problem-solving |
| OSWorld            | Computer-use tasks (GUI, desktop automation)                                              | Relevant for computer-use agents     |
| HumanEval          | Function synthesis from docstrings; largely saturated at frontier (90%+)                  | Less discriminative at top tier      |
| ZClawBench         | Z.ai proprietary benchmark; methodology undisclosed                                       | Not independently verifiable         |

## Claude Models (Anthropic)

### Claude Opus 4.7

**Model ID**: `claude-opus-4-7` | **Alias**: `opus` (omit in agent frontmatter for budget-adaptive inherit)

**Primary sources**:

- [Anthropic Models Overview](https://platform.claude.com/docs/en/about-claude/models/overview) (official API docs, accessed 2026-04-19)
- [Introducing Claude Opus 4.7](https://www.anthropic.com/news/claude-opus-4-7) (Anthropic, April 16, 2026)
- [Claude Opus 4.7 System Card](https://www.anthropic.com/claude-opus-4-7-system-card)

| Benchmark          | Score                    | Confidence   | Source / Date                                                   |
| ------------------ | ------------------------ | ------------ | --------------------------------------------------------------- |
| SWE-bench Verified | 87.6%                    | `[Verified]` | Third-party corroboration: VentureBeat, BenchLM.ai (2026-04-16) |
| SWE-bench Pro      | 64.3%                    | `[Verified]` | Official release post via VentureBeat (2026-04-16)              |
| GPQA Diamond       | 94.2%                    | `[Verified]` | Multiple aggregators citing official release (2026-04-16)       |
| CursorBench        | 70%                      | `[Verified]` | Official Anthropic release post (2026-04-16)                    |
| Context window     | 1M tokens                | —            | Official API docs (2026-04-19)                                  |
| Pricing            | $5 / $25 per MTok in/out | —            | Official API docs (2026-04-19)                                  |

**Note**: System card PDF was inaccessible at research time; numbers corroborated across
credible third-party outlets. Confirm against system card link above when accessible.

---

### Claude Sonnet 4.6

**Model ID**: `claude-sonnet-4-6` | **Alias**: `sonnet`

**Primary sources**:

- [Anthropic Models Overview](https://platform.claude.com/docs/en/about-claude/models/overview) (official API docs, accessed 2026-04-19)
- [Introducing Claude Sonnet 4.6](https://www.anthropic.com/news/claude-sonnet-4-6) (Anthropic, 2026-02-17)
- [Claude Sonnet 4.6 System Card](https://www.anthropic.com/claude-sonnet-4-6-system-card)

| Benchmark              | Score                    | Confidence   | Source / Date                                                      |
| ---------------------- | ------------------------ | ------------ | ------------------------------------------------------------------ |
| SWE-bench Verified     | 79.6%                    | `[Verified]` | Official release post (2026-02-17); 80.2% with prompt modification |
| OSWorld (computer use) | 72.5%                    | `[Verified]` | NxCode, Morph benchmarks citing Anthropic (2026-03-05)             |
| GPQA Diamond           | 89.9%                    | `[Verified]` | System card (10-trial avg, adaptive thinking, max effort)          |
| AIME 2025              | 95.6%                    | `[Verified]` | System card (10-trial avg, adaptive thinking, max effort)          |
| Context window         | 1M tokens                | —            | Official API docs (2026-04-19); beta                               |
| Pricing                | $3 / $15 per MTok in/out | —            | Official API docs (2026-04-19)                                     |

---

### Claude Haiku 4.5

**Model ID**: `claude-haiku-4-5-20251001` | **Alias**: `haiku`

**Primary sources**:

- [Anthropic Models Overview](https://platform.claude.com/docs/en/about-claude/models/overview) (official API docs, accessed 2026-04-19)
- [Introducing Claude Haiku 4.5](https://www.anthropic.com/news/claude-haiku-4-5) (Anthropic, 2025-10-15)

| Benchmark          | Score                   | Confidence             | Source / Date                                                       |
| ------------------ | ----------------------- | ---------------------- | ------------------------------------------------------------------- |
| SWE-bench Verified | 73.3%                   | `[Verified]`           | Official release post (2025-10-15); 50-trial avg, 128k think budget |
| GPQA Diamond       | 67.2%                   | `[Needs Verification]` | Artificial Analysis aggregator; not traced to system card           |
| AIME 2025          | 83.7%                   | `[Needs Verification]` | Aggregator-cited; primary source not confirmed                      |
| Context window     | 200k tokens             | —                      | Official API docs (2026-04-19)                                      |
| Pricing            | $1 / $5 per MTok in/out | —                      | Official API docs (2026-04-19)                                      |

**Note**: GPQA Diamond and AIME 2025 figures circulate in aggregators but the primary
Haiku 4.5 system card was not directly accessible at research time. Treat
`[Needs Verification]` scores as approximate until confirmed against official system card.

**Haiku 3 retirement**: `claude-3-haiku` (the previous haiku tier model) was retired
2026-04-19. All haiku-tier agents now resolve to `claude-haiku-4-5-20251001`.

---

## GLM Models (Z.ai Coding Plan / OpenCode)

> **Important**: Both GLM models are used only in the OpenCode runtime. Claude Code agents
> use Claude models. The sync pipeline maps Claude aliases to GLM IDs:
> `opus`/`sonnet`/`omit` → `zai-coding-plan/glm-5.1`, `haiku` → `zai-coding-plan/glm-5-turbo`.

### GLM-5.1

**Model ID**: `zai-coding-plan/glm-5.1` | **Maps from**: `opus`, `sonnet`, `""` (omit)

**Primary sources**:

- [Z.ai GLM-5.1 Release Coverage](https://officechai.com/ai/z-ai-glm-5-1-benchmarks-swe-bench-pro/) (OfficeChai, 2026-04-07)
- [Awesome Agents Review](https://awesomeagents.ai/reviews/review-glm-5-1/) (2026-04-17)
- [WaveSpeedAI Comparison](https://wavespeed.ai/blog/posts/glm-5-1-vs-claude-gpt-gemini-deepseek-llm-comparison/) (2026-03-30)

| Benchmark          | Score                         | Confidence        | Source / Date                                                           |
| ------------------ | ----------------------------- | ----------------- | ----------------------------------------------------------------------- |
| SWE-bench Pro      | 58.4                          | `[Self-reported]` | Z.ai self-reported; no independent third-party replication (2026-04-17) |
| SWE-bench Verified | 77.8%                         | `[Self-reported]` | WaveSpeedAI citing Z.ai (2026-03-30)                                    |
| GPQA Diamond       | 86.2                          | `[Self-reported]` | OfficeChai citing Z.ai (2026-04-07)                                     |
| Arena.ai Code Elo  | 1530 (rank 3)                 | `[Verified]`      | Arena.ai leaderboard — partial corroboration (2026-04-17)               |
| Context window     | 200k tokens                   | —                 | Multiple sources (2026-04-07)                                           |
| Pricing            | $1.00 / $3.20 per MTok in/out | —                 | OfficeChai (2026-04-07)                                                 |

**Critical flag — self-reported scores**: As of 2026-04-17 "a fully independent evaluation
on SWE-Bench Pro from a third-party lab hasn't been published" (Awesome Agents review). The
SWE-bench Pro 58.4 headline is a self-reported claim. Arena.ai Code Elo rank 3 provides
partial corroboration. Treat all GLM-5.1 scores as `[Self-reported]` until independent
replication is published.

---

### GLM-5-turbo

**Model ID**: `zai-coding-plan/glm-5-turbo` | **Maps from**: `haiku`

**Primary sources**:

- [Z.ai GLM-5-turbo Developer Docs](https://docs.z.ai/guides/llm/glm-5-turbo) (official)
- [OpenRouter GLM-5-turbo](https://openrouter.ai/z-ai/glm-5-turbo) (pricing, 2026-03-16)

| Benchmark                           | Score                         | Confidence        | Source / Date                                             |
| ----------------------------------- | ----------------------------- | ----------------- | --------------------------------------------------------- |
| ZClawBench                          | 56.4                          | `[Self-reported]` | Proprietary Z.ai benchmark; no independent validation     |
| SWE-bench / GPQA / MMLU / HumanEval | N/A                           | —                 | **No standard benchmark scores published for this model** |
| Context window                      | 202k tokens                   | —                 | OpenRouter (2026-03-16)                                   |
| Pricing                             | $1.20 / $4.00 per MTok in/out | —                 | OpenRouter (2026-03-16)                                   |

**Critical flag — no standard benchmarks**: GLM-5-turbo has **no published scores on any
standard academic benchmark** (no SWE-bench, no GPQA Diamond, no MMLU, no HumanEval) as of
April 2026. Its use as the OpenCode haiku-equivalent tier is a **platform constraint** (it
is the only fast-tier alternative to GLM-5.1 in the Z.ai Coding Plan), not a
benchmark-validated choice. ZClawBench is a proprietary Z.ai benchmark with undisclosed
methodology — it cannot be independently verified.

---

## Model Selection Mapping

Cross-reference with [AI Agent Model Selection Convention](../../governance/development/agents/model-selection.md)
tier assignments.

| Claude Alias | Claude Model (2026)         | Pricing (in/out MTok) | SWE-bench Verified        | OpenCode ID                   |
| ------------ | --------------------------- | --------------------- | ------------------------- | ----------------------------- |
| `""` (omit)  | Inherits session model      | Inherits              | Inherits (87.6% or 79.6%) | `zai-coding-plan/glm-5.1`     |
| `sonnet`     | `claude-sonnet-4-6`         | $3 / $15              | 79.6% `[Verified]`        | `zai-coding-plan/glm-5.1`     |
| `haiku`      | `claude-haiku-4-5-20251001` | $1 / $5               | 73.3% `[Verified]`        | `zai-coding-plan/glm-5-turbo` |

**Tier assignment rule (abbreviated)**: Use `omit` (opus-inherit) only for agents requiring
genuinely open creative reasoning where SWE-bench Verified 87.6% matters. Use `sonnet` for
structured/rubric-bound work (79.6% is sufficient). Use `haiku` for deterministic mechanical
tasks (73.3% is sufficient, cost is 5× lower than sonnet, 25× lower than opus). See
[AI Agent Model Selection Convention](../../governance/development/agents/model-selection.md) for the full decision tree.

---

## Model Capability Summary (Coding-Agents Lens)

| Model             | SWE-bench Verified           | Cost tier | Tier use in this repo                                        |
| ----------------- | ---------------------------- | --------- | ------------------------------------------------------------ |
| Claude Opus 4.7   | 87.6% `[Verified]`           | Highest   | Budget-adaptive inherit — Max/Team Premium sessions          |
| Claude Sonnet 4.6 | 79.6% `[Verified]`           | Mid       | Budget-adaptive inherit — Pro/Standard; explicit sonnet-tier |
| Claude Haiku 4.5  | 73.3% `[Verified]`           | Lowest    | Explicit haiku-tier — deterministic/mechanical agents        |
| GLM-5.1           | 77.8% `[Self-reported]`      | Mid       | OpenCode equivalent for opus-tier and sonnet-tier agents     |
| GLM-5-turbo       | N/A (no standard benchmarks) | Lower     | OpenCode equivalent for haiku-tier agents (platform-only)    |

---

## Limitations and Caveats

1. **Claude Opus 4.7 system card PDF** was inaccessible at research time (2026-04-19).
   Scores corroborated via third-party outlets. Verify against official system card when accessible.

2. **Claude Haiku 4.5 GPQA / AIME** scores (`[Needs Verification]`) circulate in aggregators
   but were not traced to the primary system card. Treat as approximate.

3. **GLM-5.1 scores are self-reported** by Z.ai. As of 2026-04-17, no independent third-party
   replication of SWE-bench Pro 58.4 has been published. Arena.ai Code Elo rank 3 provides
   partial corroboration only.

4. **GLM-5-turbo has zero standard benchmark coverage**. This is a platform constraint —
   no data exists to benchmark it against Claude models. Use only for agents that require no
   genuine reasoning (deterministic URL replacement, git branch operations, file moves).

5. **Prices and context windows** are as of the access date shown. Check official API docs
   for current values before making cost comparisons.

6. **Accuracy as of**: 2026-04-19. Model versions, scores, and pricing change. Re-verify
   when making tier assignment decisions more than 6 months from this date.

---

## Historical / Comparative References

These models are not current tier choices but are referenced in
[AI Agent Model Selection Convention](../../governance/development/agents/model-selection.md) for comparison or as
platform fallbacks.

| Model             | SWE-bench Verified | Context            | Notes                                                                   |
| ----------------- | ------------------ | ------------------ | ----------------------------------------------------------------------- |
| Claude Sonnet 4.5 | ~72% `[Verified]`  | Bedrock/Vertex API | Platform fallback — Bedrock/Vertex sessions that don't support 4.6      |
| Claude Opus 4.6   | 57.3% `[Verified]` | GLM comparison     | Used as comparison baseline for GLM-5.1 (SWE-bench Pro 58.4 ≈ Opus 4.6) |

**Note**: Neither model is used as a direct tier target in `.claude/agents/`. Sonnet 4.5 appears
only in the Budget-Adaptive Inheritance table as the Bedrock/Vertex session fallback. Opus 4.6 is
cited solely as a benchmark comparison point for GLM-5.1.

---

## Sources

1. Anthropic Models Overview — <https://platform.claude.com/docs/en/about-claude/models/overview> (accessed 2026-04-19)
2. Introducing Claude Opus 4.7 — <https://www.anthropic.com/news/claude-opus-4-7> (2026-04-16)
3. Claude Opus 4.7 System Card — <https://www.anthropic.com/claude-opus-4-7-system-card>
4. Introducing Claude Sonnet 4.6 — <https://www.anthropic.com/news/claude-sonnet-4-6> (2026-02-17)
5. Claude Sonnet 4.6 System Card — <https://www.anthropic.com/claude-sonnet-4-6-system-card>
6. Introducing Claude Haiku 4.5 — <https://www.anthropic.com/news/claude-haiku-4-5> (2025-10-15)
7. Z.ai GLM-5.1 benchmarks — <https://officechai.com/ai/z-ai-glm-5-1-benchmarks-swe-bench-pro/> (OfficeChai, 2026-04-07)
8. Awesome Agents GLM-5.1 review — <https://awesomeagents.ai/reviews/review-glm-5-1/> (2026-04-17)
9. WaveSpeedAI GLM-5.1 comparison — <https://wavespeed.ai/blog/posts/glm-5-1-vs-claude-gpt-gemini-deepseek-llm-comparison/> (2026-03-30)
10. Z.ai GLM-5-turbo Developer Docs — <https://docs.z.ai/guides/llm/glm-5-turbo>
11. OpenRouter GLM-5-turbo pricing — <https://openrouter.ai/z-ai/glm-5-turbo> (accessed 2026-03-16)
