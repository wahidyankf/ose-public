---
description: How to safely read a file out of another repository by git ref, and the staleness hazard the ref form does not fix.
when_to_use: Use when a task requires reading a file out of one repository while standing in another.
---

# Reading a File From Another Repository

Reading a file out of one repository while standing in another, for example to adopt a change the
owner explicitly requested, is addressed by **git ref, never by working-tree path**, with a fetch
immediately before the read:

```console
git -C <other-repo> fetch origin
git -C <other-repo> show origin/main:<path>
```

A working-tree path such as `<other-repo>/<path>` resolves against whatever that checkout happens to
contain right now. On a shared machine that is not a safe assumption: another session may have left
its local `main` behind `origin/main` — the very defect this document exists to close — in which case
the file may be stale, or may not exist at all. The ref form fixes exactly that problem: it does not
depend on a working tree being reconciled at all, and it is the only form that works when the source
repository is bare and has no working tree to path into.

What the ref form does **not** fix is staleness of the remote-tracking ref itself. `origin/main` —
`refs/remotes/origin/main` — is a purely local ref, the same class of ref
[Measure after fetching, never before](./measure-after-fetching-never-before.md#measure-after-fetching-never-before) above warns about:
`git show origin/main:<path>` performs no network access, so it returns whatever `<other-repo>` last
fetched, silently, with no error if that content is stale or the change is entirely missing from it.
The drift is not always the direction that section's example shows, either — it can just as easily be
that another session pushed to the shared remote and `<other-repo>`'s own `origin/main` has not caught
up yet, rather than `<other-repo>`'s local `main` lagging behind its own `origin/main`. Treat this read
under the same discipline as that section's `rev-list` measurement: **always fetch in `<other-repo>`
immediately before the `show`**, as the two-line recipe above does, never rely on a ref that was
fetched at some earlier, unknown time. This is why a read across repositories must be a
fetch-then-show pair, not the `show` alone.
