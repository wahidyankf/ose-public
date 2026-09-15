---
description: Worked console transcript showing why git merge fails in a bare repository and why the refspec fetch form is the only universal one.
when_to_use: Use when explaining or verifying why the bare-topology row of the Terminal Reconcile table uses a fetch refspec instead of merge --ff-only.
---

# Why Merge --ff-only Cannot Run in the Bare Siblings

```console
$ git -C <private-sibling> worktree list
/Users/<name>/ose-projects/<sibling>  (bare)

$ git -C <private-sibling> merge --ff-only origin/main
fatal: this operation must be run in a work tree

$ git -C <private-sibling> status --porcelain
fatal: this operation must be run in a work tree

$ git -C <private-sibling> fetch origin main:main
```

Unlike the two commands above, this one exits `0` with no error — the point of this example.

**What it prints depends on whether the shell is RTK-wrapped**, so read the transcript accordingly.
Under plain `git`, a `fetch` that finds nothing new (the ref is already at that tip) prints nothing
at all, which is why no output line is shown above. Under this repo's RTK wrapper — where a hook
rewrites every `git` invocation to `rtk git` — the same command instead prints a filtered summary
line such as `ok fetched (1 new refs)`, and it prints that line **unconditionally**, including on a
genuine no-op. To see the underlying `From <url> … -> FETCH_HEAD` form, run it through
`rtk proxy git fetch …`.

Do not treat an `ok fetched` line in a transcript as fabricated evidence: it is the literal RTK
output an agent sees in this repo. See the worked example below for the same command against a ref
that genuinely has new commits to pull.

`git merge` requires a work tree unconditionally; a bare repository has none. The refspec fetch form
is the only one of the two idioms that runs in both topologies, which is why the table above keys on
topology rather than offering one universal command.
