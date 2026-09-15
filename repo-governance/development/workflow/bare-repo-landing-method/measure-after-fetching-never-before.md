---
description: Why rev-list --left-right --count must run after a fetch, and the false-clean reading it produces when measured beforehand.
when_to_use: Use when checking whether a repository's local main is actually in sync with origin/main, to avoid trusting a stale measurement.
---

# Measure After Fetching, Never Before

`git rev-list --left-right --count origin/main...main` compares two **local** refs: `main` and the
remote-tracking ref `refs/remotes/origin/main`. It performs no network access. Run before any fetch,
it therefore reports the relationship between two refs that may both be equally stale, and the
answer it gives is `0 0` — indistinguishable from a genuinely reconciled repository.

That false clean is not hypothetical. Immediately after a merge landed on the remote, this sequence
was observed in a bare sibling (transcript preserved verbatim — `ose-infra` is the repository now
known as the private sibling):

```console
$ git -C ose-infra rev-list --left-right --count origin/main...main
0 0

$ git -C ose-infra fetch origin
$ git -C ose-infra rev-list --left-right --count origin/main...main
1 0

$ git -C ose-infra fetch origin main:main
$ git -C ose-infra rev-list --left-right --count origin/main...main
0 0
```

The first reading and the last are byte-identical, and only one of them means what it appears to
mean. **Always refresh the remote-tracking ref before measuring** — either with a preceding
`git fetch origin`, or by reading the count only after the reconcile command itself has run. (This
transcript demonstrates the false-clean problem, not the claim below on its own: the plain
`git fetch origin` shown above already refreshed `origin/main` before `git fetch origin main:main`
ran, so the final `0 0` here is equally consistent with `main:main` having updated only `main` — the
ref that was actually behind — and leaving the already-current `origin/main` untouched.)

Separately, as a documented git behaviour rather than something this transcript isolates:
`git fetch origin main:main` does update both `main` and `refs/remotes/origin/main` — but the
`origin/main` half is git's **opportunistic remote-tracking update**, which fires only when the
remote's standard `remote.origin.fetch` refspec is configured, as it is for every repository this
document addresses. That update is not intrinsic to the `main:main` refspec itself: a bare repository
cloned without that standard refspec (for example, a plain `git clone --bare`) has no `origin/main`
ref at all. There, the fetch still **succeeds** — it updates `main` and prints an ordinary update
line — and it is the measurement afterwards that fails loudly, with
`fatal: ambiguous argument 'origin/main...main'`. That failure is the good case: it is the one shape
of this problem that cannot pass silently. Treat any left-right count taken before a fetch as no
evidence at all.
