---
description: States that a plan with pending infrastructure-apply steps must stay in in-progress/, and the README.md index requirements for each plans/ subfolder.
when_to_use: Use when deciding whether a plan with a terraform apply or similar step is ready to archive, or when updating a subfolder's README.md index.
---

# Infra-Apply Gate and Plan Index Files

## Infra-Apply Gate (HARD RULE)

A plan that contains infrastructure-apply steps — `terraform apply`, a live Ansible converge against
real hosts, or any equivalent state-changing infra operation — MUST remain in `plans/in-progress/`
until those steps are genuinely executed and verified from the primary checkout. Zero validation
findings is not sufficient for completion when an infra-apply step is still pending or merely
deferred; the plan status stays `partial`. See the
[Step 0 policy note](../../../workflows/plan/plan-execution/014-enter-worktree-preconditions-and-work-branch.md#0-enter-the-designated-worktree-sequential-hard-gate)
(secrets and infrastructure state live only in the primary checkout, never the worktree) and the
[Step 8 Infra-Execution Gate](../../../workflows/plan/plan-execution/036-finalization-pre-archival-gates.md#8-finalization-and-archival-sequential)
for the complete policy.

## Plan Index Files

Each subfolder (`backlog/`, `in-progress/`, `done/`) has a `README.md` that:

- Lists all plans in that category
- Provides brief description of each plan
- Links to each plan folder
- Updated whenever plans are added, moved, or removed
