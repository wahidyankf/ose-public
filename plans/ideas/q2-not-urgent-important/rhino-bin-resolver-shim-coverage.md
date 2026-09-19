# Restore scenario coverage for `rhino-bin.sh`, the resolver every gate invocation goes through

> **Stable v0.4 routing:** References below to the retired in-tree Rhino implementation are historical evidence only. ose-public has no product source at that location; promote any still-relevant product work to the upstream Rhino repository and use its current stable commands.

One-line summary: the shim every hook, Nx target, and CI job uses to reach `rhino-cli` has three
resolution tiers and zero scenario-level tests — its Rust-era feature file was correctly deleted when
the mechanism changed, and the replacement was deferred to a phase that never picked it up.

> Provenance: demoted from the full `backlog/` plan `rhino-bin-resolver-shim-coverage/` to a
> two-pager on 2026-09-08. Originally filed direct-to-backlog by
> [`rewrite-rhino-cli-to-fsharp`](../../done/2026-08-30__rewrite-rhino-cli-to-fsharp/README.md)'s
> Phase 12 Knowledge Capture triage — a route the Knowledge Capture Convention forbids, which is why
> it is here now.

## Problem / context

`./rhino` resolves the binary in three ordered tiers, per its own header
comment and its single `if/elif/else`:

1. `RHINO_CLI_FSHARP_BIN` — used directly when set **and** the path is both a file and executable.
2. `apps/rhino-cli/src/dist/rhino-cli-fsharp` — the published self-contained binary, when executable.
3. `dotnet run --project …/Rhino.Program.fsproj` — last resort, and the only tier needing the SDK.

The Rust-era shim had the analogous three tiers and
the upstream Rhino `gate-binary-resolution.feature` carried four scenarios over
them. Phase 9a retired that file — correctly, because Phase 9c's crate deletion made every scenario
describe a mechanism that would cease to exist. Phase 9a's own verdict table flagged the gap in the
same breath ("may still warrant fresh, F#-only-tier scenarios"), and Phase 9c declined to author it
in plan, recording the reason rather than dropping it silently: "net-new test-authoring scope beyond
delete/simplify, not a like-for-like port." No later phase picked it up.

Confirmed on 2026-09-08: `find specs -iname '*binary-resolution*'` returns nothing, and the step
files that mention the script (`GateEmissionSteps.fs`, `GateValidationSteps.fs`,
`ParityManifestSteps.fs`) invoke it as a black box rather than driving its branches. The behaviour is
live, shipped, and load-bearing; the guard rail was removed without a replacement.

## Why now

Not urgent — nothing is failing, and the shim demonstrably works because every gate in CI runs
through it. The stake is what a silent regression would cost. If tier 1 stopped taking precedence,
or tier 2's executable test inverted, the symptom would not be "the resolver is wrong"; it would be
some unrelated gate producing a confusing result several layers downstream, against a binary nobody
intended. That is the exact failure class the retired feature file existed to make legible, and the
script is small enough that covering it properly is a bounded piece of work rather than a project.

## Prior art / precedents

- The retired `gate-binary-resolution.feature` itself — four scenarios over the Rust-era tiers, the
  shape being restored rather than invented. Recoverable from
  [`2026-08-30__rewrite-rhino-cli-to-fsharp`](../../done/2026-08-30__rewrite-rhino-cli-to-fsharp/README.md)'s
  history.
- [Behaviour-Driven Development contract](../../../repo-governance/development/behaviour-driven-development.md)
  — Gherkin first, Unit always, static coverage in quick; the contract this gap sits outside of.
- **`DispatchUnitTests.fs`'s `runCaptured` / `newTempDir` harness** — the in-repo precedent for
  subprocess-driven tests with a controlled temp directory, which is the natural shape for a shell
  script branching on env vars and file modes.
- **`bats`** and **shellspec** — the ecosystem-standard answers to "test a bash script", worth one
  paragraph of build-vs-buy before committing to a TickSpec or xunit harness.
- [`rhino-md-links-json-output-scenario-gap`](./rhino-md-links-json-output-scenario-gap.md) —
  the sibling case: live behaviour whose scenario coverage was lost in a migration and never restored.

## Proposed direction (sketch)

- **Write the three scenarios the tiers actually have**, in a distinctly named feature file (the old
  name described a different mechanism and should not be reused as if it were a port): an explicit
  override takes precedence over both fallbacks; an override pointing at a missing or non-executable
  path falls through to the dist binary _without_ reporting an error; no override and no dist binary
  falls through to `dotnet run`.
- **Drive it as a subprocess** with controlled env vars and a temp directory standing in for the dist
  path, following the existing `runCaptured`/`newTempDir` pattern rather than inventing a harness.
- **Prove the tests before trusting them** — each scenario must fail against a deliberately broken
  shim (swap the precedence order, invert the `-x` test) and pass against the unmodified script.
  Coverage written against a passing subject proves only that it was written.
- **Mirror into the private sibling by copy, not by re-authoring.** The script is inside the
  `apps/rhino-cli` byte-identity boundary, so the two repos must carry identical coverage.

## Rough scope & non-goals

In scope: the three resolution tiers and their precedence order, in `ose-public` and the private sibling.

Out of scope:

- Any change to the shim's resolution behaviour. This adds coverage for shipped behaviour; it does
  not redesign it.
- Coverage of the shim's _callers_ — hooks, Nx targets, CI jobs — which have their own tests.
- The `exec`-preserves-exit-code property, unless it falls out of the harness for free; it is a
  distinct claim from tier precedence and merits its own scenario rather than a smuggled assertion.

## Risks & open questions

- **Can TickSpec express shell-script invocation cleanly, or does this take the documented xunit
  fallback?** Unverified. It changes the file layout and the coverage registration, not the
  scenarios. (open)
- **Is `bats` a better fit than either?** The subject is a bash script, and the repo's F# test
  harness is being asked to drive it. Uncosted build-vs-buy. (open)
- **Do new spec files inside the byte-identity boundary move the parity manifest?** Needs checking
  before the private mirror, not after. (open)
- Tier 3 is awkward to test honestly: asserting `dotnet run` was chosen without actually paying for a
  `dotnet run` needs either a stubbed `dotnet` on `PATH` or an assertion on the resolved command
  rather than its effect. The former is more faithful and more fragile.

## What success looks like + promotion signal

Success: a scenario exists for each tier and for the precedence between them; each demonstrably fails
against a deliberately broken shim and passes against the real one; `the stable Rhino coverage contract` reports
the new adapters covered statically and stays runtime-free; and both parity repos carry byte-identical
coverage with the manifest reporting no divergence.

Promotion signal: the harness question is answered — TickSpec, xunit fallback, or `bats` — since that
single choice decides whether this is a two-file addition or a new test dependency with its own
toolchain, registration, and parity obligation. Absent that answer, promoting produces a plan whose
first phase is a spike.
