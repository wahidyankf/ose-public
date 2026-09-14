---
description: Covers propagation shape, the parity-manifest gate, per-repo delivery shape, and shared-machine safety.
when_to_use: Use when deciding whether to run repos concurrently, or the parity-manifest gate fires.
---

# Step 4 — Execution Phase (Continued)

**Continues from** [Step 4 — Execution Phase](./step-4-execution-phase.md).

**Propagation shape**: repository labels do not create a content-dependency chain. Model the
composite as plan nodes: portable public-source or Rhino nodes precede the private nodes that consume
their output, while repo-specific nodes without that edge may be ready concurrently. Resource-heavy
worktree provisioning, toolchain setup, builds, and validation enter HIPPO under the declared
workload class. Logically independent compute may overlap within shared N=3 agent slots when its
complete reservations are admitted; capacity changes execution timing, not dependency order.

These constraints add explicit edges between the affected nodes; they do not serialize unrelated
work elsewhere in either repository:

- **`apps/rhino-cli` byte-identity** across the parity repos — `ose-public` and
  `ose-private` — a plan touching it propagates one repo at a time, never concurrently
  ([AGENTS.md §Related Repositories](../../../../AGENTS.md#related-repositories)).
- **Any node writing what another node reads** — the general DAG independence test. This includes
  dependencies, shared outputs, transactional/destructive mutations, service/port ownership, and
  any documented runtime correctness race. Sequence is not dependency, but a shared write target is.

**Expect the local `parity-manifest` pre-push gate to fire on the very first push, before any
cross-repo work.** Editing a byte-identity-governed file (`apps/rhino-cli/src/`, `Cargo.toml`,
`Cargo.lock`, `project.json`, `LICENSE`, the shared Gherkin tree) invalidates **this repo's own**
recorded checksum the moment the file changes. The gate is a same-repo self-consistency check, not a
cross-repo diff — it is not a signal that propagation is overdue, and it fires identically whether
the other repo is already in sync or untouched. Clear it with
`rhino-cli parity manifest generate`, committed as its own follow-up commit, then push. The
generator refuses to run against unstaged boundary files, so the order is fixed: `git add` the
boundary files you edited, generate, then stage the regenerated manifest.

Regenerating the local manifest **does not discharge the propagation obligation** — the gate's own
error text says so. It unblocks this repo's push and nothing more; the identical change still has to
reach the other parity repo.

**Byte-identity is a per-file fact.** A path outside the manifest may
still be byte-identical across both repos — some `apps/rhino-cli/tests/` files are, others beside
them are not. Diff each file before choosing between carrying it verbatim and re-authoring it;
re-authoring an identical file starts a divergence no gate catches.

**Per-repo delivery shape**: each repo's phases group into natural cohesive **delivery units**.
Under `*-to-pr`, one branch → one PR → one unit, opened and merged at its boundary. Under a
permitted direct mode, one unit reaches one direct integration checkpoint. Never integrate at every
phase or batch ready units at composite end. Each unit leaves `main` immediately safe to deploy;
incomplete behaviour is complete-and-inert behind a temporary production-disabled **feature flag**,
with both paths tested and rollout, rollback, and removal recorded. Worktree modes reuse at most one
worktree per repo; main modes use the primary checkout and provision none — see
[Plans Organization Convention §Worktree Cap](../../../conventions/structure/plans/worktree-cap.md#worktree-cap--one-worktree-per-repository-per-plan-hard-rule).
See [plan-planning §Planning Granularity](../plan-planning/planning-granularity-and-one-branch-rule.md#planning-granularity-and-mode-specific-delivery-mapping).

**Shared-machine safety**: the parity repos share one machine's disk and git object store, and any of
them may be a bare repo driven through worktrees — verify each repo's topology, never assume it. The
**no-destructive-git** rule binds every git action
here — never discard a concurrent actor's uncommitted work, never remove a worktree or branch you
did not create. See
[No Destructive Git Operations](../../../development/workflow/no-destructive-git-operations.md).

**Output per repo**: plan-execution `final-status`, `iterations-completed`, final validation
report.

**On failure**: apply the Step 3 failure policy and the safe-boundary rules in the first Step 4
shard. Under the default stop policy, freeze new admissions, settle or safely cancel in-flight work,
then terminate the composite with status `partial` (completed repos stay archived; the failing
repo's plan stays in `plans/in-progress/` with its worktree retained).
