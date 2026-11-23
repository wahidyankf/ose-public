---
description: FAIL examples of a plan-maker assuming direct push without declaring a mode and mis-tagging git-mechanical steps [HUMAN], plus the corrected [AI]-tagged PASS example.
when_to_use: Use when checking whether a plan-maker-authored delivery checklist declares its mode correctly and tags git-mechanical steps [AI].
---

# Examples — Plan-Maker Delivery-Mode Tagging

## FAIL: Incorrect plan-maker behaviour — assuming direct push without declaring the mode

User prompt: "Plan a governance update for Y."

```markdown
<!-- In delivery.md — WRONG -->

- [ ] [AI] Create convention file
- [ ] [AI] Update README index
- [ ] [AI] git add, commit, and push directly to origin main ← no ## Delivery Mode field declares this
```

No `## Delivery Mode` field justifies skipping the `worktree-to-pr` default. `plan-checker` must flag
this. The gate's repair pass must either add a justified `## Delivery Mode` override or correct the checklist to
the default PR-branch flow.

## FAIL: Incorrect plan-maker behaviour — `[HUMAN]` tag on a git-mechanical step

User prompt: "Plan a feature for Z." (default `worktree-to-pr` mode applies; no direct-push override)

```markdown
<!-- In delivery.md — WRONG -->

- [ ] [HUMAN] Create worktree: `git worktree add worktrees/feature-z -b feature-z`
- [ ] [HUMAN] Review the diff and approve push to the PR branch
- [ ] [HUMAN] Remove the worktree: `git worktree remove worktrees/feature-z`
```

All three are plain git-mechanical steps an agent performs directly. Under `worktree-to-pr`, every
step — including the final PR merge — is `[AI]` by default; a `[HUMAN]` merge gate applies only
where a plan's own step says so explicitly. These are mis-tags per
[Plans Organization Convention §Executor Tagging](../../../conventions/structure/plans/executor-tagging-tags-and-bias.md#executor-tagging--ai-vs-human-hard-rule).
`plan-checker` admits them to the ledger; the gate's repair pass retags them `[AI]`.

## PASS: Correct plan-maker behaviour — git-mechanical steps and the merge both tagged `[AI]`

```markdown
<!-- In delivery.md — RIGHT -->

- [ ] [AI] Create worktree: `git worktree add worktrees/feature-z -b feature-z`
- [ ] [AI] Commit, push, and open a draft PR against `main`
- [ ] [AI] Verify `quality-gate` is green for the exact current PR head and base, then flip to ready
- [ ] [AI] Merge the PR once the hardened preconditions hold
- [ ] [AI] Remove the worktree: `git worktree remove worktrees/feature-z`
```
