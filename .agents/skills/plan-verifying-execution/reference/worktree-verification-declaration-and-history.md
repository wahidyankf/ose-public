# Worktree Usage Verification (Step 5e): Declaration and Git History

## 2. Verify Worktree Was Used (Step 5e — MANDATORY)

After verifying archival (Step 5d), verify execution used the delivery mode's declared work
location per the
[plan-execution Step 0 gate](../../../../repo-governance/workflows/plan/plan-execution/014-enter-worktree-preconditions-and-work-branch.md#0-enter-the-designated-worktree-sequential-hard-gate).
For a worktree mode, it enters or provisions the declared worktree; for a main mode, it remains in
the primary checkout. In both cases it syncs from fresh `origin/main` before implementation.

### What to Validate

1. **Plan declares a `## Worktree` section**
   - Multi-file plan: `delivery.md` contains `## Worktree`. An existing pre-contract single-file
     plan or a bug-fix plan carries it in `README.md`; this check never authorizes creation of any
     other new single-file formal plan.
   - Missing: **HIGH** finding (the executor should have refused to start; if it ran, that itself is
     a CRITICAL workflow violation).

2. **Declared work location matches the mode**
   - Worktree mode: the path follows `worktrees/<plan-identifier>/`.
   - Main mode: the section says `not applicable`, names the mode, and uses the primary checkout.
   - A path for a main mode or missing path for a worktree mode: **HIGH**.

3. **Git history evidence matches the work location**
   - Commits authored during the plan execution window should show authorship from the worktree
     branch (`<plan-identifier>`) before merging to `main`, OR commit messages should reference the
     worktree.
   - When the publish path was direct-to-main (no worktree branch trace), confirm the commits cluster
     within the plan-execution timeframe and reference the plan identifier.
   - Worktree mode with no worktree evidence: **MEDIUM**. Main mode with primary-checkout history
     needs no worktree evidence.
