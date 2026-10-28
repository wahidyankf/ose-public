# Worktree Usage Verification (Step 5e continued): Freshness, Cleanup, and the Worktree Cap

Run the worktree-specific checks below only for worktree modes. For a main mode, verify the primary
checkout was synced from fresh `origin/main`, no plan worktree was provisioned, and skip worktree
cleanup/evidence requirements.

1. **Freshness sync was performed (Step 0 freshness gate)**
   - Look for execution-log or delivery-notes evidence that the worktree was synced with
     `origin/main` before implementation began (e.g., the `Worktree gate: passed (… up to date with
origin/main)` line, or a recorded `git merge --ff-only origin/main` / `git rebase origin/main`
     step).
   - No sync evidence: **MEDIUM** finding (the gate may have run unrecorded; flag for manual review).

2. **Eligible worktree cleanup was immediate and precondition-gated**
   - On `pass`, resolve the declared repository-relative route and creator from the Provisioned
     Worktree Identity against the selected repository root, then reconcile the resulting runtime
     path with `git worktree list --porcelain`; the file-touch ledger is file tracking only.
   - Inventory plan-created/current branches. Verify the worktree is clean/idle, branches have no
     unpushed commit, and every PR-mode branch meets the canonical merged-PR/head and
     remote-or-auto-deletion proof. A direct push needs its recorded `origin/main` commit and no
     open PR; any other missing/mismatched proof retains and escalates.
   - When all checks pass, require complete cleanup of all four artifact classes without another
     confirmation prompt: dev container stacks this session started brought down first (they
     bind-mount the worktree), non-force removal of the reconciled runtime path, canonical cleanup of
     eligible plan-created local/remote branches (bare-repository order exception where needed), and
     purge of only plan-local regenerable build output.
   - Require evidence that diagnostic artifacts were preserved and shared caches were not removed.
     Active, `partial`, and `fail` runs retain output needed for diagnosis or resumption.
   - On a failed check or removal, require retention, surfaced evidence, and escalation. `partial`
     and `fail` likewise retain the worktree.
   - Eligible successful delivery retained without escalation: **HIGH**. Forced removal, removal
     without identity-proven ownership, or removal despite a failed safety check: **HIGH**.
   - Eligible plan-local regenerable build output retained after successful delivery without a
     recorded exception, diagnostic evidence removed, or any shared cache removed: **HIGH**.

3. **Worktree cap held during execution** (enforces
   [Worktree Cap](../../../../repo-governance/conventions/structure/plans/worktree-cap.md#worktree-cap--one-worktree-per-repository-per-plan-hard-rule))
   - This check runs against the single repository `plan-execution-checker` is invoked in. Inspect
     execution evidence for this repo — implementation-notes/execution-log lines recording
     `git worktree add`, or (when still on disk) `git worktree list --porcelain` combined with
     `git reflog` for the plan's execution window — for how many distinct `git worktree add`
     invocations happened for this repo over the plan's whole run.
   - **More than one distinct `git worktree add` invocation for this repo within one plan: HIGH**
     finding — every delivery unit landed in this repo should have reused the one provisioned
     worktree (branch-switching between units), not provisioned a fresh one per unit. A subagent
     dispatch's auto-provisioned worktree counts identically toward this count, whether or not it
     appears in a command the acting agent typed directly.
   - **Worktree mode: no worktree-provisioning evidence recoverable** (no execution-log/implementation-notes lines
     recording `git worktree add`, AND the worktree is already gone from disk per this repo's
     [Immediate Cleanup rule](../../../../repo-governance/development/workflow/worktree-and-artifact-cleanup.md),
     so `git worktree list --porcelain` and `git reflog` have nothing left to inspect either):
     **MEDIUM** finding (the cap may have held unrecorded; flag for manual review) — never treat a
     zero-evidence result as equivalent to "one worktree, compliant."

### Finding Severity

- Plan ran without a mode-resolved `## Worktree` section: **CRITICAL** (Step 0 gate breach)
- Wrong worktree-path format in plan: **HIGH**
- Eligible worktree retained after successful delivery without a failed-check or removal-error
  escalation: **HIGH**
- Eligible plan-local regenerable build output retained without a recorded exception: **HIGH**
- Diagnostic evidence or a shared cache removed during plan cleanup: **HIGH**
- Session-started dev container stack left running, another session's stack brought down, or a
  machine-wide Podman prune issued during plan cleanup: **HIGH**
- Any `.env*` file or other local secret-bearing file removed during plan cleanup: **CRITICAL**
- Anything other than regenerable build output removed from the primary checkout's working tree, or
  the default branch deleted locally or on `origin`: **HIGH**
- Worktree force-removed, removed without identity-proven ownership, or removed despite a failed
  pre-removal check: **HIGH**
- Worktree mode: no worktree evidence in git history: **MEDIUM**
- No `origin/main` freshness-sync evidence: **MEDIUM**
- More than one `git worktree add` invocation for this repository within one plan: **HIGH**
- Worktree mode: no worktree-provisioning evidence recoverable (log lines absent and worktree already cleaned up per
  the Immediate Cleanup rule): **MEDIUM**
