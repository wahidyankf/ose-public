# rhino-cli

**RHINO** – Repository Hygiene & INtegration Orchestrator

Command-line tools for repository management and automation, implemented in F#. The predecessor Rust
crate and the original Go binary are recoverable from Git history.

## What is rhino-cli?

An F# CLI binary with the same commands, flags, exit codes, and output formats (text / json /
markdown) as the retired Rust and Go implementations it replaced. Built with `Argu`
(declarative argument parsing) across four projects — `RhinoCli.Domain`, `RhinoCli.Infrastructure`,
`RhinoCli.Application`, `RhinoCli.Cli` — plus the `RhinoCli.Program` entry point, consuming the
Gherkin specs in
[`specs/apps/rhino/cli/behaviours/`](../../specs/apps/rhino/cli/behaviours/).

## Status

Production. Ported 1:1 from the Rust crate; `shadow-diff.sh` proved byte-identical stdout, stderr
and exit codes against the Rust binary for every namespace, and `parity manifest validate` guards
this app's tree against its checked-in SHA-256 manifest.

## Quick Start

```bash
# Build the self-contained release binary (Nx)
./hippo run --class ephemeral --disk-path . -- npm exec nx -- build rhino-cli

# Run via dotnet (no prior build required)
./hippo run --class ephemeral --disk-path . -- \
  dotnet run --project apps/rhino-cli/src/RhinoCli.Program/RhinoCli.Program.fsproj -- --help

# Echo a message
./hippo run --class ephemeral --disk-path . -- \
  dotnet run --project apps/rhino-cli/src/RhinoCli.Program/RhinoCli.Program.fsproj -- --say "hello world"

# Reject invalid output format (exits 1)
./hippo run --class ephemeral --disk-path . -- \
  dotnet run --project apps/rhino-cli/src/RhinoCli.Program/RhinoCli.Program.fsproj -- --output xml --help
```

## Installation

Local to this monorepo. To produce a standalone, self-contained binary:

```bash
./hippo run --class ephemeral --disk-path . -- npm exec nx -- build rhino-cli
# Binary at apps/rhino-cli/src/dist/rhino-cli-fsharp
```

.NET 10.0.204 is pinned in `apps/rhino-cli/global.json` with `rollForward: latestMinor`. Generated
gates resolve the binary through `scripts/rhino-bin.sh`: explicit `RHINO_CLI_FSHARP_BIN`, then the
published `dist` binary, then SDK-backed `dotnet run`.

## Nx Targets

| Target                       | Command / responsibility                                                                 |
| ---------------------------- | ---------------------------------------------------------------------------------------- |
| `build`                      | Publish the self-contained binary to `src/dist`                                          |
| `lint`                       | Run Fantomas, FSharpLint, and F# analyzers across all five projects                      |
| `typecheck`                  | Build `RhinoCli.Program.fsproj` without restore                                          |
| `test:unit`                  | Run Unit tests and hard-fail below 99% retained line coverage                            |
| `test:integration`           | Run real isolated local-resource tests without network                                   |
| `test:e2e`                   | Run the self-contained published CLI through its process boundary                        |
| `test:coverage:{unit,...}`   | Statically validate exact-one Gherkin bindings for the named adapter; run no tests       |
| `test:coverage`              | Run every applicable static Unit, Integration, E2E, and aggregate behaviour validator    |
| `test:quick`                 | Run typecheck, lint, Unit, specs checks, and static coverage serially; no higher runtime |
| `specs:structure-validation` | Validate the Specs tree                                                                  |
| `run`                        | Run the CLI through `RhinoCli.Program.fsproj`                                            |
| `install`                    | Restore `RhinoCli.Program.fsproj`                                                        |
| `deps:audit`                 | Scan NuGet dependencies for known vulnerabilities                                        |

See `apps/rhino-cli/project.json` for the full target set, including the cross-cutting governance
and env validators this project also owns (`governance:*`, `env:validation`). Static Gherkin
corpus, adapter, exemption, and journey-shape checks run through project-local
`test:coverage:behaviour` targets.

## Global Flags

See `src/RhinoCli.Cli/src/HelpText.fs`:

- `--verbose, -v` — timestamps
- `--quiet, -q` — errors only
- `--output, -o text|json|markdown` — default text; invalid values exit 1
- `--no-color` — disable color
- `--say <msg>` — echo to stdout
- `--help, -h` — print help

## Plan Validation

`plan validate` checks every plan under `plans/` against the shared plan structure: lifecycle roots,
the six documents, technical companions, acceptance identifiers, and the delivery checklist. The
retired implementations never had it, so no byte-identity baseline exists for it. Instead it is held
to the pinned RHINO `plan validate`: the same rule identifiers, messages, diagnostics, and exit
classes (`0` clean, `1` findings, `2` a plan document it cannot read). The shared corpus in
[`specs/fixtures/plan-structure/`](../../specs/fixtures/plan-structure/README.md) is what proves
the two agree, and the `plan-structure` gate runs the command in pre-commit and CI.

## RHINO Delegation

`rhino-cli` keeps only the governance rules the pinned RHINO does not provide. Each validator command has one row in
`repo-config.yml` `extensions.rhino-cli.delegation`, and `gate validate` refuses a missing, duplicate, or extra row:

| Class      | Behaviour                                                                      |
| ---------- | ------------------------------------------------------------------------------ |
| `delegate` | The leaf runs the named `./rhino` command; no F# rule remains                  |
| `split`    | The named `./rhino` command runs first; F# checks only the rules in `keeps`    |
| `stay`     | F# owns the rules in `keeps`; `until` names the later unit that delegates them |

`src/RhinoCli.Infrastructure/src/RustRhino.fs` launches the pinned binary. `md mermaid validate` is a file-scoped split:
RHINO gets one `--file` per selected diagram file and is skipped when there is none; the gate runner keeps its files.
`tests/unit/Steps/KeepListSourceScanTests.fs` scans the Application sources and fails when a rule is missing from every
`keeps` list or is one RHINO v0.3.0 provides. `plan-structure` is the one exception (see
[Plan Validation](#plan-validation)).

## Adding a Gherkin Scenario

A new scenario anywhere under
[`specs/apps/rhino/cli/behaviours/`](../../specs/apps/rhino/cli/behaviours/README.md)
needs exactly one substantive Unit binding under `tests/unit/Steps/`. Every applicable scenario
also needs exactly one Integration binding under `tests/integration/Steps/` and one process E2E
binding under `tests/e2e/Steps/`, unless the scenario carries an independently valid
`@integration-exempt` or `@e2e-exempt` with named alternative proof. Unit is never exempt.

The `test:coverage:*` targets validate this mapping statically without executing tests. Runtime
proof remains owned by `test:unit`, `test:integration`, and `test:e2e`. A binding is not sufficient
merely because TickSpec can match it: Given must establish the precondition, When must invoke the
production subject at the declared boundary, and Then must observe evidence caused by that action.

```bash
# Verify BEFORE committing
nx run rhino-cli:test:unit
nx run rhino-cli:test:coverage
```

**Author a scenario in the phase that creates its behaviour, or an earlier one — never a later one.**
TickSpec requires a literal, _passing_ binding for every scenario at all times, so behaviour that
does not exist yet cannot be bound truthfully.

## Dependency Status

Core packages are `Argu`, `YamlDotNet`, `FSharp.Analyzers.Build`, and
`G-Research.FSharp.Analyzers`. `deps:audit` scans the transitive set for vulnerabilities; see
[Dependency Bump Stability & Safety Policy](../../repo-governance/development/workflow/dependency-bump-policy.md)
for the bump-review process.

## See also

- Rewrite plan (`rewrite-rhino-cli-to-fsharp`, recoverable from Git): records the F# port and its
  Rust and Go history
- Gherkin specs (shared with the retired Rust and Go binaries):
  [`specs/apps/rhino/cli/behaviours/`](../../specs/apps/rhino/cli/behaviours/)
