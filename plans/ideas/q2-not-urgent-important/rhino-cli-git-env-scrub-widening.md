# rhino-cli's git-root env scrub only clears two of git's five ambient-repo variables

One-line summary: `find_root_from` in `apps/rhino-cli/src/infrastructure/git/root.rs` scrubs
`GIT_DIR`/`GIT_WORK_TREE` before invoking `git rev-parse --show-toplevel`, but leaves
`GIT_INDEX_FILE`, `GIT_OBJECT_DIRECTORY`, and `GIT_COMMON_DIR` set — `beaver-nest`'s
`apps/rhino-cli` fork widened the same scrub to all five before this repo did.

> Idea, added 2026-08-10, filed by the `beaver-nest-repo-consolidation` plan's D8 harvest step. D2
> discards `beaver-nest`'s `apps/rhino-cli` fork wholesale as behind upstream on net, but the survey
> found this one genuinely _forward_ patch and an Integrate-Before-You-Add scan at execution time
> found no existing brief covering it — filed rather than folded or dropped.

## Problem / context

Git hooks (and some CI/worktree tooling) can export any of five ambient repository-location
variables into a child process's environment: `GIT_DIR`, `GIT_WORK_TREE`, `GIT_INDEX_FILE`,
`GIT_OBJECT_DIRECTORY`, and `GIT_COMMON_DIR`. `find_root_from`'s own comment already states the
principle correctly — "Git hooks export these variables for the hook's repository, which would
otherwise override that starting point" — but the code only lives up to it for two of the five:

```rust
cmd.env_remove("GIT_DIR").env_remove("GIT_WORK_TREE");
```

`beaver-nest`'s fork of the same file widened this to all five:

```rust
.env_remove("GIT_DIR")
.env_remove("GIT_WORK_TREE")
.env_remove("GIT_INDEX_FILE")
.env_remove("GIT_OBJECT_DIRECTORY")
.env_remove("GIT_COMMON_DIR")
```

The gap is real, not cosmetic: `GIT_INDEX_FILE` can point `git` at a different staging index than
the one implied by the discovered worktree, and `GIT_OBJECT_DIRECTORY`/`GIT_COMMON_DIR` can
redirect object/ref resolution to a different repository's `.git` internals entirely — either could
make `find_root_from` (and every rhino-cli command that depends on it for repo-root discovery)
silently operate against the wrong repository state when invoked from a context that exports these
variables, exactly the class of ambient-state bug the existing two-variable scrub was written to
prevent.

## Why now

Not urgent — no live incident has been observed from the missing three variables in `ose-public`
itself, and Git hooks in this repo's own `.husky/` scripts do not export `GIT_INDEX_FILE`,
`GIT_OBJECT_DIRECTORY`, or `GIT_COMMON_DIR` today. The value is defensive completeness of an
already-half-built invariant, not fixing an observed defect.

## Prior art / precedents

- `apps/rhino-cli/src/infrastructure/git/root.rs` — the exact file, both here and in `beaver-nest`'s
  fork (pre-archival); `find_root_from`'s own doc comment already states the "scrub ambient
  hook-exported repo-location variables" intent this brief completes.
- [Related Repositories reference](../../../docs/reference/related-repositories.md) — defines the
  `apps/rhino-cli` byte-identity boundary spanning `ose-public` and the private sibling with
  zero carve-outs; any fix here obligates the same change in the other byte-identity repo, not
  `beaver-nest` (out of scope, forked, and being archived).
- [File-Touch Discipline](../../../repo-governance/development/practice/file-touch-discipline.md) —
  governs how a cross-repo byte-identity-gated change lands.

## Proposed direction (sketch)

Add the same three `env_remove` calls to `find_root_from` (and audit `find_root` and any other
`Command::new("git")` call site in the same module for the same gap), then regenerate
`apps/rhino-cli/parity-manifest.sha256` and propagate the identical change to
the private sibling in lockstep, per the standing byte-identity boundary.

## Rough scope & non-goals

In scope: widening the env scrub in `apps/rhino-cli/src/infrastructure/git/root.rs` (and any sibling
git-invocation call site with the same gap) across the three byte-identity repos.

Out of scope: any other divergence between `beaver-nest`'s former `rhino-cli` fork and this repo's
`rhino-cli` — those were evaluated separately by D2/D8 and are either already correctly dropped
(the two simplification-only divergences) or already upstreamed (the root-file naming exemption).

## Risks & open questions

- Whether any existing test fixture relies on `GIT_INDEX_FILE`/`GIT_OBJECT_DIRECTORY`/
  `GIT_COMMON_DIR` being inherited by a `git rev-parse` subprocess (unlikely, but unverified — a
  fixture that intentionally sets one of these to simulate an alternate index would need updating
  alongside the widened scrub).
- Whether other `Command::new("git")` call sites elsewhere in `apps/rhino-cli` share the same
  two-of-five gap and should be swept in the same change rather than left inconsistent.

## What success looks like + promotion signal

Success: `find_root_from` (and any sibling call site with the same gap) scrubs all five ambient
git-location variables, matching its own doc comment's stated intent, landed identically across
`ose-public` and the private sibling. Promotion signal: ripe for a small, self-contained
`backlog/` plan (or a direct in-repo fix, since it is a narrow, low-risk, single-behaviour change)
whenever a maintainer picks it up — no external dependency blocks it today.
