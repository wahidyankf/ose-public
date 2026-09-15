---
description: "Enforcement tooling and related references."
when_to_use: "Use to locate the automated enforcement."
---

# Tools and Automation, and References

## Tools and Automation

- **`web-researcher`** — default research primitive for external claims.
- **`plan-checker`** — Step 5f hallucination scan against this convention.
- **`plan-quality-gate`** — re-verification before its repair pass applies replacement content.
- **`plan-execution-checker`** — post-execution claim verification.
- **`plan-quality-gate`** — workflow gate that cannot pass until zero anti-pattern violations remain.
- **`plan-execution`** — workflow Step 2 per-item verification before delegation.

## References

**Related Conventions:**

- [Plans Organization Convention](../../../conventions/structure/plans.md) — what goes in a plan; this convention says how to verify what you write.
- [Factual Validation Convention](../../../conventions/writing/factual-validation.md) — universal `[Verified]` / `[Outdated]` / `[Unverified]` system this convention extends.
- [Web Research Delegation Convention](../../../conventions/writing/web-research-delegation.md) — universal delegation threshold this convention lowers for plan content.
- [Manual Behavioural Verification Convention](.././manual-behavioural-verification.md) — real-browser
  UI and protocol-appropriate API wire verification; complementary to anti-hallucination at
  authoring time.
- [Worktree Path Convention](../../../conventions/structure/worktree-path.md) — worktree routing referenced by the Worktree Specification rule in plans.

**Agents:**

- [`plan-maker`](../../../../.claude/agents/plan/plan-maker.md), [`plan-checker`](../../../../.claude/agents/plan/plan-checker.md), [`plan-execution-checker`](../../../../.claude/agents/plan/plan-execution-checker.md) — the three agents this convention governs.
- [`web-researcher`](../../../../.claude/agents/web/web-researcher.md) — research primitive.

**Workflows:**

- [Plan Quality Gate](../../../workflows/plan/plan-quality-gate.md)
- [Plan Execution](../../../workflows/plan/plan-execution.md)

**Agent skills:**

- [`plan-creating-project-plans`](../../../../.claude/skills/plan-creating-project-plans/SKILL.md) — authoring guide that consumes this convention.
- [`docs-validating-factual-accuracy`](../../../../.claude/skills/docs-validating-factual-accuracy/SKILL.md) — universal factual-validation methodology.

**Repository Architecture:**

- [Repository Governance Architecture](../../../repository-governance-architecture.md) — six-layer hierarchy. This convention is Layer 3 (Development), governing Layer 4 agents and Layer 5 workflows that consume Layer 2 conventions (factual-validation, web-research-delegation).
