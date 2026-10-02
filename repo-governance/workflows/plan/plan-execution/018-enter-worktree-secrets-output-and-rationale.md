---
description: Explains why secret- and state-dependent infra operations must run from the primary checkout, and states the gate's output and rationale.
when_to_use: Use when a delivery checklist item runs terraform apply, a live Ansible converge, or any other state-changing infra operation.
---

# Enter the Designated Worktree — Secrets, Output, and Rationale

**Continues** [Enter the Designated Worktree — Freshness Gate](./017-enter-worktree-freshness-gate.md).

**Secret/State-Dependent Infrastructure Operations Run from the Primary Checkout**

A worktree provisioned from `origin/main` contains no gitignored secrets or local infrastructure state. Credential files (`.env` and similar) and any local-backend infrastructure-state file (for example a Terraform state file) are gitignored and exist only in the primary checkout. Because of this, secret- or state-dependent infrastructure operations — `terraform apply`, a live Ansible converge (`ansible-playbook` against real hosts), or any equivalent state-changing infra operation — MUST run from the primary checkout as `[HUMAN]` / operator steps, never from the plan's worktree. Running `terraform apply` from a worktree that has no state causes Terraform to see an empty state and attempt to recreate the entire managed estate; copying state into a worktree creates split-brain, with two checkouts mutating real infrastructure against divergent state copies. Keeping these operations in the primary checkout keeps all secret-bearing, state-changing work in a single location.

Mark such steps `[HUMAN]` in the delivery checklist (per [Plans Organization Convention §Executor Tagging](../../../conventions/structure/plans/executor-tagging-tags-and-bias.md#executor-tagging--ai-vs-human-hard-rule)) and instruct the operator to run them from the primary checkout where the secrets and state reside.

**Output**: Execution running inside the designated worktree, up to date with the latest `origin/main` (provisioned if needed).

**Why this is a hard gate**: A missing `## Worktree` section always fails; an invocation branch
cannot replace the declaration or bypass the mandatory `worktree-to-pr` location. A CWD mismatch is
recoverable because the executor can navigate to or first-provision the declared path. Running
implementation outside it would pollute the primary checkout, break parallel safety, and risk
dirty-gitlink hazards. Operator-only secret/state steps may run from the primary checkout as stated
above, but they do not move repository-visible plan work there. Freshness sync is equally mandatory:
implementing against a stale base validates against code that no longer matches `origin/main`.
