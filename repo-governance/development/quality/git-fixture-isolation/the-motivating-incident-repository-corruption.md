---
description: "The incident: a git-fixture test corrupted the real repository."
when_to_use: "Use for the incident that motivated this convention."
---

# The Motivating Incident (part 1)

A Rust test fixture in `apps/rhino-cli`
(`find_root_from_worktree_returns_worktree_path`, in
`apps/rhino-cli/src/infrastructure/git/root.rs`) builds a throwaway git repository and a linked
worktree to exercise repository-root resolution. Under parallel `nx affected`/`nx run-many`
invocations (`test:quick` fanning out across roughly two dozen projects), this fixture has
repeatedly corrupted the **real** repository it runs inside rather than staying isolated to its
throwaway sandbox: an unexpected `"init"` commit -- authored by the fixture's hardcoded
`Test <test@test.com>` identity -- landed directly on the real working branch on top of the last
real commit, immediately before or during a `git push`; `git worktree list` additionally showed
`prunable` linked worktrees registered against the real `.git`, checked out to the stray-commit
SHAs; and the real repository's local `git config user.*` was left overwritten to
`Test <test@test.com>`, mis-attributing authorship on several already-pushed commits until a
human restored the local identity by hand (per this repo's Git Identity Guardrail, no AI agent
may set it). Each occurrence was repaired without data loss via `git reflog` plus a non-destructive
`git reset` -- the corruption only ever moved the branch pointer, never altered real working-tree
file contents -- but the exposure was real: an automated fixture, unsupervised, mutated the branch
history and identity config of the repository it ran inside.
