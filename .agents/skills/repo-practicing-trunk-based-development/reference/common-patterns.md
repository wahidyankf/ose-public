# Trunk-Based Development — Common Patterns

## Pattern 1: Multi-Day Feature Development

**Scenario**: Feature takes 3 days to complete

**✅ Correct approach (TBD with feature flags)**:

```
Unit 1 — natural infrastructure seam:
- Add a temporary flag, disabled in production
- Complete and test the internally useful infrastructure increment
- Push to <plan-branch>; open a draft PR; land it once production-deployable and green

Unit 2 — natural behaviour seam:
- Implement a complete-and-inert behaviour increment behind the flag
- Test enabled and disabled paths and record rollout, rollback, and removal
- Push to <plan-branch>; land it once production-deployable and green

Unit 3 — release seam:
- Test internally with flag enabled
- Enable flag for all users
- Push to <plan-branch>; land it once green
```

Each natural cohesive unit lands on its own short-lived branch and PR — the temporary flag, not an
open branch, controls exposure. LOC, file counts, and elapsed days do not define the units. Under a
declared direct-push mode, substitute `git push origin main` for the branch-and-PR step; the
natural-seam integration shape is identical either way.

**❌ Wrong approach (long-lived branch)**:

```
Day 1-3:
- Create feature branch
- Accumulate changes
- Risk merge conflicts
- Delayed integration
```

## Pattern 2: Experimental Work

**Scenario**: Testing new framework (may be abandoned)

**✅ Correct approach (short-lived experimental branch)**:

```yaml
git-workflow: "Branch: experimental-graphql"
branch-justification: |
  **Category**: Experimental
  **Reason**: Evaluating GraphQL vs REST, may reject GraphQL
  **Duration**: 1 week evaluation
  **Merge Strategy**: Merge to main if adopted, delete if rejected
```

**Workflow**:

```bash
# Day 1-7: Experiment on branch
git checkout -b experimental-graphql
# (exploration work)

# Day 7: Decision made
# If adopting: push the branch and land it through a PR
git push origin experimental-graphql
gh pr create --draft --base main
# ... exact-head PR CI + applicable surface gates, then squash/rebase merge (never a local `git merge`,
# which would break linear history)
git branch -d experimental-graphql

# If rejecting: preserve diagnostics, prove this self-created branch has no unpushed work worth
# retaining, then follow the canonical non-force plan-created branch cleanup. If its checks cannot
# pass, retain and escalate the branch. `git branch -D` replaces that only under the task-branch
# exception of forbidden-operations.md: its PR merged with the head equal to the tip, or the branch
# stale for over 72 hours (no worktree, no open PR) with its tip preserved first.
```

## Pattern 3: External Contribution

**Scenario**: Open source contributor submits PR

**✅ Correct approach (PR branch from fork)**:

```
1. Contributor forks repo
2. Contributor creates branch in fork
3. Contributor opens PR to main
4. Maintainer reviews PR
5. Maintainer merges to main (if approved)
6. Contributor's branch deleted after merge
```

**Key**: Branch is in fork, not main repo. Main repo stays clean.
