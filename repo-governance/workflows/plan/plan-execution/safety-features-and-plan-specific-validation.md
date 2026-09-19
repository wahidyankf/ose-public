---
description: Describes the infinite-loop prevention, progressive-update, error-recovery, and plan-preservation safety features, plus what plan-execution-checker validates.
when_to_use: Use when explaining what safety guarantees plan execution provides, or what the checker validates.
---

# Safety Features

**Infinite Loop Prevention**:

- Max-iterations parameter (default: 10)
- Workflow terminates with `partial` if limit reached
- Tracks iteration count for monitoring

**Progressive Updates**:

- Delivery checklist items ticked individually throughout execution
- Task status updated in real time via TaskCreate/TaskUpdate
- Each iteration builds on previous work
- Validation history preserved in local-tmp/plan-execution/

**Error Recovery**:

- Continues to verification even if some execution steps encounter issues
- Reports which requirements succeeded/failed
- Generates final report regardless of status

**Plan Preservation**:

- Only moves plan to done/ on complete success (zero findings)
- Partial completion keeps plan in current location for manual review
- Uses git mv to preserve commit history when archiving

**Worktree Lifecycle**:

- Worktree-based modes enter the plan's designated worktree (Step 0); main-based modes remain in the primary checkout and create no plan worktree
- A plan worktree is synced with `origin/main` (ff-merge or rebase) before any implementation; dirty state or rebase conflicts stop execution for user decision
- On `pass`, after final delivery, the orchestrator runs the complete canonical [Worktree and Artifact Cleanup gate](../../../development/workflow/worktree-and-artifact-cleanup.md): verify the Delivery Branch Inventory and every mandatory pre-removal check, then clean the exact worktree, eligible plan-created branches, and plan-local regenerable build output while preserving diagnostics/shared caches and applying the bare-repository ordering exception; no additional confirmation prompt is required
- On `partial` or `fail`, the worktree and diagnostic/resumption artifacts are retained

## Plan-Specific Validation

The plan-execution-checker validates:

- **Requirements Coverage**: All requirements from plan implemented
- **Deliverables Completeness**: All deliverables created and meet quality standards
- **Checklist Completion**: All delivery checklist items marked as completed with implementation notes
- **Quality Standards**: Implementation follows repository conventions and best practices
- **Testing Requirements**: Tests written and passing as specified in plan
- **Documentation**: Required documentation created and accurate
- **Operational Readiness** (CRITICAL): The checker verifies ALL of the following were executed:
  - **Local quality gates passed**: `./rhino gate run --surface pre-push` (or the equivalent `.husky/pre-push` invocation) was run and passed with zero failures before every push
  - **CI/CD fully green**: All GitHub Actions workflows passed after every push — no exceptions
  - **Preexisting issues fixed**: All encountered failures were fixed, including those not caused by the plan's changes (root cause orientation)
  - **Delivery.md updated progressively**: Checkboxes ticked sequentially with implementation notes, not batch-ticked at the end (verified via git history)
  - **Thematic commits**: Authorized changes use the fewest build-valid, independently reviewable
    and revertible coherent commits, with required completion artifacts kept together
  - **Environment setup performed**: Evidence that dev environment was set up before implementation began
  - **Manual behavioural assertions**: Real-browser tooling verified UI changes. Every changed HTTP
    operation ran its planned `rtk curl` success/failure recipes; changed non-HTTP RPC/events ran their
    planned protocol-native equivalents. Assertions and independently attributable evidence are in
    `delivery.md`.
