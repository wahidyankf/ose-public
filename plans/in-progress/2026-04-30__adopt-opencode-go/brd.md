# Business Requirements Document

## Problem Statement

The OpenCode configuration in `ose-public` routes all model calls through Z.ai
(`zai-coding-plan/glm-5.1` and `glm-5-turbo`). This coupling means:

1. **Single-lab lock-in**: all model quality is gated on Zhipu AI's GLM family
   only. GLM-5.1 benchmarks at 58.4% SWE-Bench Pro — reasonable, but not the
   strongest available in the open-source Chinese AI space.
2. **Z.ai slowdown**: independent community reports document degrading Z.ai
   throughput in early 2026. Slower responses increase friction for agentic
   workflows that chain multiple tool calls.
3. **No upgrade path inside Z.ai**: GLM-5.1 is currently the best Z.ai model.
   There is no stronger Z.ai option to move to; any capability improvement
   requires switching providers.
4. **MCP bundling as a dependency**: the current setup relies on Z.ai-specific
   MCP servers (`zai-mcp-server`, `web-search-prime`, `web-reader`, `zread`)
   for web search and reading. These are proprietary to Z.ai's API and not
   portable to other providers. This creates an invisible coupling between model
   routing and search tooling.

## Business Goals

1. **Higher benchmark ceiling**: move to a provider from a lab whose prior model
   (M2.5) cleared 80% SWE-Bench Verified — the open-source coding leaderboard
   leader. M2.7 is the latest successor; exact score varies by benchmark suite.
2. **Multi-lab model access**: gain access to models from Moonshot, DeepSeek,
   MiniMax, Alibaba, and Xiaomi — not just Zhipu — without changing the per-
   session workflow.
3. **Decouple web-search MCP from model provider**: rely on provider-neutral
   MCP servers (Perplexity, Playwright) that work regardless of which model
   provider is active. This eliminates the hidden coupling.
4. **Flat-rate predictability**: OpenCode Go charges a fixed monthly rate ($10)
   with no per-token overages, matching or bettering the Z.ai cost model.
5. **Global access for stable throughput**: OpenCode Go serves from US, EU, and
   Singapore PoPs, designed for international users — directly addressing the
   reported Z.ai slowdown.

## Model Benchmark Basis

The model selection is grounded in SWE-Bench scores — the standard benchmark for
agentic code generation on real GitHub issues.

> **Methodology note**: SWE-Bench, SWE-Bench Pro, and SWE-Bench Verified are
> different evaluation suites with different difficulty distributions. Scores
> across suites are directionally comparable but not directly equivalent.

| Model                      | Role                      | Score   | Suite              | Source                                                                                   |
| -------------------------- | ------------------------- | ------- | ------------------ | ---------------------------------------------------------------------------------------- |
| `opencode-go/minimax-m2.7` | New large (opus + sonnet) | 56.22%¹ | SWE-Pro            | minimax.io/news/minimax-m27-en, accessed 2026-04-30                                      |
| `zai-coding-plan/glm-5.1`  | Current large             | 58.4%²  | SWE-Bench Pro      | _Judgment call_: widely cited in community benchmarks; no single canonical URL available |
| Claude Sonnet 4.6          | Claude Code reference     | 79.6%³  | SWE-Bench Verified | https://www.anthropic.com/news/claude-sonnet-4-6, accessed 2026-04-30                    |
| Claude Opus 4.7            | Claude Code reference     | 87.6%³  | SWE-Bench Verified | https://www.anthropic.com/news/claude-opus-4, accessed 2026-04-30                        |

¹ "MiniMax M2.7 achieved a 56.22% accuracy rate on SWE-Pro" —
MiniMax M2.7 launch announcement: https://www.minimax.io/news/minimax-m27-en, accessed 2026-04-30.
Predecessor M2.5 scored 80.2% on SWE-Bench Verified (different suite):
https://www.minimax.io/news/minimax-m25, accessed 2026-04-30.

² GLM-5.1 SWE-Bench Pro score is widely referenced in community benchmarks but has
no single canonical citation available at time of writing. _Judgment call_: the
58.4% figure is used as the directional baseline for comparison.

³ Claude model scores from Anthropic's published release notes: https://www.anthropic.com/news/claude-sonnet-4-6 (Sonnet 4.6), https://www.anthropic.com/news/claude-opus-4 (Opus 4.7), https://www.anthropic.com/news/claude-haiku-4-5 (Haiku 4.5) — all accessed 2026-04-30.

**Key takeaway**: M2.7's published SWE-Pro score (56.22%) is on a different and
harder suite than M2.5's SWE-Bench Verified score (80.2%). Direct like-for-like
comparison between M2.7 (SWE-Pro) and GLM-5.1 (SWE-Bench Pro) is inconclusive
across different suites. _Judgment call_: M2.7 is the latest MiniMax model and its
predecessor M2.5 led the open-source SWE-Bench Verified leaderboard at 80.2%.
M2.7 is adopted as the large-model default based on recency and lab trajectory,
not on a like-for-like score comparison.

## Business Impact

**Pain points addressed**:

- Agentic sessions that chain 10+ tool calls currently bottleneck on Z.ai latency.
  A faster, geo-distributed provider reduces wall-clock time for plan execution.
- GLM-5.1's 58.4% (_Judgment call_ — no canonical citation) SWE-Bench Pro ceiling means
  some agentic code tasks require human correction. MiniMax M2.7 is the latest model from
  a lab whose prior release (M2.5)
  scored 80.2% on SWE-Bench Verified — the open-source leaderboard leader. The exact
  M2.7 vs GLM-5.1 gain is inconclusive across different benchmark suites; adoption
  is grounded in lab trajectory and model recency.
- The Z.ai MCP coupling means any future provider migration has to also solve
  web-search MCP simultaneously. Decoupling now makes future migrations simpler.

**Expected benefits**:

- Stronger out-of-box code generation in OpenCode sessions, particularly for
  multi-file refactors and unfamiliar language idioms.
- Perplexity MCP (already wired in `opencode.json`) provides web search
  independently of the model provider — no capability regression on search tasks.
- Future model upgrades (e.g., switching to `deepseek-v4-pro` or `kimi-k2.6`)
  require only a one-line change to `opencode.json`, not an MCP migration.

## Success Metrics

The following observable facts determine that the plan is complete at the business level:

1. `ConvertModel("sonnet")` and `ConvertModel("")` return `opencode-go/minimax-m2.7` — verified by unit tests passing
2. `ConvertModel("haiku")` returns `opencode-go/glm-5` — verified by unit tests passing
3. `.opencode/opencode.json` contains `opencode-go/*` model IDs and no Z.ai MCP entries — verified by `validate:config` exit 0
4. `OPENCODE_ENABLE_EXA=true` is documented for all developers in `model-selection.md`
5. `npm run validate:config` passes (sync + validation green) — verified by CI
6. `nx run rhino-cli:test:unit` passes with ≥90% line coverage — verified by CI
7. `nx run rhino-cli:test:integration` passes — verified by CI
8. `model-selection.md` table shows OpenCode Go equivalents — verified by doc review

_Judgment call_: no pre-migration baseline measurement exists for OpenCode session
quality. Success is structural (correct model IDs, tests green, docs updated) rather
than empirical (measured improvement in task completion rate).

## Affected Roles

| Role                             | Impact                                                        |
| -------------------------------- | ------------------------------------------------------------- |
| Developer (OpenCode sessions)    | Model quality improves; web-search MCP moves to Perplexity    |
| Developer (Claude Code sessions) | No change — Claude Code uses its own model routing            |
| CI / rhino-cli maintainer        | Go code + tests updated; sync regeneration run once           |
| Repository governance            | `model-selection.md` table updated to reflect new equivalents |

## Non-Goals

- **Removing Claude Code as the primary tool**: Claude Code remains the primary
  development harness. OpenCode is the secondary, alternative interface.
- **Evaluating all available OpenCode Go models**: the plan picks the best-benchmark
  model as the large-model default. Per-session model overrides remain available.
- **Migrating Z.ai billing or credentials**: closing a Z.ai subscription is a
  personal billing decision, outside the repository change scope.
- **Adding OpenCode Go to CI**: CI runs `rhino-cli` unit and integration tests;
  it does not execute OpenCode sessions. No CI changes.

## Business Risks

| Risk                                                                                        | Likelihood | Business Impact                                                              | Mitigation                                                                                                 |
| ------------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| OpenCode Go beta instability causes session disruptions                                     | Medium     | Developer productivity loss during active agentic work                       | Claude Code remains primary; OpenCode is secondary interface. Rollback: revert 3 commits + regenerate sync |
| MiniMax M2.7 underperforms expectations (56.22% SWE-Pro may not reflect real-world quality) | Medium     | Marginal quality improvement over Z.ai, not meeting BG-1                     | Per-session model override available; swap to `kimi-k2.6` or `deepseek-v4-pro` via one-line change         |
| Exa web search incompatible with OpenCode Go models                                         | Low        | No native web search in OpenCode sessions; Perplexity MCP fallback activates | Perplexity MCP pre-configured; Brave Search MCP documented as alternative                                  |
