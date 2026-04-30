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

1. **Higher benchmark ceiling**: move to a provider whose top model clears 80%
   SWE-Bench, making agentic code generation measurably more capable.
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

## Business Impact

**Pain points addressed**:

- Agentic sessions that chain 10+ tool calls currently bottleneck on Z.ai latency.
  A faster, geo-distributed provider reduces wall-clock time for plan execution.
- GLM-5.1's 58.4% SWE-Bench ceiling means some agentic code tasks require human
  correction. A model at 80.2% (MiniMax M2.7) materially reduces that correction
  rate.
- The Z.ai MCP coupling means any future provider migration has to also solve
  web-search MCP simultaneously. Decoupling now makes future migrations simpler.

**Expected benefits**:

- Stronger out-of-box code generation in OpenCode sessions, particularly for
  multi-file refactors and unfamiliar language idioms.
- Perplexity MCP (already wired in `opencode.json`) provides web search
  independently of the model provider — no capability regression on search tasks.
- Future model upgrades (e.g., switching to `deepseek-v4-pro` or `kimi-k2.6`)
  require only a one-line change to `opencode.json`, not an MCP migration.

## Affected Roles

| Role | Impact |
| ---- | ------ |
| Developer (OpenCode sessions) | Model quality improves; web-search MCP moves to Perplexity |
| Developer (Claude Code sessions) | No change — Claude Code uses its own model routing |
| CI / rhino-cli maintainer | Go code + tests updated; sync regeneration run once |
| Repository governance | `model-selection.md` table updated to reflect new equivalents |

## Non-Goals

- **Removing Claude Code as the primary tool**: Claude Code remains the primary
  development harness. OpenCode is the secondary, alternative interface.
- **Evaluating all 14 OpenCode Go models**: the plan picks the best-benchmark
  model as the large-model default. Per-session model overrides remain available.
- **Migrating Z.ai billing or credentials**: closing a Z.ai subscription is a
  personal billing decision, outside the repository change scope.
- **Adding OpenCode Go to CI**: CI runs `rhino-cli` unit and integration tests;
  it does not execute OpenCode sessions. No CI changes.
