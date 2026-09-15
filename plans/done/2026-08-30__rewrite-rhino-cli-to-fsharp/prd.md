# Product Requirements Document — rhino-cli F# port

## Product Overview

`rhino-cli` is a single command-line binary invoked by git hooks, Nx targets, and CI workflows. Its
product surface is 13 namespaces and their subcommands, three output formats (text, JSON,
markdown), and process exit codes [Repo-grounded — `apps/rhino-cli/src/cli.rs`].

This plan replaces the implementation language. **The product surface does not change.** Every
requirement below is a conservation requirement: prove that something did _not_ change. The one
deliberate exception is AC-8, which retires the scenarios whose subject is the Rust toolchain
itself and therefore has no consumer once the crate is gone.

## Personas

| Persona                        | Needs from this change                                                                                                                                                                       |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Contributor                    | Hooks stay fast enough not to be noticed. `git commit` and `git push` latency must not visibly regress.                                                                                      |
| CI maintainer                  | `pr-quality-gate.yml` stays green throughout; consumer jobs still `chmod +x` and run downloaded binaries with no toolchain install, both while there are two of them and after there is one. |
| Tooling maintainer             | Smaller, more navigable source; the same `.feature` files remain the single behavior contract.                                                                                               |
| The private sibling maintainer | The same semantic change lands in both repos in the same delivery units, so the parity boundary never diverges by more than one unmerged PR.                                                 |
| Future decision-maker          | A published before/after record, so the next language-change proposal argues from this repo's own data.                                                                                      |

## User stories

- **US-1** — As a tooling maintainer, I want the F# implementation to consume the existing
  `specs/apps/rhino/behavior/rhino-cli/gherkin/` feature files through TickSpec, so the behavior
  contract is never rewritten or weakened during the port.
- **US-2** — As a contributor, I want per-invocation startup to stay within the ceiling accepted at
  the Phase 1 gate, so pre-commit and pre-push feel the same as they do today.
- **US-3** — As a CI maintainer, I want each namespace to flip independently behind
  `rhino-bin.sh`, so a bad wave is reverted by one shim edit rather than by reverting a large PR.
- **US-4** — As a tooling maintainer, I want every ported namespace proven byte-identical to the
  Rust binary before its shim entry flips, so no output drift reaches a downstream consumer.
- **US-5** — As a future decision-maker, I want a nine-row before/after benchmark with a verdict on
  every row, so this rewrite's real cost and benefit are on record rather than argued from memory.
- **US-6** — As the private-sibling maintainer, I want every delivery unit of this plan to land in
  both repos before the next one starts, so the parity boundary is never left divergent across a
  merge.
- **US-7** — As a CI maintainer, I want the F# binary built and published by CI from Phase 2
  onward, so no gate job ever needs a .NET SDK installed to run a flipped namespace.
- **US-8** — As a CI maintainer, I want the `rust` job's two unique responsibilities re-homed
  **before** that job is deleted, so retiring Rust does not silently retire coverage with it.

## Acceptance criteria

### AC-1 — Publish-mode selection (US-2, US-7)

```gherkin
Scenario: The spike measures every viable publish mode
  Given a throwaway F# console project exercising FSharp.Core collections, a discriminated-union
    argument parser, System.Text.Json serialization, and a file-tree walk
  When it is published with PublishAot enabled, published self-contained without AOT, and each
    output is invoked 50 times in a loop with exit code 0 asserted per iteration
  Then mean per-invocation wall time is recorded for both modes alongside the Rust baseline
  And the publish duration and binary size are recorded for both modes in learnings.md
  And any ILCompiler trim or reflection error from the AOT publish is recorded verbatim
```

```gherkin
Scenario: A publish mode is selected and binds every later gate
  Given both publish modes have been measured
  When the first mode that produces a runnable binary is taken in the order NativeAOT,
    self-contained, framework-dependent
  Then exactly one publish mode is recorded in learnings.md as the plan's binding choice
  And the accepted startup figure becomes the ceiling every later wave gate re-checks
  And selecting framework-dependent additionally schedules setup-dotnet into the eight CI jobs that
    currently install no toolchain
```

### AC-2 — Behavior conservation per namespace (US-1, US-4)

```gherkin
Scenario Outline: A ported namespace is byte-identical to the Rust binary
  Given both the Rust binary and the F# binary are built from the same commit
  When every documented command in the <namespace> namespace is run against this repository with
    each of the text, json, and markdown output formats
  Then the F# stdout is byte-identical to the Rust stdout
  And the F# stderr is byte-identical to the Rust stderr
  And the F# process exit code equals the Rust process exit code

  Examples:
    | namespace       |
    | convention      |
    | parity          |
    | git             |
    | repo-config     |
    | env             |
    | doctor          |
    | test-coverage   |
    | md              |
    | governance      |
    | harness         |
    | specs           |
    | repo-governance |
    | gate            |
```

### AC-3 — Gherkin contract reuse (US-1)

```gherkin
Scenario: The F# suite consumes the existing feature files unmodified
  Given the 525 scenarios across the 71 feature files under specs/apps/rhino/
  When the F# TickSpec suite runs via nx run rhino-cli:test:quick
  Then every one of those scenarios has a passing F# step definition
  And no file under specs/apps/rhino/ was edited by any phase except Phase 3 and Phase 9a
```

### AC-4 — Dispatch shim routing (US-3)

```gherkin
Scenario: An unflipped namespace still routes to the Rust binary
  Given the dispatch shim in apps/rhino-cli/scripts/rhino-bin.sh
  When a namespace that has not yet been ported is invoked
  Then the shim executes the Rust binary for that namespace
  And the shim's resolution tiers for RHINO_CLI_BIN and the prebuilt gate binary still apply
```

```gherkin
Scenario: A flipped namespace routes to the F# binary
  Given a namespace whose wave gate has passed
  When that namespace is invoked through the shim
  Then the shim executes the F# binary
  And a single-line revert of that namespace's shim entry restores the Rust routing
```

### AC-5 — The before/after record (US-5)

```gherkin
Scenario: Every benchmark row carries a before value, an after value, and a verdict
  Given the nine benchmark rows captured in Phase 0 before any F# was written
  When Phase 10 re-measures each row against the finished F# implementation
  Then benchmark.md holds a non-placeholder before and after value for all nine rows
  And each row carries a better, worse, or unchanged verdict stating the absolute delta
  And no row is omitted from the record for being unfavourable to F#
```

```gherkin
Scenario: The comparison outlives the plan folder
  Given the completed benchmark.md
  When the Knowledge Capture phase routes it
  Then the comparison exists at a durable path outside plans/
  And tech-docs.md marks which pre-execution projections turned out wrong
```

### AC-6 — Two-repo landing (US-6)

```gherkin
Scenario: Both repositories carry the same delivery unit before the next one starts
  Given a delivery unit of this plan has merged into ose-public main
  When the corresponding delivery unit is prepared for private-sibling
  Then the same semantic change is authored in private-sibling rather than file-copied from ose-public
  And rhino-cli parity manifest validation exits zero on both main branches
  And no delivery unit starts while the previous one is unmerged in either repository
```

### AC-7 — CI conservation across both phases of the migration (US-3, US-7)

```gherkin
Scenario: The quality gate stays green while CI carries both binaries
  Given build-rhino builds the Rust crate and publishes the F# binary in the same job
  When pr-quality-gate.yml runs on a pull request
  Then format, enumerate, and every gate matrix group download both artifacts and run them without
    installing a toolchain
  And every gate group that passed before the shim flip still passes
  And the F# projects are Nx projects tagged lang:fsharp, so the existing dotnet job runs their tests
```

```gherkin
Scenario: The quality gate stays green after the Rust surface is torn down
  Given the Rust crate has been deleted and no project carries tag:lang:rust
  When pr-quality-gate.yml runs on a pull request
  Then no workflow in private-sibling references .github/actions/setup-rust
  And the only ose-public reference left is the format job's, retained for the 198 Rust course
    examples under apps/ayokoding-www/content/
  And the detect job exposes no has-rust output
  And build-rhino publishes exactly one binary under the artifact name consumer jobs already expect
```

### AC-8 — Rust retirement conserves coverage (US-8)

```gherkin
Scenario: The rust job's unique responsibilities are re-homed before it is deleted
  Given the rust job is the only place setting RHINO_REQUIRE_ELIXIR and provisioning setup-beam,
    and the only caller of nx affected -t test:coverage for this project
  When Phase 9d re-homes both into the dotnet job and then deletes the rust job
  Then a deliberate temporary break in the formatter-wrapper assertions turns CI red
  And a deliberate temporary coverage drop below the ninety percent threshold turns CI red
  And only then is the rust job removed
```

```gherkin
Scenario: Rust-specific scenarios are retired with a recorded verdict
  Given scenarios under specs/apps/rhino/ whose subject is the Rust toolchain itself
  When Phase 9a enumerates them by grepping the gherkin tree for cargo, rust, and clippy
  Then each scenario carries a written retain-or-retire verdict in learnings.md
  And only the scenarios marked retire are deleted, in their own pull request
```

## Product scope

**In scope**: all 13 namespaces, all 525 scenarios, all three output formats, exit codes, the
dispatch shim, the TickSpec unit and integration projects, the dual-binary CI phase and the Rust CI
teardown, the parity manifest, the before/after benchmark record, the rules propagation, and the
private sibling landing of every delivery unit.

**Out of scope**: new behavior of any kind; `apps/crane-cli`; the F# backends. Edits under
`specs/apps/rhino/` are out of scope everywhere except two sanctioned exceptions: Phase 3, which
adds the one `git/` lockfile feature file for a CLI surface that has no Gherkin today, and Phase 9a,
whose scope is bounded by a committed verdict table.

## Product risks

| Risk                                                                                           | Severity | Mitigation                                                                                                                                                                                              |
| ---------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Byte-identity fails on incidental formatting (float rendering, path separators, sort order)    | HIGH     | AC-2 runs before every shim flip; differences are fixed in F#, never by relaxing the Rust golden output.                                                                                                |
| Deleting the rust job silently drops the Elixir formatter-wrapper coverage it uniquely enables | HIGH     | AC-8 requires a deliberate break that must turn CI red before the job is removed. A green CI after re-homing proves nothing on its own.                                                                 |
| TickSpec cannot express a step the Rust `cucumber` harness supported                           | MEDIUM   | Discovered per wave; the fallback is a plain `xunit.v3` test asserting the same scenario, recorded in `learnings.md`.                                                                                   |
| Startup passes the spike but regresses once the binary carries all 13 namespaces               | MEDIUM   | Startup is re-measured at every wave gate against the Phase 1 ceiling, not only in the spike.                                                                                                           |
| Wave E is 188 scenarios across 38 feature files and includes the binding generators            | MEDIUM   | Its gate re-runs `npm run generate:bindings` and asserts a clean `git diff`, so a defective `harness` port cannot corrupt `.opencode/`, `.codex/`, or `.agents/` unnoticed.                             |
| Hook latency regresses in aggregate even with per-invocation parity                            | LOW      | Pre-commit makes 10 rhino invocations and a CI run makes 20 [Repo-grounded — `.husky/`, `pr-quality-gate.yml`]; at the projected 41 ms delta that is 0.41 s and 0.82 s, re-measured at every wave gate. |
