---
description: The per-project restore gap for F#/.NET projects, which need an explicit dotnet restore step that toolchain validation and provisioning do not cover.
when_to_use: Use when `nx affected -t test:quick` fails on an F# project with a missing-dependency error right after provisioning a worktree.
---

# Per-Project Dependency Restoration for Some Language Ecosystems

A further gap has surfaced in practice that the two-step init above does not cover. It is one-time,
worktree-local, and requires no source or config changes — but agents should account for it
explicitly rather than rediscover it mid-task.

`npm run doctor` validates, and `./rhino toolchain provision --apply` provisions, the _toolchain_
(the `dotnet`, `cargo`, etc. CLIs themselves); neither runs _per-project_ dependency restoration. Most ecosystems this repo builds in restore
dependencies automatically as a side effect of their own build/test/typecheck invocation (Rust's
`cargo`, TypeScript's package-manager-driven Nx executors), so the gap is invisible for them.
F#/.NET does NOT auto-restore and needs an explicit one-time step in a freshly provisioned
worktree:

```bash
# F#/.NET — run once per affected src and tests project, e.g. apps/ose-be, apps/organiclever-be
rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- dotnet restore [project-or-solution]
```

Symptom without this step: `nx affected -t test:quick` fails on F# projects with
`NETSDK1004: Assets file ... not found. Run a NuGet package restore`, even though the toolchain
itself (`dotnet`) is correctly installed. Root-cause the failure to this gap before assuming a real
regression — it reproduces on every freshly provisioned worktree that touches an F# project, not
just once.
