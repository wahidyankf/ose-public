---
description: "What plan-execution-checker validates here."
when_to_use: "Use to know what the validation gate checks."
---

# What Gets Validated

Enforcement is by **agent checkers reading prose**, not a `Rhino` structural validator —
triaging generalizability is a judgment call a deterministic tool cannot make. The relevant agents
are:

- **`plan-checker`**: flags a substantive plan whose `delivery.md` has no Knowledge Capture phase and
  no explicit "none" record, at **MEDIUM** criticality. An explicit "none" record passes without a
  finding.
- **`plan-execution-checker`**: blocks archival until every `learnings.md` entry is routed-inline
  (non-code only), filed as an explicitly authorized `plans/ideas/` two-pager after the mandatory
  overlap scan, reported without plan authorization, or discarded-with-reason; verifies both
  safety gates were applied; verifies no code born from a learning landed inline; and rejects any
  Knowledge Capture write under `plans/backlog/`. Only the idea-promotion workflow owns the
  transition from a ripe idea to a formal backlog plan.
- **`plan-quality-gate`**: scaffolds a missing Knowledge Capture phase and `learnings.md` file into a plan during its repair pass
  that lacks them.
- **`plan-maker`** and the plan-creating skill: emit the Knowledge Capture phase and the
  `learnings.md` scaffold into every new substantive plan by default.
