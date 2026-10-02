---
description: The hard gate where the user must confirm the plan identifier, scope, and approve proceeding to plan authoring.
when_to_use: Use when presenting the proposed bump table for user approval before any plan is authored.
---

# Phase 4: Human Checkpoint (Sequential, Hard Gate)

Present the proposed bump table, the clearance statuses, and — prominently — any `WAIVER`,
`FUNCTIONAL-HOLD`, or `(KEV-listed)` rows. KEV Fast-Track escalations and EPSS ≥ 0.5 flags
MUST appear at the top of the summary before other rows. Use `AskUserQuestion` to:

1. Confirm the plan identifier (default `dependency-bump`).
2. Confirm the scope is correct (any packages to exclude/hold).
3. Explicitly approve proceeding to plan authoring.

**Do NOT proceed to Phase 5** until the user approves. The user may trim scope or defer specific
bumps here.

**Output**: Approved bump set + confirmed identifier.
