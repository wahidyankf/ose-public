---
description: "Which agents and content this convention covers."
when_to_use: "Use to check whether this applies to an agent."
---

# Scope

## What This Convention Covers

- All content authored into `plans/` by `plan-maker` (or a human invoking the planning skill).
- All validation performed by `plan-checker` and `plan-execution-checker`.
- All remediation performed by the `plan-quality-gate` repair pass.
- Every step of the `plan-quality-gate` and `plan-execution` workflows.
- The pre-execution gate that refuses to start when claims are unverifiable.
- **Absence and completeness claims made by any validating agent** — the
  [Absence and Completeness Claims](./absence-and-completeness-claims-zero-result-search-evidence-checklist.md) rules bind every checker
  or fixer that reports "zero occurrences found" or "this list is complete", not only the four plan
  agents.

## What This Convention Does NOT Cover

- **General factual-validation methodology** — see [Factual Validation Convention](../../../conventions/writing/factual-validation.md) for the universal `[Verified]` / `[Outdated]` / `[Unverified]` confidence system. This convention extends those labels with plan-specific repo-grounding labels and stricter delegation thresholds.
- **Web-research delegation threshold** — see [Web Research Delegation Convention](../../../conventions/writing/web-research-delegation.md) for the universal 2-search / 3-fetch threshold. This convention LOWERS that threshold for plan content (any non-grep'd external claim → delegate).
- **Plan structure and content placement** — see [Plans Organization Convention](../../../conventions/structure/plans.md). That convention says WHAT goes in a plan; this convention says HOW to verify what you write.
- **Manual behavioural verification** — real-browser UI and protocol-appropriate API wire verification
  are governed by [Manual Behavioural Verification Convention](.././manual-behavioural-verification.md).
  Anti-hallucination is authoring-and-validation; manual behavioural verification is post-execution.
