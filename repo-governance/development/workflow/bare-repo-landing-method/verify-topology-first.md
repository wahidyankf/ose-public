---
description: The two ways to check whether a repository is bare, and the one command that must never be used to answer that question.
when_to_use: Use when you need to determine whether a repository is bare, before running any mutating git command against it.
---

# Verify Topology First

Ask "is this repository bare, or does it have a work tree?" before doing anything else. Two checks
answer it, with different provenance, and one command is forbidden for this question entirely.

## Primary / human check — `git worktree list`

```console
$ git worktree list
/Users/<name>/ose-projects/<sibling>  (bare)
```

The `(bare)` marker on the entry for the repository's common directory is **upstream-prescribed**:
`git-worktree(1)` §LIST OUTPUT FORMAT documents this exact output shape. Read this first, and read it
with your own eyes when a human is present — it is the least interpretation-dependent signal
available.

## Scriptable form — the `core.bare` read

```bash
git config --file "$(git rev-parse --git-common-dir)/config" core.bare
```

This form is **derived from documented mechanics, not upstream-prescribed** — git does not publish it
as a bareness API. `git-worktree(1)` documents where `core.bare` lives (the common config file) and
which worktree it governs (the main worktree only); reading it as a bareness test is a defensible
inference from that documentation, not a quotation of it. Label the form this way wherever it appears,
so a later reader does not mistake a derived recipe for a prescribed one.

## The forbidden command — never `git rev-parse --is-bare-repository`

`git rev-parse --is-bare-repository` must never be used to answer "is this repository bare." This is
**documented scoping semantics, to be worked around by asking the right question** — the command
answers a narrower, different question correctly: "is _this checkout_ bare." `git-worktree(1)`
§CONFIGURATION FILE states that when `core.bare` lives in the common config file, "they will be
applied to the main worktree only." A linked worktree is by design never bare, so
`--is-bare-repository` returns `false` from inside one even when the repository's main worktree is
bare — exactly as documented, not as an anomaly.

One source in general circulation gets this wrong by omission:
<https://www.gitworktree.org/troubleshooting/must-be-run-in-work-tree> recommends
`git rev-parse --is-bare-repository` as a general bareness diagnostic without addressing the
linked-worktree scoping caveat above. Treat it as a **known-bad counter-source** for this specific
question, not as a corroborating reference.
