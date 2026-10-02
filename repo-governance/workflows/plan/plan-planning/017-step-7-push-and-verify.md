---
description: Describes the commit, push, CI-monitoring, and complete worktree, branch, and build-output cleanup sequence that finishes plan-establishment.
when_to_use: Use when pushing a finished plan to its confirmed target, monitoring CI, and running the canonical three-class cleanup gate.
---

# Step 7. Push and Verify (Sequential)

Commit and push the plan to the confirmed target, then run the canonical cleanup gate for the
worktree, eligible plan-created branches, and plan-local regenerable build output.

**Orchestrator action**:

1. From inside the worktree (`worktrees/<identifier>/`), stage all plan files:
   `git add <plan-dir>`
2. Commit inside the worktree: `chore(plans): establish <identifier> plan` (for
   `target-stage=backlog`, use `chore(plans): add <identifier> to backlog`)
3. Push from the worktree to the confirmed target (default `origin main`):
   `git push <confirmed-target> HEAD:main`
4. Monitor GitHub Actions: `gh run list --limit 5` — verify all workflows triggered by the push
   complete with `completed/success` conclusion.
5. If a CI workflow fails: diagnose root cause, fix, push a follow-up commit, re-monitor
6. After CI passes, run the complete canonical
   [Worktree and Artifact Cleanup gate](../../../development/workflow/worktree-and-artifact-cleanup.md).
   Resolve the declared repository-relative route from the Provisioned Worktree Identity against the
   selected repository root, reconcile the resulting runtime path with `git worktree list --porcelain`,
   inventory every plan-created/current branch and plan-local build output, and perform all mandatory
   pre-removal checks. When they pass, immediately clean all four eligible classes: bringing down
   dev container stacks this session started, non-force removal of the resolved worktree, safe
   cleanup of eligible plan-created branches, and removal of only plan-local regenerable build
   output. Preserve diagnostics and shared
   caches, retain and escalate active/ambiguous/partial/fail state, and delete verified remote branches
   before the worktree only when the bare-repository ordering exception applies. Never force-remove or
   prune shared state.

7. Emit a user-visible summary: plan path, quality gate status, push target, CI status

**Output**: `plan-path`, `final-status`, `final-report`.

**On push failure**: Surface the error. Do NOT retry automatically — conflicts require human
resolution.
