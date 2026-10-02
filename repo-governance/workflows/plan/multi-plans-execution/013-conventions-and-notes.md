---
description: The repo conventions this workflow respects, plus closing notes on its thin, observable, and bounded design posture.
when_to_use: Use when checking which repo-governance conventions govern a specific rule, or for a quick recap after reading the phases.
---

# Conventions Implemented/Respected, and Notes

- **[Plans Organization Convention](../../../conventions/structure/plans.md)** — respects Delivery Modes,
  executor tagging, worktree specification, and archival for every plan.
- **[Grilling-With-Options Convention](../../../development/workflow/grilling-with-options.md)** —
  pre-execution grill on unresolved cross-plan ordering.
- **[Knowledge Capture Convention](../../../development/quality/knowledge-capture.md)** — the triage
  rubric and both safety gates applied per plan (D4) and again in the cross-plan consolidation (D5).
- **[Agent Workflow Orchestration](../../../development/agents/agent-workflow-orchestration.md)** and
  **[Subagent Orchestration Convention](../../../development/agents/subagent-orchestration.md)** —
  concurrency never self-promoted above the harness cap.
- **[Linking Convention](../../../conventions/formatting/linking.md)** and **[Content Quality
  Principles](../../../conventions/writing/quality.md)** — GitHub-compatible `.md` links, single H1,
  proper heading nesting.

## Notes

- **Fully inherits per-plan behaviour** — this document is intentionally thin; its only job is
  cross-plan scheduling. When in doubt about a per-plan step, defer to `plan-execution.md`.
- **Observable** — the union Task list plus the DAG and summary reports make the parallel schedule
  legible before, during, and after the run.
- **Bounded** — `parallelism` and the harness cap bound concurrency; `max-cycles` (per plan, at most three)
  bounds each plan's execute-check loop.
