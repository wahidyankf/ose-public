---
description: A real transcript of a sibling repository found with local main silently behind origin/main, and how the reconcile closed the gap.
when_to_use: Use as a concrete reference example when explaining why the terminal reconcile step is mandatory rather than conditional.
---

# Worked Example — the 2026-07-21 Sibling Drift

A sibling repository was found in exactly the state this method exists to close, on the same day
this document was written. The transcript below is preserved verbatim, so it uses the name as it
stood that day: `ose-infra` is the repository now known as the private sibling. That name is not a path to
run against today — the method, not the repository, is what this example teaches:

```console
$ git -C ose-infra rev-list --left-right --count origin/main...main
2 0
```

Local `main` was **two commits behind** `origin/main`. The repository's own history was not wrong —
the commits had genuinely reached `origin/main` through prior side-worktree landings — but no
command in the landing had ever touched the repository's own `main` ref, because a push from a
linked worktree updates only the remote and that worktree's own branch, never a same-named local
branch sitting elsewhere. The bare-repo reconcile closed the gap:

```console
$ git -C ose-infra fetch origin main:main
fe4a0a66e..f6ecdcc0b  main       -> main
$ git -C ose-infra rev-list --left-right --count origin/main...main
0 0
```

No command failed and nothing warned during the original landing — the lag was entirely silent, which
is exactly why step 8 is a fixed part of the numbered method rather than a step performed only when
something looks wrong.
