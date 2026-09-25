---
description: "Related plan, post-mortem, and safety conventions."
when_to_use: "Use for a related plan or safety-gate convention."
---

# Related Documentation

- [Plans Organization Convention](../../../conventions/structure/plans.md) — plan folder structure and
  lifecycle; documents `learnings.md` and the Knowledge Capture phase as part of plan structure.
- [Post-Mortem Convention](../../../conventions/structure/post-mortems.md) — authoritative structure
  for post-mortems; failure/incident learnings route here via this convention's matrix.
- [Feature Change Completeness Convention](.././feature-change-completeness.md) — the specs/Gherkin
  two-path rule that binds every code-routed learning's follow-up plan.
- [Regression Test Mandate](.././regression-test-mandate.md) — the bug-fix testing obligation that
  binds every code-routed learning that names a bug.
- [Criticality Levels Convention](.././criticality-levels.md) — the CRITICAL/HIGH/MEDIUM/LOW scale used
  by `plan-checker`'s silent-absence finding.
- [No Secrets in Git Convention](../../../conventions/security/no-secrets-in-committed-files.md) — the hard iron rule
  the secret/sensitivity gate inherits.
- [Plan Execution Workflow](../../../workflows/plan/plan-execution.md) — Step 2 running-log capture and
  the Step 8 Knowledge Capture phase before archival.
- [plan-maker](../../../../.agents/agents/plan-maker.md) — emits the Knowledge Capture phase and
  `learnings.md` scaffold into new plans.
- [plan-checker](../../../../.agents/agents/plan-checker.md) — flags silent absence of the phase.
- [plan-execution-checker](../../../../.agents/agents/plan-execution-checker.md) — blocks archival
  until routing and both safety gates are complete.
