---
description: Never rebase commits others have pulled; when unsure prefer merge; and how to abort a rebase or merge safely.
when_to_use: Use before rebasing pushed commits, or when a rebase/merge needs to be safely aborted.
---

# Safety Considerations

## Never Rebase Public Commits

**CRITICAL RULE**: Never rebase commits others hold outside the
[authorized owned-task sync contract](../no-destructive-git-operations/001-authorized-task-branch-sync.md).

**Why this is dangerous:**

```bash
# You pushed commits yesterday
git push origin main
# Teammate pulled your commits
# Their work builds on your commits

# WRONG: Rebase commits you already pushed
git pull --rebase origin main  # Rewrites history
git push --force origin main   # BREAKS teammate's repository!

# Teammate's commits now based on non-existent history
# Their `git pull` will fail or create duplicate commits
```

**Outside that bounded contract**, only rebase LOCAL commits never pushed:

```bash
# Safe: Rebase local commits before first push
git commit -m "feat: add feature"  # Local only
git pull --rebase origin main      # Safe - rewrites local commit
git push origin main               # First push - safe

# Unsafe: Rebase after pushing
git push origin main               # Others may have pulled
git pull --rebase origin main      # DANGEROUS - don't rewrite pushed commits
```

## When Unsure, Merge is Safer

**If you're uncertain about impact**:

```bash
# Safe default: merge preserves all history
git pull origin main  # Merge strategy (default)

# No history rewriting
# No breaking others' repositories
# Can always clean up history later if needed
```

## Aborting Operations

**Always have an escape path:**

```bash
# Abort rebase if things go wrong
git rebase --abort
# Returns to state before rebase started

# Abort merge if conflicts are overwhelming
git merge --abort
# Returns to state before merge started
```
