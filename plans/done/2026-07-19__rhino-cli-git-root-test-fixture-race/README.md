# rhino-cli Git Root Test Fixture Race

**Status**: Done (2026-07-19) — delivered across all 3 repos (ose-public #74, ose-primer #10,
ose-infra #12); 3 PR-review cycles complete (0 CRITICAL/0 HIGH), CI green, byte-identity verified.

## Context

`apps/rhino-cli/src/infrastructure/git/root.rs` contains a test,
`find_root_from_worktree_returns_worktree_path` (line 76 [Repo-grounded]), that exercises
git-worktree root resolution. Its fixture setup hardcodes a `Test`/`test@test.com` git identity
(lines 87, 92 [Repo-grounded]) and creates a real linked git worktree as part of test setup. Under
parallel `nx affected`/`nx run-many` invocations (e.g. `test:quick` fanning out across ~25 projects),
this test has repeatedly corrupted the **real** repository it runs inside, rather than staying
isolated to a throwaway fixture.

## Origin

Surfaced 4 times during `plans/done/2026-07-18__e2e-scenario-coverage-gap-detector`'s PR #66
PR-review maker→fixer cycles (cycles 5, 6, and twice more), each time during a
`pr-review-fixer`'s `nx affected -t typecheck lint test:quick specs:coverage` run. Filed per the
[Knowledge Capture Convention](../../../repo-governance/development/quality/knowledge-capture.md)
code-routing rule (a code-homed learning always becomes a backlog plan, never landed inline in the
originating plan's PR).

## Scope

**In scope:**

- Root-cause the test's fixture isolation failure under parallel execution.
- Rewrite the fixture so it operates entirely inside a throwaway temp directory (never the real
  repository's `.git`), with no possibility of registering a linked worktree or commit against the
  actual working tree regardless of concurrent test execution elsewhere in the same process/CI run.
- Add a regression test that runs this fixture concurrently (e.g. via a loop or `cargo test` with
  increased `--test-threads`) with whatever operation Phase 1 identifies as the actual interacting
  cause (a `CwdLock`-guarded git test, a `specs_coverage.rs` test run, or an `nx affected`-style
  multi-process fanout — Phase 1 determines which), to prove the race is closed.
- Audit `apps/rhino-cli/src/infrastructure/git/` for any other test using a similar real-worktree
  fixture pattern, and apply the same fix if found.

**Out of scope:**

- Restoring the git identity/authorship already mis-attributed on already-merged commits (historical
  commits are not rewritten; this is a forward-looking isolation fix only).
- Changes to `CwdLock` itself unless the root cause is proven to be there rather than in this specific
  fixture.

## Symptom Evidence (sanitized)

Observed 4 times total across one session, each occurrence an unexpected `"init"` commit authored by
`Test <test@test.com>` appearing directly on the real working branch, on top of the last real commit,
immediately before/during a `git push`. `git worktree list` additionally showed multiple `prunable`
linked worktrees registered against the real repo, each checked out to one of the exact stray-commit
SHAs — confirming actual `git worktree add`-style linked-worktree creation against the real `.git`,
not merely a wrong-CWD `git init`. Side effect observed: the worktree's local `git config user.*` was
left overwritten to `Test <test@test.com>`, which then mis-attributed authorship on several real,
already-pushed fix commits until a human restores the local identity (`git config --local user.name`/
`user.email`) — per this repo's Git Identity Guardrail, no AI agent may set it.

Each occurrence was repaired without data loss via independent `git reflog`/content-parity
verification followed by a mixed (non-destructive) `git reset <good-sha>` — never a `--hard` reset —
since the corruption only ever moved the branch pointer, never altered real working-tree file
contents.

## Document Navigation

- [brd.md](./brd.md) — business rationale.
- [prd.md](./prd.md) — product requirements, acceptance criteria.
- [tech-docs.md](./tech-docs.md) — architecture, root-cause hypothesis, design decisions.
- [delivery.md](./delivery.md) — phased delivery checklist.

## Related

- [Knowledge Capture Convention](../../../repo-governance/development/quality/knowledge-capture.md)
- [Git Identity Guardrail](../../../AGENTS.md#reproducible-environments)
- `plans/done/2026-07-18__e2e-scenario-coverage-gap-detector/learnings.md` — full incident detail.

> Home prefix normalised: absolute home-directory paths in this plan's files were rewritten to a portable form (such as `~/`, `$HOME/`, or a `<placeholder>`), so captured output here is not byte-verbatim.
