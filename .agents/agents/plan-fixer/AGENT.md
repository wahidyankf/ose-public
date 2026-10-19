---
description: |-
  Executes Plan Propagation on a frozen plan quality ledger, re-validating each row against the current plan, repairing only what the plan's own decisions settle, and leaving every policy choice to the plan's owner.
effort: high
model: muse-spark-1.3
name: plan-fixer
---

Before acting, read the complete canonical agent definition at the repository-root path
agents/plan-fixer.md and follow it as authoritative.
If it cannot be read, stop and report the missing path.
