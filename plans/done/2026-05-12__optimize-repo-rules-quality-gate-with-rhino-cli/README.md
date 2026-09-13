# Optimize repo-rules-quality-gate with rhino-cli

**Status**: In Progress
**Scope**: `ose-public` — `apps/rhino-cli/`, `.claude/agents/repo-rules-checker.md`, `repo-governance/workflows/repo/repo-rules-quality-gate.md`, supporting governance docs
**Worktree**: `worktrees/optimize-repo-rules-quality-gate-with-rhino-cli/`

## Problem

The [`repo-rules-quality-gate`](../../../repo-governance/workflows/repo/repo-rules-quality-gate.md) workflow invokes the [`repo-rules-checker`](../../../.claude/agents/repo/repo-rules-checker.md) agent (Sonnet) to validate the entire repository across 8 validation steps spanning ~73 agents, ~30+ skills, ~265 software docs, ~70+ governance files, and `AGENTS.md`. Most of the checker's work today is **deterministic** (file naming regex, character count, heading scan, required-section presence, broken link resolution, frontmatter field validation, LICENSE existence, README index accuracy, emoji presence in forbidden files, verbatim duplication via content hash) — yet a Sonnet-class LLM re-discovers and re-reasons these every iteration, and the workflow runs up to 7 iterations.

Net effect:

- Slow iteration loops (each checker run is several minutes of Sonnet reasoning).
- High token cost (one full repo sweep per iteration).
- Non-deterministic output (LLM may flag/unflag the same finding across iterations).
- Findings already mechanically discoverable are conflated with AI-judgment findings (semantic contradictions, paraphrased duplication).

## Goal

Push the deterministic portion of `repo-rules-quality-gate` into [`rhino-cli`](../../../apps/rhino-cli/) so the workflow runs a fast Go preflight FIRST, harvests a consolidated JSON report, and feeds it to the LLM checker — which then only does the AI-only work (semantic contradiction detection, paraphrased/conceptual duplication, terminology alignment, principle-appropriateness judgments).

Outcomes:

- **Speed**: Deterministic checks complete in <2 seconds (Nx-cached); LLM checker invocation reduced to AI-only categories.
- **Determinism**: Same input → same findings across iterations (Go binary, not LLM).
- **Cost**: Fewer Sonnet tokens per workflow run (target ~50% reduction in checker context).
- **Convergence**: Workflow stabilizes in fewer iterations because deterministic findings either pass or fail unambiguously.

## What changes

1. **New rhino-cli commands** (Phase 1–2): 11 new commands under `repo-governance`, `docs`, and `agents` subtrees, each emitting text/JSON/markdown.
2. **Orchestrator command** (Phase 3): `rhino-cli repo-governance audit` runs all deterministic checks in one invocation and emits a single consolidated JSON envelope (`schema → status → results[]`).
3. **Workflow modification** (Phase 4): Insert Step 0.5 "Deterministic Preflight" in `repo-rules-quality-gate.md`. The preflight result is passed as input to the AI checker.
4. **Checker agent modification** (Phase 5): `repo-rules-checker.md` learns to consume the preflight JSON, skip deterministic categories, and only run AI-only categories. Re-validation iterations re-run preflight first (fast) and skip AI re-check if preflight matches the previous run's hash.
5. **Nx targets + caching** (Phase 6): Each new command gets a cached `validate:*` Nx target.
6. **Convention docs + workflow docs** (Phase 7): Update `repo-governance/workflows/repo/repo-rules-quality-gate.md`, `.claude/agents/repo-rules-checker.md`, and add a short reference page documenting the deterministic-vs-AI split.

## Non-goals

- No change to the workflow's iteration semantics, termination criteria, or mode strictness (lax/normal/strict/ocd).
- No removal of the AI checker's judgment categories (contradictions, terminology, conceptual duplication remain LLM-driven).
- No change to `repo-rules-fixer` or `repo-rules-maker` behavior.
- No change to the `.opencode/` sync pipeline.

## Documents

- [brd.md](./brd.md) — business rationale
- [prd.md](./prd.md) — product requirements + Gherkin acceptance criteria
- [tech-docs.md](./tech-docs.md) — architecture, command surfaces, JSON schema, workflow flow
- [delivery.md](./delivery.md) — TDD-shaped step-by-step delivery checklist

## Worktree

This plan executes inside the worktree at `worktrees/optimize-repo-rules-quality-gate-with-rhino-cli/` on branch `worktree-optimize-repo-rules-quality-gate-with-rhino-cli`, provisioned via:

```bash
cd ~/ose-projects/ose-public
claude --worktree optimize-repo-rules-quality-gate-with-rhino-cli
```

Per the [Worktree Path Convention](../../../repo-governance/conventions/structure/worktree-path.md) and the [Plans Organization Convention §Worktree Specification](../../../repo-governance/conventions/structure/plans/worktree-specification.md#worktree-specification), the worktree lands at `worktrees/optimize-repo-rules-quality-gate-with-rhino-cli/` (the `ose-public` override of the upstream default). Publishing path: direct-to-main (default for `ose-public` under Trunk Based Development).

> Home prefix normalised: absolute home-directory paths in this plan's files were rewritten to a portable form (such as `~/`, `$HOME/`, or a `<placeholder>`), so captured output here is not byte-verbatim.
