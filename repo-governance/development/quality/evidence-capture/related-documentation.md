---
description: "Cross-references to related verification and plan conventions."
when_to_use: "Use when you need a related convention on verification or plan structure."
---

# Related Documentation

- [Plan Execution Workflow](../../../workflows/plan/plan-execution.md) — Step 2d mandates evidence capture
  during manual behavioural assertions.
- [plan-execution-checker](../../../../.agents/agents/plan-execution-checker.md) — validates evidence
  presence as part of Step 7.
- [plan-maker](../../../../.agents/agents/plan-maker.md) — emits evidence-capture steps in delivery
  checklists for web-UI plans.
- [web-exploratory-tester](../../../../.agents/agents/web-exploratory-tester.md) — saves screenshots to
  the output destination's `evidence/` folder during exploratory testing: the new backlog plan
  (`plan` mode, explicit), the existing plan's folder (`delivery` mode), or `local-tmp/` (default
  mode).
- [web-usability-tester](../../../../.agents/agents/web-usability-tester.md) — saves screenshots to the
  output destination's `evidence/` folder during usability evaluation (same three-mode selection as
  `web-exploratory-tester`).
- [web-design-tester](../../../../.agents/agents/web-design-tester.md) — saves screenshots to the
  output destination's `evidence/` folder during design-fidelity evaluation (same three-mode selection
  as `web-exploratory-tester`).
