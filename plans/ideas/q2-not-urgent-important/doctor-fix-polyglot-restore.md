# Extend `doctor --fix` to restore polyglot project dependencies

> **Stable v0.4 routing:** References below to the retired in-tree Rhino implementation are historical evidence only. ose-public has no product source at that location; promote any still-relevant product work to the upstream Rhino repository and use its current stable commands.

One-line summary: `npm run doctor -- --fix` verifies toolchain presence but does not restore
per-project polyglot dependencies (NuGet, Cargo), leaving a fresh or long-idle checkout pre-push-red
until an agent manually diagnoses and runs the missing restore.

> Surfaced 2026-08-05 during plan-ideas-grooming-workflow execution.

## Problem / context

Pushing a sibling repository's local `main` failed pre-push on `crud-be-fsharp-giraffe:typecheck` with
`NETSDK1004: Assets file ... project.assets.json not found` — the F# demo app's NuGet packages had
never been restored. `npm run doctor -- --fix` had already run and reported all 13 tools OK; it
checks toolchain _presence_ (is `dotnet` installed?) not per-project package _restoration_ (has
`dotnet restore` been run against this specific `.fsproj`?). The same class of gap reproduced in
`beaver-nest` for npm-workspace-nested packages (`msw`, `@vitest/coverage-v8`) — `npm install`
alone did not resolve a hoisting mismatch; `npm dedupe` was needed. **Data point:** 2 of 4 repos hit
a restore-gap pre-push failure during this plan's execution, on two different polyglot toolchains
(.NET and npm workspaces).

## Why now

This is a recurring per-session tax: any repo left untouched for a while needs `doctor --fix` PLUS
a set of manual, tool-specific restore commands an agent has to rediscover from the error message
each time. A documented or automated fix removes that rediscovery cost.

## Prior art / precedents

- **This plan's `learnings.md`** — records both the .NET NuGet-restore incident and the
  `beaver-nest` npm-hoisting incident with full diagnostic detail.
  [plans/done/2026-08-05\_\_plan-ideas-grooming-workflow/learnings.md](../../done/2026-08-05__plan-ideas-grooming-workflow/learnings.md)
- **`doctor --fix` command** — the existing entry point this idea would extend.
  [worktree-setup.md](../../../repo-governance/development/workflow/worktree-setup.md)
- **Reproducible Environments convention** — already documents Volta/npm/lockfile reproducibility;
  the natural home for a "per-project restore" troubleshooting note, and where a `npm dedupe`
  workaround for the npm-hoisting variant of this gap was already landed inline by this plan.
  [reproducible-environments.md](../../../repo-governance/development/workflow/reproducible-environments.md)

## Proposed direction (sketch)

- Extend `doctor --fix` to walk all `.fsproj`/`.csproj` files and run `dotnet restore` against each
  if `project.assets.json` is missing or stale.
- Investigate whether a similar walk-and-restore step is feasible/worthwhile for the npm-workspace
  hoisting case (e.g., running `npm dedupe` as part of `doctor --fix` when a workspace-nested
  package is detected), or whether that is too broad a hammer for a routine `doctor` run.

## Rough scope & non-goals

In scope: `apps/rhino-cli`'s `doctor --fix` command, `.fsproj`/`.csproj` restore coverage.

Out of scope: extending `doctor --fix` to every possible per-project provisioning step (e.g.,
database migrations) — scope this narrowly to "make an idle checkout pre-push-green again."

## Risks & open questions

- Would auto-restoring on every `doctor --fix` run slow it down meaningfully for the common case
  (a checkout that's already restored)? (open — needs a cheap staleness check, not an unconditional
  restore)
- Is `npm dedupe` safe to run unconditionally inside `doctor --fix`, or could it have surprising
  side effects on a repo with intentional workspace-version divergence? (open)

## What success looks like + promotion signal

Success: a fresh or long-idle checkout passes `npm install && npm run doctor -- --fix` and is
immediately pre-push-green, with no manual `dotnet restore` or `npm dedupe` rediscovery needed.
Not yet ripe — needs a decision on whether the npm-hoisting half belongs in this idea or is out of
scope, and a staleness-check design for the restore-on-every-run performance question.
