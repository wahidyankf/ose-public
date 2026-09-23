---
description: Caps worktree modes at one reused worktree per repository, distinguishes main modes, and states cleanup timing.
when_to_use: Use when a plan produces more than one delivery unit in the same repository and needs to know whether a second worktree is allowed.
---

# Worktree Cap — One Worktree Per Repository Per Plan (HARD RULE)

A worktree mode provisions **at most one worktree per repository**, regardless of how many
independent DAG leaves or delivery units the plan produces there, and reuses it across those units.
Provisioning a second `git worktree add` for the same repo within one plan is a defect. A plan
touching **N** repositories therefore provisions **at most N worktrees total**, one per repo. A main
mode works in the primary checkout and provisions no worktree.

This caps a genuinely scarce shared resource: each worktree is a full checkout plus a converged
polyglot toolchain (guarded `npm install`, then read-only `npm run doctor`, provisioning only on
reported drift), and on the
same-machine assumption
(other agents, engineers, and CI runners sharing this disk concurrently — see the
[Agent Workflow Orchestration Convention](../../../development/agents/agent-workflow-orchestration/operating-budgets-parallelism-budget.md))
that setup cost is worth paying once per repo, not once per delivery unit.

**What stays one-per-delivery-unit under `*-to-pr`**: the **branch** and the **PR**. A permitted
direct-push mode instead uses one direct integration checkpoint per unit. See
[Planning Granularity and Mode-Specific Delivery](../../../workflows/plan/plan-planning/planning-granularity-and-one-branch-rule.md).

**`worktree-to-pr` sequencing consequence**: delivery units sharing a repo execute their file edits
**serially** in the reused worktree — land unit A, refresh from `origin/main`, then create unit B's
branch in the same directory. Other modes apply the same land-and-refresh order from their resolved
work location and use their own integration mechanism. Repositories remain separate DAG nodes, but their
resource-heavy worktree provisioning, toolchain setup, builds, and validation pass through HIPPO
admission rather than acquiring a repository-serial edge by default. Independent
repositories may overlap when their reservations fit; dependency, shared-output, byte-identity,
transactional, and documented correctness edges still serialize. See
[Delivery Checklists Express a DAG](./delivery-checklists-express-a-dag.md).

**Cleanup timing**: a repo's provisioned worktree is removed only once **every** delivery unit that
used it has landed — never when the first one does. Main modes have no worktree to remove. See the
[Worktree and Artifact Cleanup Convention](../../../development/workflow/worktree-and-artifact-cleanup.md).

**Enforcement**: `plan-checker` flags a plan whose `## Parallelization Model` or `### Delivery
Boundaries` table names more than one worktree path for the same repository as **HIGH**.
`plan-execution-checker` flags an execution history showing more than one `git worktree add` for the
same repo within one plan as **HIGH**.

The cap holds as a live fact, not only a planning-text one. The acting agent runs `git worktree
list` for a repo immediately before provisioning a worktree there, and again immediately after each
delivery unit that used it lands, removing any worktree beyond the plan's single capped one before
proceeding — including one a subagent dispatch auto-provisioned, which counts toward this cap even
though it appears in no command the acting agent typed directly. See
[Harness Capability Gating](../../../development/agents/agent-workflow-orchestration/operating-budgets-harness-capability-gating.md).
