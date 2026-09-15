<!-- Knowledge Capture running log — append entries during execution. -->
<!-- Triage every entry (or record the explicit "none" escape) before archival. -->

# Learnings: rewrite-rhino-cli-to-fsharp

## 2026-08-26 — Phase 1: B7 re-measurement documented skip

`benchmark.md`'s B2-B8 re-measurement step could not re-measure **B7** (CI critical path) in either
repository. B7 reads the `build-rhino` job duration from the three most recent green
`pr-quality-gate.yml` runs on `main`, and as of this date `main` in both `ose-public` and
the private sibling still carries the pre-removal `Cargo.toml` (tree-sitter still listed, confirmed via
`git show main:apps/rhino-cli/Cargo.toml | grep -c tree-sitter` returning `1` in both repos) —
this Phase 1 removal has not merged to `main` yet, so no post-removal CI run of that job exists to
sample. B1 through B6 and B8 were successfully re-measured against the post-removal crate in both
worktrees and are recorded in `benchmark.md` without a `†` marker; only B7 keeps its `†` and its
pre-removal Before figure (70.67 s `ose-public`, 88.67 s the private sibling). B7 must be re-measured once
this PR merges to `main` and three green post-merge `pr-quality-gate.yml` runs exist — Phase 10's
verdict step should treat B7 as provisional until then.

**Terminal state**: Discard — narrow, single-PR provisional-measurement note. B7's final
disposition (still provisional, both repos' raw figures) is already recorded in `benchmark.md` and
folded into `tech-docs.md`'s "Phase 10 — Measured Outcome" table and the durable
[rhino-cli-rust-to-fsharp-benchmark.md](../../../docs/explanation/software-engineering/programming-languages/rhino-cli-rust-to-fsharp-benchmark.md)
comparison (both verified present and consistent with the 2026-08-30 Phase 10 entries below). No
separate durable surface needed.

## 2026-08-26 — Phase 1: Size row confirmation

Re-ran Phase 0's exact source-line-count command
(`find apps/rhino-cli/src -name '*.rs' -type f -print0 | xargs -0 cat | awk '...' | wc -l`) in both
worktrees after the tree-sitter removal. Both report **49,460** lines, unchanged from Phase 0 — as
expected, since removing an unreferenced `Cargo.toml` dependency cannot change line counts under
`apps/rhino-cli/src/`. The Before figure in `benchmark.md`'s Size row is left as-is.

**Terminal state**: Discard — a one-off sanity check (line count unchanged after a
dependency-only removal). No generalizable rule; superseded by Phase 10's real source-size
measurement already folded into the same durable comparison cited above.

## 2026-08-26 — Phase 1: publish-mode spike (`local-tmp/publish-spike/`, `ose-public` only)

A throwaway F# console project targeting `net10.0` was created at `local-tmp/publish-spike/` and
exercised the four constructs the real `rhino-cli` binary needs: an `FSharp.Core` `Map`/`Set`
round-trip, a discriminated-union argument parse via `Argu` 6.2.5, a `System.Text.Json`
serialize+deserialize round-trip, and a recursive directory walk over `repo-governance/`. The JIT
build printed all four results and exited 0.

### Finding 1 — F#'s `sprintf`/`printfn` break under NativeAOT

The first AOT publish attempt (before the mitigations below) used `sprintf`/`printfn` to build the
result strings. It published successfully but **crashed at runtime** with
`System.NotSupportedException: ... is missing native code. MethodInfo.MakeGenericMethod() is not
compatible with AOT compilation`, thrown from `Microsoft.FSharp.Core.PrintfImpl`. F#'s printf engine
parses format strings via reflection at first use, which NativeAOT's static analysis cannot resolve.
The fix was to replace every `sprintf`/`printfn` call with F# string interpolation (`$"...{expr}..."`)
and `Console.WriteLine`, which does not go through `PrintfImpl`. This is a real, general finding for
the rewrite: **no wave's F# code may use `sprintf`/`printfn` if NativeAOT is ever adopted**, string
interpolation must be used instead.

### Finding 2 — `Argu` emits AOT/trim warnings and fails at runtime; `System.CommandLine` mitigates it

Publishing with AOT (`-p:PublishAot=true`) for `osx-arm64` produced, verbatim:

```text
~/.nuget/packages/argu/6.2.5/lib/netstandard2.0/Argu.dll : warning IL2104: Assembly 'Argu' produced trim warnings. For more information see https://aka.ms/il2104
~/.nuget/packages/argu/6.2.5/lib/netstandard2.0/Argu.dll : warning IL3053: Assembly 'Argu' produced AOT analysis warnings.
```

`FSharp.Core` itself also produced IL2104/IL3053. Per delivery.md's mitigation instruction, the parse
step was repeated with `System.CommandLine` (`3.0.0-preview.7.26381.103`, the current NuGet version)
in the same spike. Running the published AOT binary confirmed the warning was not noise: Argu's
`ArgumentParser<'T>.Parse` failed at runtime with
`Argu.ArguParseException: ERROR: unrecognized argument: '--name'` — Argu builds its argument spec by
reflecting over the DU case metadata, which NativeAOT's trimming removes by default. The
`System.CommandLine`-based parse of the identical `--name spike --verbose` input succeeded, published
with **zero** trim/AOT warnings of its own, and ran correctly in the AOT binary.
**`System.CommandLine` is the AOT-clean parser; this choice binds
[DD-2](./tech-docs.md#dd-2--reuse-the-gherkin-replace-only-the-harness) if NativeAOT is ever adopted
for the rewrite** — though see the publish-mode decision below, which does not select NativeAOT now.

### Finding 3 — `System.Text.Json`'s default reflection serializer is also disabled under NativeAOT

Not named as a mitigation trigger in delivery.md, but discovered in the same spike: the AOT publish
also emitted, verbatim:

```text
Program.fs(57): Trim analysis warning IL2026: ... JsonSerializer.Serialize<Program.Payload>(...) which has 'RequiresUnreferencedCodeAttribute' can break functionality when trimming application code.
Program.fs(57): AOT analysis warning IL3050: ... JsonSerializer.Serialize<Program.Payload>(...) which has 'RequiresDynamicCodeAttribute' can break functionality when AOT compiling.
```

and the published AOT binary crashed at runtime on the JSON round-trip with:

```text
Unhandled exception. System.InvalidOperationException: Reflection-based serialization has been
disabled for this application. Either use the source generator APIs or explicitly configure the
'JsonSerializerOptions.TypeInfoResolver' property.
```

This is a well-known, documented NativeAOT constraint (reflection-based `System.Text.Json` requires
a source-generated `JsonSerializerContext` per serialized type under full trimming) but delivery.md
names no mitigation for it, unlike Argu. Implementing source-generated JSON contexts for every type
serialized across all thirteen namespaces is a materially larger scope than swapping one argument
parser, and is not attempted in this throwaway spike. For the AOT run used in the startup
measurement below, both the Argu call and the JSON call were wrapped in `try`/`with` so the process
still exits 0 and the remaining constructs (`Map`/`Set`, `System.CommandLine`, directory walk) can be
proven in the same run — this decouples "does the process launch and exit cleanly" from "does every
required construct work", which the raw crash would otherwise conflate.

### Publish outcomes

| Publish mode            | RID         | Result                                                                                           |
| ----------------------- | ----------- | ------------------------------------------------------------------------------------------------ |
| NativeAOT               | `osx-arm64` | Publish succeeded, 11.6 s, 10 MB binary. Argu and default JSON fail at runtime (Findings 2 & 3). |
| NativeAOT               | `linux-x64` | Publish **failed** (cross-OS AOT from macOS) — see verbatim error below.                         |
| Self-contained, non-AOT | `osx-arm64` | Publish succeeded, 2.1 s, 87 MB (`du -sh`). All four constructs work correctly, unmodified.      |
| Self-contained, non-AOT | `linux-x64` | Publish succeeded, 3.95 s, 83 MB (`du -sh`).                                                     |

`linux-x64` NativeAOT verbatim failure (workstation is Apple silicon, matching delivery.md's own
expectation that cross-arch AOT figures cannot be taken from this machine):

```text
error : Symbol stripping tool ('llvm-objcopy' or 'objcopy') not found in PATH. Try installing
appropriate package for llvm-objcopy or objcopy to resolve the problem or set the StripSymbols
property to false to disable symbol stripping.
```

This is a macOS-hosted cross-OS toolchain gap (no Linux `objcopy` available), not evidence against
NativeAOT itself; CI runs on Linux runners and would not hit this specific error. It does mean this
spike cannot produce a Linux AOT startup figure from this machine, which is why the AOT startup
figure below is `osx-arm64` only, consistent with the rest of this plan's benchmarking being run on
this machine.

### Startup measurement (50 runs each, `osx-arm64`, exit code 0 asserted every iteration)

| Binary                                          | Total (50 runs) | Mean per invocation | Failures |
| ----------------------------------------------- | --------------- | ------------------- | -------- |
| NativeAOT                                       | 0.762 s         | **15.23 ms**        | 0/50     |
| Self-contained, non-AOT                         | 10.042 s        | **200.84 ms**       | 0/50     |
| Rust, Phase 0 B5 baseline (`ose-public`)        | 0.562 s         | **11.2 ms**         | 0/50     |
| Rust, Phase 0 B5 baseline (the private sibling) | 0.767 s         | **15.3 ms**         | 0/50     |

Commands used, both run from the repo root:

```bash
# AOT
dotnet publish local-tmp/publish-spike -c Release -r osx-arm64 -p:PublishAot=true -o local-tmp/publish-spike/out-aot
# self-contained
dotnet publish local-tmp/publish-spike -c Release -r osx-arm64 --self-contained true -o local-tmp/publish-spike/out-sc
```

followed by 50 timed invocations of each published binary, asserting exit code 0 on every iteration.
**Timing method note**: this plan's own `benchmark.md` already deviated from the delivery.md-literal
`/usr/bin/time -p` in Phase 0, documenting that `/usr/bin/time -p` "dropped its `real` line on
several runs" and standardizing on Python `time.time()` around `subprocess.run` for every measurement
on this page instead. This Phase 1 startup measurement follows that same established, documented
precedent rather than the literal `/usr/bin/time -p` text, for direct comparability with the Phase 0
B5 baseline it is measured against — both rows in the table above use the identical method.

**Reading these three figures together**: NativeAOT's startup (15.23 ms) is within noise of the Rust
baseline (11.2-15.3 ms) and roughly 13x faster than the self-contained fallback (200.84 ms). If AOT
worked correctly for all four constructs, it would be the clear, easy choice on this axis alone.

### Publish-mode decision

**Selected: self-contained, non-AOT.** Per the order NativeAOT, self-contained, framework-dependent,
NativeAOT is disqualified first: it does not work — out of the box, and even after applying the one
named mitigation (`System.CommandLine` for Argu) — for a second required construct
(`System.Text.Json`'s default reflection serializer), which has no mitigation named in this plan and
whose real fix (source-generated `JsonSerializerContext` for every serialized type, across all
thirteen namespaces) is a materially larger scope decision than this spike is chartered to make.
"Produces a runnable binary" is read here as producing a binary that correctly performs the
constructs the real CLI needs, not merely one that exits 0 after every failing call is caught and
swallowed — the try/with guards above were a **measurement device** to isolate the startup-time
question, not a claim that AOT is fit for purpose as tested.

Self-contained, non-AOT ran all four constructs correctly, unmodified, on both `osx-arm64` and
`linux-x64` publish targets. Its measured startup penalty (200.84 ms vs Rust's ~11-15 ms, roughly
185-190 ms slower per invocation) is real but bounded:
[tech-docs.md DD-1](./tech-docs.md#dd-1--nativeaot-is-preferred-not-mandatory) already costs the
self-contained fallback at "0.478 s per commit and 0.956 s per CI run" using an earlier, smaller
measured delta (47.8 ms) from a simpler test program; this spike's larger 185-190 ms delta, scaled
the same way (10 invocations/pre-commit, 20/CI run per that document), is roughly 1.85-1.9 s per
commit and 3.7-3.8 s per CI run — still small in absolute terms against gate jobs of 22-253 s and a
full CI run of ~380 s, but a materially larger number than DD-1's own headline figures, so it is
recorded here rather than silently inherited. This does not change the decision, since NativeAOT is
disqualified on correctness before startup is weighed, but it corrects the magnitude for whoever
reads DD-1's numbers next to this entry.

**Toolchain consequence**: the selected mode is self-contained, not framework-dependent, so no
`./.github/actions/setup-dotnet` steps are needed in the eight currently-toolchain-free CI jobs — a
self-contained publish bundles the runtime and is equally toolchain-free, per
[tech-docs.md DD-1](./tech-docs.md#dd-1--nativeaot-is-preferred-not-mandatory).

### Cleanup

`local-tmp/publish-spike/` was deleted once the figures above were recorded, per
[Plans & Temporary Files](../../../AGENTS.md#plans--temporary-files) and this phase's own cleanup
acceptance criterion.

**Terminal state**: Routed. The three AOT-incompatibility findings (`sprintf`/`printfn`'s
reflection-based format-string parsing, `Argu`'s trim-incompatible DU reflection vs.
`System.CommandLine`'s AOT-clean alternative, `System.Text.Json`'s reflection serializer requiring a
source-generated `JsonSerializerContext`) are generalizable to any future F#/.NET NativeAOT publish
attempt anywhere in this repo and were not documented anywhere durable — added a new "NativeAOT
Considerations" section to
[`docs/explanation/software-engineering/programming-languages/f-sharp/build-configuration.md`](../../../docs/explanation/software-engineering/programming-languages/f-sharp/build-configuration.md).
The publish-mode decision framework itself (startup ranking, toolchain-free CI shape) already lives
in `tech-docs.md` [DD-1](./tech-docs.md#dd-1--nativeaot-is-preferred-not-mandatory) — verified
present, not duplicated.

## 2026-08-26 — Phase 2: shared-steps mode (decision)

`rhino-cli-fsharp` stays in **shared-steps** mode, matching both existing precedents (Rust
`rhino-cli`, F#/TickSpec `crane-cli`). Three-level mode is not adopted: it would need the
`--unit-dir`, `--integration-dir`, `--e2e-dir`, and `--<level>-report` arguments plus whatever
generates those report files from `dotnet test`, and none of that exists anywhere in this plan
today — adopting it now would leave the target unrunnable. Shared-steps mode's own check (missing
step implementations) is sufficient for every wave this plan schedules; `@covers` markers and
runtime-execution cross-checks are not needed until a future plan explicitly charters three-level
mode with its own argument-wiring steps.

**Terminal state**: Discard — settled, migration-specific architecture decision, per the
plan's own "do not re-litigate" instruction. Not independently generalizable beyond this project's
own Nx target shape (three-level mode's `--unit-dir`/`--integration-dir`/`--e2e-dir` machinery does
not exist anywhere else in this repo either).

## 2026-08-26 — Phase 2: TickSpec fallback protocol

Per [tech-docs DD-2](./tech-docs.md#dd-2--reuse-the-gherkin-replace-only-the-harness) and the risk
table, this is the protocol every wave from Wave A onward must follow:

- **Trigger**: a step cannot be expressed in TickSpec after one honest attempt.
- **Action**: write a plain `xunit.v3` test asserting the same scenario, keeping the scenario
  itself — its Gherkin text in `specs/apps/rhino/behavior/rhino-cli/gherkin/` — unchanged.
  Weakening or deleting a scenario is never the fallback.
- **Recording obligation**: one `learnings.md` entry naming the scenario and the reason the step
  could not be expressed in TickSpec.
- **Auditability**: every fallback test carries a comment naming its feature file and scenario
  title, and `grep -rc 'TickSpec fallback' apps/rhino-cli/src-fsharp/tests/` must equal the number
  of `learnings.md` fallback entries at every wave gate. At Phase 2, both counts are **0** — no
  wave has run yet, so this is the protocol's baseline, not evidence it was exercised. A mismatch
  after a wave lands means a scenario was silently re-implemented rather than deliberately
  re-expressed, and the wave gate must not pass until the counts agree again.

**Terminal state**: Discard — the protocol was defined but never triggered across the
whole migration (`grep -rc "TickSpec fallback" apps/rhino-cli/src/tests/` → 0 hits, confirmed). A
one-off procedural scaffold for a migration that is now complete; no fallback test exists for a
durable surface to point at.

## 2026-08-26 — Phase 2: widening protocol

Recorded before Wave A opens, per delivery.md's own instruction, so six later integration PRs do
not each re-derive it. Two Phase-2-authored artifacts encode "no namespace flipped yet" as the
literal, nonexistent directory name `specs/apps/rhino/behavior/rhino-cli/gherkin/.fsharp-flipped-none`
(confirmed empirically: `specs behavior-coverage validate --shared-steps <nonexistent-dir> apps/rhino-cli/src-fsharp`
reports "0 specs, 0 scenarios, 0 steps — all covered" and exits 0, the same as pointing at a real
empty directory):

- `apps/rhino-cli/src-fsharp/project.json`'s `specs:behavior:coverage` target's `--shared-steps`
  positional argument.
- `repo-config.yml`'s `coverage.projects` `rhino-cli-fsharp` entry's `specs` glob.

**Each wave's integration PR widens both of these by exactly that wave's spec directories** — Wave
A replaces the placeholder with `specs/apps/rhino/behavior/rhino-cli/gherkin/convention` (and the
`repo-config.yml` glob correspondingly), Wave B additionally adds `repo-config`,
`repo-config-validate`, `env`, `env-contract`, and so on through Wave F. Phase 9c widens to the
full tree (`specs/apps/rhino/behavior/rhino-cli/gherkin/**`) and drops the `rhino-cli` entry in the
same commit that deletes the Rust crate — at that point exactly one entry (`rhino-cli-fsharp`)
covers the whole spec tree, matching the pattern every other ported namespace already established.

**Verified wiring, not merely inert**: temporarily pointing the `specs:behavior:coverage` command at
`specs/apps/rhino/behavior/rhino-cli/gherkin/convention` (Wave A's real directory, one un-ported
namespace) against the still-empty `apps/rhino-cli/src-fsharp` produced `ERROR: Found 44 step(s)
without matching step definitions` and exited 1, proving the target is wired rather than inert. The
widening was reverted immediately after the proof; Phase 2 ships with the placeholder.

**Terminal state**: Discard — a per-wave mechanical procedure specific to this
migration's incremental Nx-target/`repo-config.yml` widening. Fully consumed: Phase 9c reverted
`--shared-steps` to its simple two-argument form once F# became the only implementation (see the
Phase 9c entry below). No future recurrence — there is no next wave.

## 2026-08-26 — Phase 2: `deps:audit` reporting-vs-gating proof

Per delivery.md's instruction, `dotnet list package --vulnerable --include-transitive` was proven to
be a reporting command before either Nx project shipped it. A scratch F# console project
(`local-tmp/deps-audit-scratch/`, deleted after this proof) referenced `Newtonsoft.Json` 12.0.1
(GHSA-5crp-9r3c-p9vr, "High" severity) and `dotnet list Scratch.fsproj package --vulnerable
--include-transitive` printed the finding as an `NU1903` warning and **exited 0** — confirming the
command gates nothing on its own.

**The fix**: `apps/rhino-cli/scripts/dotnet-deps-audit.sh` wraps the command, re-running it with
`--format json` and using `jq` to detect any non-empty `vulnerabilities` array under either
top-level or transitive packages across every framework/project in the report; a finding prints the
human-readable table to stderr and exits 1. Re-proven against the same scratch project: the wrapper
exited **1** against the vulnerable reference and **0** once the reference was removed.

**Live-target break-and-restore, both repos**: with the scratch proof done, `RhinoCli.Program.fsproj`
was temporarily edited to reference `Newtonsoft.Json` 12.0.1 (confined to the uncommitted working
tree — no `git add`/`git commit` while broken), `npx nx run rhino-cli-fsharp:deps:audit` was required
to exit non-zero (confirmed), the reference was restored, the same target was re-run and required to
exit 0 (confirmed), `git diff --exit-code -- apps/rhino-cli/src-fsharp/` was required to exit 0
(confirmed), and `git rev-parse HEAD` was confirmed unchanged across the whole sequence in both
repos. All exit codes matched the required shape in both `ose-public` and the private sibling.

**Terminal state**: Discard — the fix is the shipped
`apps/rhino-cli/scripts/dotnet-deps-audit.sh` wrapper itself (confirmed present on disk), already
proven live via break/restore in both this Phase 2 proof and its Phase 9c re-confirmation against
the merged target name. The wrapper is self-documenting; no separate durable-doc write needed for
"reporting commands must be wrapped to gate."

## 2026-08-26 — Phase 2: CI files confirmed unaffected

Per delivery.md's instruction, the reasoning for each of the five named workflow files, none of
which needed a Phase 2 edit:

- `rhino-cli-parity-audit.yml` — diffs `parity-manifest.sha256` between the two repos as an opaque
  file; it does not inspect which paths compose it, so adding `apps/rhino-cli/src-fsharp` to the
  manifest's `BOUNDARY_PATHS` needed no change here.
- `validate-env.yml` — invokes `env validate`, a namespace that stays on Rust at Phase 2
  (`FSHARP_NAMESPACES` ships empty); its `rhino-bin.sh` calls fall straight through the unchanged
  Rust tiers.
- `dependency-vulnerability-audit.yml` — invokes rhino namespaces that also stay on Rust at Phase 2,
  for the same reason; it is unrelated to the new `deps:audit` Nx target the F# project defines,
  which is a different mechanism (an Nx target invoked via `nx run`/`nx affected`, not this
  workflow's own scheduled/dispatch-triggered rhino-cli invocations).
- `_reusable-www-test-local-deploy.yml` and `_reusable-app-test-local-deploy-stag.yml` — both invoke
  rhino namespaces that stay on Rust at Phase 2, for the same reason as the two above.

**Terminal state**: Discard — a one-off confirmation that five named workflow files
needed no Phase 2 edit, reasoned from each file's own invoked namespace. No generalizable rule; the
reasoning is fully reflected in the current (still-unaffected-by-this-reasoning) workflow files
themselves.

## 2026-08-26 — Phase 2: `detect` job's `has-dotnet-projects` mapping

Confirmed already present and unedited in `ose-public`'s `.github/workflows/pr-quality-gate.yml`:
`lang:fsharp | lang:csharp) echo "has-dotnet-projects=true" >> "$GITHUB_OUTPUT" ;;` — `rhino-cli-fsharp`
carries `tag:lang:fsharp`, so this existing mapping already routes it to the `dotnet` job with no
new line added, exactly as delivery.md's acceptance predicted.

**The private sibling is different and needed real work, not confirmation.** Per the delta table at the
top of this file, the private sibling had **no** `has-dotnet-projects` output, **no** `lang:fsharp`
mapping, and **no** `dotnet` CI job at all before Phase 2 — it never carried an F# or C# project.
Phase 2 added all three there: the `has-dotnet-projects` output and its `lang:fsharp | lang:csharp`
case in the `detect` job, and a new `dotnet` job mirroring `ose-public`'s (gated on
`needs.detect.outputs.has-dotnet-projects == 'true'`). This is genuinely new CI surface in
the private sibling, not a like-for-like mirror of an existing job.

**A gap the delta table implied but did not spell out**: the private sibling's `typescript` job excluded
only `tag:lang:rust` (`ose-public`'s equivalent excludes `lang:fsharp`, `lang:csharp`, `lang:rust`,
`lang:dart`). Left as-is, the moment `rhino-cli-fsharp` existed as an affected `lang:fsharp` project,
this job's own `nx affected` would have swept it in and run its targets on a runner installing no
.NET SDK. Fixed by adding `,tag:lang:fsharp` to that job's `--exclude`.

**The private sibling's new `dotnet` job needs `setup-rust`, unlike `ose-public`'s.** `rhino-cli-fsharp`'s
`specs:behavior:coverage`/`specs:structure-validation`/`specs:gherkin-cardinality-validation`/
`governance-*`/`env:validation` targets shell out to `cargo run --manifest-path
apps/rhino-cli/Cargo.toml` directly, mirroring `crane-cli`'s own existing `project.json` (the
established precedent for this shape in this repo). `ose-public`'s `dotnet` job runs on GH-hosted
`ubuntu-latest`, which ships a Rust toolchain preinstalled, so it has never needed an explicit
`setup-rust` step for this. The private sibling's runners are `[self-hosted, linux, ose-self-hosted]`,
which — per this repo's own `gate` job comment — have **no ambient Rust toolchain**. Its new
`dotnet` job therefore adds `./.github/actions/setup-rust` explicitly; omitting it would have made
every one of those five targets fail with "cargo: command not found" the first time an affected
`lang:fsharp` project's `test:quick`/`test:specs` chain ran there.

**The private sibling had no `.config/dotnet-tools.json` or `.config/` directory at all** — no F# project
had ever needed one there. Phase 2 created it (copied verbatim from `ose-public`'s, since it is a
generic tool-version manifest with no repo-specific content: `fantomas` 7.0.5, `dotnet-fsharplint`
0.26.10, `fsharp-analyzers` 0.36.0), so `rhino-cli-fsharp`'s `lint` target's `dotnet tool restore`
step has a manifest to restore from. Verified: `dotnet tool restore` in the private sibling now installs
all three tools successfully.

**The private sibling's `format` job gained a new `needs: build-rhino` dependency edge.** Unlike
`ose-public`'s `format` job, the private sibling's never depended on `build-rhino` — its `rhino-bin.sh`
calls resolved the Rust binary through tier 3 (build on demand) rather than a prebuilt artifact, and
it carried no `RHINO_CLI_BIN` at all. Adding the F# artifact's `download-artifact`/`chmod
+x`/`RHINO_CLI_FSHARP_BIN` wiring there — required for parity with the `format`/`enumerate`/`gate`
three-job list delivery.md names — needed a real `needs: build-rhino` edge first, since downloading
an artifact from a job that has not necessarily finished (or run) is not reliable without one. This
is a genuine, judgment-call CI-topology change in the private sibling only: it adds wall-clock
serialization between `build-rhino` and `format` that did not exist before, with no functional risk
while `FSHARP_NAMESPACES` stays empty. `ose-public`'s `format` job already depended on `build-rhino`
before this plan, so no equivalent change was needed there.

**Terminal state**: Discard — a factual record of new the private sibling CI infrastructure
(the `dotnet` job, `has-dotnet-projects` output, `.config/dotnet-tools.json`, the `format` job's new
`needs: build-rhino` edge), all shipped and self-documenting in the committed
`.github/workflows/pr-quality-gate.yml` and `.config/` files. No separate durable doc needed.

## 2026-08-26 — Phase 2: `apps/rhino-cli/scripts/shadow-diff.sh` was not a new file

Both repos already had a tracked `apps/rhino-cli/scripts/shadow-diff.sh` from the prior Go→Rust
rewrite (`plans/done/2026-05-23__rhino-cli-rust-rewrite/` in `ose-public`), comparing a Go binary
(`apps/rhino-cli/main.go`) against the Rust one. That Go source tree no longer exists in either repo
(`apps/rhino-cli/main.go`: no such file), and nothing else in either repository references this
script by path (`grep -rn 'shadow-diff.sh'` outside `plans/` returns nothing) — it was dead,
orphaned tooling from a completed migration, never cleaned up in a prior phase. **The
File-Impact Analysis in `tech-docs.md` marks this file `[N]` (new); it is actually `[E]` (edited) —
a plan-documentation inaccuracy being recorded here rather than silently corrected upstream.** Phase
2 repurposes the same path for the new Rust↔F# differential runner, replacing the Go-era content
entirely, which is the same tool serving the same purpose for the migration now in progress.

**Terminal state**: Discard — a plan-documentation accuracy correction
(`tech-docs.md`'s File-Impact Analysis marks this file `[N]` rather than `[E]`), scoped to this
plan's own now-archiving documents. Not a generalizable rule.

## 2026-08-26 — Phase 2: publish RID pinned to `linux-x64` (judgment call)

Neither `ose-public`'s `ubuntu-latest` GH-hosted runners nor the private sibling's
`[self-hosted, linux, ose-self-hosted]` runners have their CPU architecture stated anywhere in this
plan or its workflows. `ubuntu-latest` is documented by GitHub as `x64` today, so `-r linux-x64` is
correct there. The private sibling's self-hosted runner architecture is `[Unverified]` from this plan's own
sources — `linux-x64` is used for both repos' `build-rhino` publish step as the reasonable default
for this class of infrastructure, but this is a judgment call, not a grounded fact, and should be
confirmed against the actual self-hosted runner hardware before this PR merges. If the self-hosted
runner is `linux-arm64`, the publish step's `-r` flag needs a matching correction there (and only
there — `ose-public` stays `linux-x64` either way).

**Terminal state**: Discard — the judgment call is empirically resolved: every
the private sibling CI run since Phase 2 has published and executed the `linux-x64` binary successfully on
its self-hosted runner, confirming the assumption was correct. No open question remains.

## 2026-08-26 — Phase 2: `RhinoCli.Program` → `RhinoCli.Cli` reference direction (judgment call)

`tech-docs.md`'s architecture mermaid diagram draws `CLI --> PROG` (i.e., `RhinoCli.Cli` referencing
`RhinoCli.Program`), which would be backwards for a conventional layered CLI: an entry-point `Exe`
project is normally the one referencing the parser layer beneath it, not the reverse, and Argu
parsers have no reason to depend on the process entry point. Phase 2 implements the conventional
direction instead — `RhinoCli.Program` (`Exe`) references `RhinoCli.Cli`, which references
`RhinoCli.Application`, which references both `RhinoCli.Domain` and `RhinoCli.Infrastructure` — on
the judgment that the diagram's arrow direction is an artifact of its left-to-right layout choice
rather than a literal, intended dependency contract. No wave's plan text depends on the literal
arrow direction, so this does not block any later step, but it is recorded here as a deviation from
the tech-docs diagram as drawn.

**Terminal state**: Discard — verified consistent: `tech-docs.md`'s current "Target
layout" mermaid diagram already draws `PROG --> CLI` (the conventional direction this entry chose),
so the documented deviation and the diagram agree. No further action needed.

## 2026-08-26 — Phase 2: `Severity` DU renamed from the Rust source's `Error`/`Warn`

`apps/rhino-cli/src/application/severity.rs`'s two-level scale (`Error`, `Warn`) cannot be ported
case-for-case into `RhinoCli.Domain.Types.Severity`: a case literally named `Error` collides with
`FSharp.Core`'s own `Result.Error`, which the G-Research analyzer's `GRA-UNIONCASE-001` rule
(treated as an error in this project's `lint` target) catches — confirmed by running the analyzer
suite against the initial three-case draft (`Error`/`Warning`/`Info`, the last invented rather than
grounded in the Rust source and corrected here too) before landing on the final two-case
`Blocking`/`Advisory` naming. `RequireQualifiedAccess` alone does not silence the rule; only renaming
the case does. Whichever wave first ports `severity.rs`'s real validators should decide whether
`Blocking`/`Advisory` is the permanent naming or gets revisited then, since Phase 2's choice here was
made for lint compliance on a placeholder type, not as a settled domain-naming decision.

**Terminal state**: Discard — the open question ("is `Blocking`/`Advisory` permanent?")
is resolved by outcome: the naming shipped unchanged through every later wave and is still in use in
`RhinoCli.Domain/src/Finding.fs` (confirmed — `Severity.Blocking`) and `Types.fs`. Settled,
migration-specific.

## 2026-08-26 — Phase 2: placeholder modules avoid executable `let` bindings

`RhinoCli.Infrastructure.Placeholder`, `RhinoCli.Application.Placeholder`, and
`RhinoCli.Cli.RootArgs` were each drafted first with an executable top-level `let` binding (a string
constant, an empty list, and an Argu `IArgParserTemplate` implementation respectively) to prove each
project builds and its `ProjectReference` edges resolve. Running `test:coverage` against that draft
measured **0%** line coverage on all three (Domain's pure DU/record file measured 100%, since type
declarations carry no coverable sequence point) and failed the 90%-line threshold outright — before
any wave had shipped a single real function or test. Each was rewritten to a pure type declaration
(a single-case marker DU, a type alias into `RhinoCli.Domain.Types.Finding`, and a bare DU with the
`IArgParserTemplate` implementation removed, respectively), which restored `test:coverage` to 100%
while still proving the project references are live. The threshold-breaking behavior was re-verified
directly: temporarily adding one deliberately-uncovered function to the Infrastructure placeholder
dropped the measured figure to 0% and turned the target red, then the addition was reverted and the
target was re-verified green — confirming the 90% threshold itself gates correctly, per delivery.md's
own acceptance clause for that step.

**Terminal state**: Discard — a Phase-2-specific bootstrapping technique for
placeholder modules that no longer exist, superseded by real implementations in every later wave. No
lasting subject.

## 2026-08-28 — Phase 6: a stale `target/gate` binary fakes a shadow-diff parity failure

Wave D's integration shadow-diff (`shadow-diff.sh md governance git`) first reported **9 of 60
invocations differing** — every `md mermaid validate` format, every `md audit` format, and
`md links validate -o json`. Every one of those diffs was a pure **ordering** difference: the
finding multisets were provably identical (`sorted(rust) == sorted(fsharp)` over the parsed JSON),
only the emission order differed. The tempting reading — "the F# port sorts its findings and Rust
does not, so fix the F# comparer" — was wrong in both direction and substance.

The real cause is that `shadow-diff.sh` resolves its Rust side to a **prebuilt**
`apps/rhino-cli/target/gate/rhino-cli`, and nothing in the script rebuilds it. The determinism
fixes this wave depends on — `md_files.sort()` in `commands/md_validate_mermaid.rs` (WalkDir
returns raw readdir order) and the insertion-order preservation of `broken_by_category` in
`application/docs/links.rs` — live in the **Rust source**, so a `target/gate` binary published
before those edits still emits filesystem-walk order. The F# side was correct the whole time;
the Rust side under comparison was simply months old.

`cargo build --profile gate --manifest-path apps/rhino-cli/Cargo.toml` (7.8 s, already-warm
cache) took the run to **60 invocations compared, 0 difference(s)** with no source change at all.

**Protocol for every remaining wave's integration step**: rebuild _both_ binaries immediately
before `shadow-diff.sh` — `cargo build --profile gate` **and** `npx nx run rhino-cli-fsharp:build`.
A stale binary on either side produces a mismatch that reads exactly like a real port defect and
invites a "fix" to correct code. The failure is silent in the worst way: the script's own
`RUST_BIN`/`FSHARP_BIN` resolution succeeds, the binary is executable, and the exit codes even
agree (`rust=1 fsharp=1`) — only the ordering betrays it. CI never hits this because
`build-rhino` publishes both artifacts fresh on every run; it is strictly a local-worktree trap.

**Terminal state**: Discard — moot. The "rebuild both binaries before shadow-diff"
protocol has no remaining live subject: Phase 9c deleted the Rust crate entirely, so `shadow-diff.sh`'s
Rust-vs-F# comparison is now permanently unreachable (confirmed by the Phase 9c-follow-up entry
below). The script's own disposition is filed separately as
[`remove-dead-shadow-diff-script`](../../ideas/q2-not-urgent-important/remove-dead-shadow-diff-script.md)
(originally filed to `plans/backlog/`; relocated to `plans/ideas/` on 2026-09-08, because Knowledge
Capture may not write under `plans/backlog/`).

## 2026-08-28 — Phase 6: two Wave D defects only the private sibling's corpus could expose

Wave D's `ose-public` shadow-diff was green at 60/0. The identical run in the private sibling — same
commit, byte-identical sources, both binaries freshly built — reported **9 differences**. Neither
defect was reachable from `ose-public` data, so verifying the wave in one repo alone would have
shipped both.

### 1. `effectiveMermaidLabelLen` counted UTF-16 code units, not Unicode scalars

`Md.fs` measured each normalised line with `String.Length`. .NET counts UTF-16 code units, so an
astral character (any emoji) counts **two**, while Rust's `graph.rs::effective_label_len` uses
`line.chars().count()` and counts **one**. The label
`"📝 Log recovery via link-bounce"` — U+1F4DD plus 29 ASCII characters — is 30 scalars but 31 code
units, so the F# binary emitted a `label_too_long` violation against `--max-label-len 30` that Rust
never produced, and the run totals diverged (`110` vs `109`). Fixed with an explicit
`unicodeScalarCount` that advances by two on `Char.IsSurrogatePair` — exactly `chars().count()`.
`ose-public` has no mermaid node label that both contains an astral character and sits on the
30-character boundary, which is why every prior wave's shadow-diff missed it.

### 2. `wordBudgetMarkdown` rendered a seven-column table where Rust renders four

`Formatters.fs` emitted `| Path | Size | Target | Warn | Fail | Severity | Message |` with
`|------|` separators and bare paths. `governance_validate_word_budget.rs` emits
`| Path | Size (words) | Severity | Message |` with `| --- |` separators and a **backticked**
path. This is invisible whenever the finding list is empty — both sides then print the same
`**PASSED**` line and never render a table at all. `ose-public` has no surface over its word
budget, so the table never rendered there; the private sibling's
`repo-governance/workflows/plan/plan-execution/README.md` (901 words against a 900-word target) is
the single row that made the drift observable.

### The transferable rule

A formatter branch that only renders when findings exist is **untested by a green shadow-diff on a
clean corpus**. Both defects sat in already-merged Wave D PRs whose own shadow-diffs passed. For
every remaining wave, treat the private sibling's run as a first-class gate rather than a mirror-and-
confirm formality, and prefer a unit test that constructs a finding directly over relying on live
repo data to happen to contain one — `WaveDParityRegressionUnitTests.fs` pins both behaviours that
way, so neither can regress in either repo regardless of corpus.

**Terminal state**: Split. The two concrete defects (UTF-16-code-unit-vs-Unicode-scalar
counting; seven- vs. four-column word-budget table) are fixed and permanently regression-tested —
confirmed present at `apps/rhino-cli/src/tests/unit/Steps/WaveDParityRegressionUnitTests.fs` and
`unicodeScalarCount` in `RhinoCli.Application/src/Md.fs`. The generalized "transferable rule" (a
formatter branch that only renders on non-empty findings is untested by a green shadow-diff on a
clean corpus) is a repo-wide testing-methodology point whose natural home is
`repo-governance/development/quality/regression-test-mandate/test-form-by-defect-type.md` —
**deliberately not written into `repo-governance/`**, standing plan constraint (matching the Phase
9e/11a precedent elsewhere in this file).

## 2026-08-28 — Phase 6: FSharpLint hangs on a 25-arm cons-of-string-literal `match`

`nx run rhino-cli-fsharp:test:quick` never terminated after the Wave D flip. The stall was
`dotnet fsharplint lint apps/rhino-cli/src-fsharp/RhinoCli.Cli/RhinoCli.Cli.fsproj`, pinned at
100% CPU for **over an hour** on a 2,394-line project, while the other four projects — including
the 11,899-line `RhinoCli.Application` — each linted in 2–4 seconds.

### What it was not

- **Not a compiler problem.** `dotnet build` of the same project completes in 4 seconds with zero
  warnings. Type inference was never the bottleneck.
- **Not visible in single-file mode.** `dotnet fsharplint lint <file>.fs` on every one of
  `RhinoCli.Cli`'s four sources finished in 2–3 seconds with 0 warnings. Only project mode, which
  supplies type-check results, hangs. A per-file probe is therefore useless for reproducing this.
- **Not a stale `obj/`, a lock, or a cracking failure.** The hang reproduces in a clean `rsync`
  copy of `src-fsharp/` with `bin/`, `obj/`, and `dist/` excluded.

### The bisect

Reverting `RhinoCli.Cli` to its `origin/main` state in that scratch copy lints in **6 seconds**.
Restoring Wave D's `Formatters.fs` alone (194 → 814 lines) still lints in 6 seconds. Restoring
Wave D's `Dispatch.fs` alone (877 → 1,538 lines) reproduces the hang. Inside `Dispatch.fs` the
sole structural change of that shape is `route`'s opening `match argvList with`, which Wave D grew
from 13 to **25 arms**, each of the form
`| "governance" :: "readme-index" :: "validate" :: rest -> Some "…", rest`.

### The fix and the measurement

Holding the same command paths as data — a `routeTable: (string list * string) list` plus a
`matchRoute` that strips the first matching prefix — takes the same project from **>60 minutes to
7 seconds**, and the whole `rhino-cli-fsharp:lint` target to 42 seconds. Behaviour is unchanged:
`shadow-diff.sh md governance git` reports 60 invocations compared, 0 differences, in both repos,
and the 761 unit plus 5 integration tests pass in both.

### The transferable rule

FSharpLint's project-mode analysis is super-linear in the arm count of a `match` over
cons-of-string-literal patterns, and the knee sits somewhere between 13 and 25 arms. Waves E and F
add roughly twenty more command paths between them; had `route` kept its original shape, each
subsequent wave would have made the lint gate slower until CI timed out on a change that looks
completely innocent in review. **Any argv-shaped dispatch in this port stays data-driven.** More
generally: when a lint or analysis step in this repo appears to hang, time `dotnet build` on the
same project first — a fast build against a stalled analyser localises the problem to the analyser
immediately, and the per-file probe that seems like the obvious next step will exonerate the guilty
file.

**Terminal state**: Split. The concrete fix (data-driven `routeTable`/`matchRoute` in
`RhinoCli.Cli/src/Dispatch.fs`) is shipped and confirmed present. The generalized FSharpLint tooling
gotcha (project-mode analysis is super-linear in cons-of-string-literal match-arm count) is a
rhino-cli-lint-specific fact whose natural home is a new
`repo-governance/development/quality/code/fsharp-cli-linting.md` — the F# analogue of the existing
`rust-cli-linting.md`, itself already on this plan's Phase 9e "would need updating, not touched"
list above — **deliberately not written into `repo-governance/`**, standing plan constraint.

## 2026-08-28 — Phase 6: `dotnet fsharp-analyzers` is a silent no-op locally

`rhino-cli-fsharp:lint` runs two commands: `dotnet fsharplint` and then the G-Research
`dotnet fsharp-analyzers` sweep. On this workstation the second one **prints nothing and exits 0
regardless of the code**, so a green local `nx run rhino-cli-fsharp:lint` says nothing about the
analyzer half of the same target. CI, running the identical command line, reported

```text
RhinoCli.Application/src/Md.fs(2769,38): Error GRA-TYPE-ANNOTATE-001 :
Please annotate your type when using the `string` function.
```

for `sb.Append(Regex.Escape(string c))` inside `globToRegex`, fixed by writing
`string<char> c`. `ANALYZERS_PATH` resolves correctly here
(`~/.nuget/packages/g-research.fsharp.analyzers/0.22.0/analyzers/dotnet/fs`) and the tool is in
`.config/dotnet-tools.json`, so this is not a missing-install — the CLI simply produces no
diagnostics locally.

### The transferable rule

**The local lint gate is strictly weaker than the CI lint gate for F#.** Treat a green local
`lint` as covering FSharpLint only. Because `--treat-as-error` makes the analyzer sweep stop at
its first finding, one CI round-trip surfaces one violation, so batch-check by inspection before
pushing: any new `string x` application needs `string<'t> x`, and the other twelve
`--treat-as-error` rules (`GRA-STRING-00{1..4}`, `GRA-UNIONCASE-001`, `GRA-VIRTUALCALL-001`,
`GRA-JSONOPTS-001`, `GRA-DISPBEFOREASYNC-001`, `GRA-IMMUTABLECOLLECTIONEQUALITY-001`,
`GRA-LOGARGFUNCFULLAPP-001`, `GRA-LOGTEMPLMISSVALS-001`, `GRA-INTERPOLATED-001`) deserve the same
read-through on every wave's new code.

**Terminal state**: Discard-with-defer. The concrete violation is fixed (`string<char>
c` in `Md.fs`, confirmed). The "local lint gate is strictly weaker than CI for F#" tooling gotcha
belongs in the same would-be `repo-governance/development/quality/code/fsharp-cli-linting.md` as the
entry above — **deliberately not written into `repo-governance/`**, standing plan constraint.

## 2026-08-28 — Phase 6: the coverage gate is a per-module minimum, not a repo total

`rhino-cli-fsharp:test:coverage` runs coverlet with `/p:Threshold=90
/p:ThresholdType=line`. Coverlet's `ThresholdStat` defaults to **`minimum`**, so the bar applies to
**every module independently** — `RhinoCli.Domain`, `RhinoCli.Infrastructure`,
`RhinoCli.Application`, and `RhinoCli.Cli` each need 90% line coverage on their own. Reading the
"Total" row and concluding the gate passes is wrong twice over: a total of exactly 90.00% still
failed here because `RhinoCli.Application` sat at 89.65%.

### What Wave D did to it

Wave D added roughly 1,300 lines to `RhinoCli.Cli` — the new dispatch leaves and their formatters —
and no `RhinoCli.Cli` unit tests, because `shadow-diff.sh` was treated as the coverage story. It
is not one: shadow-diff proves byte-identity for the code paths a live corpus happens to take, and
coverlet counts lines. The result was `RhinoCli.Cli` at 44.73% line coverage and the total at
80.87%, failing CI on a PR whose local `test:quick` was green — `test:quick` does not run
`test:coverage`.

### Where the uncovered lines actually were

Three clusters, all the same shape — code that only runs when something is **wrong** or when a
flag is **passed**, neither of which a clean repository produces:

1. Every formatter's findings-present arm (headers, table shapes, per-row rendering). The Wave D
   seven-column word-budget table shipped through a green shadow-diff for exactly this reason.
2. Every dispatch leaf's body, reachable only by driving `route` against a fixture repository.
   `DispatchUnitTests.fs`'s existing `runCaptured` + `newTempDir` harness makes this cheap.
3. `md mermaid validate`'s **warning** renderers. This repository's committed diagrams stay inside
   every default threshold, so `mermaidWarningDetail` and the JSON `warningNode` builder never ran
   on live data at all.

Closing all three took 78 tests (761 → 839) and moved `RhinoCli.Cli` to 91.08%,
`RhinoCli.Application` to 90.65%, total to 90.82%.

### The transferable rule

**Every wave's flip PR must land Cli-level unit tests with the wave's dispatch and formatter
code**, not after CI rejects it. Waves E and F add far more Cli surface than Wave D did, and the
current margins are thin — 1.08 points on `RhinoCli.Cli`, 0.65 on `RhinoCli.Application`. Run
`npx nx run rhino-cli-fsharp:test:coverage` locally before pushing any wave; `test:quick` will not
tell you. When it fails, read `apps/rhino-cli/src-fsharp/tests/unit/coverage.json` per file rather
than guessing — the fully-uncovered functions in it are the cheapest lines to win, and they name
themselves.

**Terminal state**: Discard-with-defer. The concrete gap is closed (78 new tests,
`RhinoCli.Cli`/`RhinoCli.Application` both above 90%, confirmed via the shipped `test:coverage`
target passing at 90.82% total with every module ≥90%). The generalized "coverlet's `ThresholdStat`
defaults to per-module minimum, not total" CI-convention fact belongs in
`repo-governance/development/infra/ci-conventions/coverage-threshold-rationale.md` and/or
`repo-governance/development/quality/three-level-testing-standard/coverage-enforcement-and-threshold-rationale.md`
— **deliberately not written into `repo-governance/`**, standing plan constraint.

## 2026-08-29 — Phase 9a: spec disposition enumeration and verdict table

Enumerating command: `grep -rlEi 'cargo|clippy|\brust\b' specs/apps/rhino/behavior/rhino-cli/gherkin/`,
starting from `cargo-target-share.feature` per the plan step. Confirming command:
`grep -rl '"lang:rust"' --include=project.json .` returns exactly one hit —
`apps/rhino-cli/project.json` — so no other project in either repo carries `tag:lang:rust`; every
retain verdict below rests on that result, not on an assumption.

**The literal grep is not sufficient on its own.** Three of `gate-binary-resolution.feature`'s four
scenarios contain none of `cargo`/`rust`/`clippy` in their Gherkin text (they say "the ambient
sweeper removed target/", "the prebuilt gate-profile binary in target/", "a path that does not
exist" — never the literal words), yet all four scenarios exist solely to test
`rhino-bin.sh`'s Rust-resolution-tier rebuild mechanics
[Repo-grounded — `apps/rhino-cli/src-fsharp/tests/unit/Steps/GateSteps.fs`, which drives the real
shim and asserts on `cargo build --profile gate`/`target/gate/rhino-cli`]. A second, broader search
(`grep -rniE "target/gate|CARGO_TARGET_DIR|ambient sweeper|gate-profile binary|resolver shim|rhino-bin"`)
was run precisely because the plan's own prescribed grep would have silently missed these three.
Applying only the literal instruction here would have left a whole feature file's worth of
soon-to-be-dead coverage untouched.

### Per-file verdict table

| File                                  | Scenario                                                                                                                                                           | Verdict                                                               | Reason                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `system/cargo-target-share.feature`   | 17 of 18 (all except the one below)                                                                                                                                | **Retain**                                                            | Generic `doctor` crate-discovery/target-sharing/pruning capability, exercised entirely through synthetic temp-directory fixtures [Repo-grounded — `DoctorSteps.fs`, `Directory.CreateDirectory`/`Path.GetTempPath` fixtures, never `apps/rhino-cli`'s real crate]. `discoverCrates` walks `apps/*`/`libs/*` for any `Cargo.toml` with no hardcoded crate list, so the mechanism activates for any future top-level Rust crate; it is not rhino-cli-specific even though rhino-cli was its only real-world subject historically.                                                                                                                                                                                                                                                                                                                                                                           |
| `system/cargo-target-share.feature`   | "Rust test targets ignore inherited Git process state"                                                                                                             | **Rename, not retire**                                                | The Gherkin prose still says "Rust"/"the Rust test or coverage command", but the step definition already reads `apps/rhino-cli/src-fsharp/project.json` and asserts every `dotnet test` invocation is prefixed with `env -u GIT_DIR -u GIT_WORK_TREE -u GIT_COMMON_DIR` [Repo-grounded — `DoctorSteps.fs` lines 109, 405-406, 736-740]. This scenario already tests live F# behavior under stale Rust-era prose. 9a's edit renames the scenario title and its Given/When/Then text to describe the F# git-state-scrub guard; the assertion and its production code are untouched.                                                                                                                                                                                                                                                                                                                         |
| `repo-config/data-driven.feature`     | all 8 scenarios                                                                                                                                                    | **Retain**                                                            | None of the eight Scenario bodies mention Rust/cargo/clippy; only the Feature-level narrative line ("So that the Rust source stays identical") does. Wording fix only — drop the language-specific qualifier, since the data-driven design principle holds identically for F#.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `system/doctor.feature`               | "doctor compares rustc against the toolchain that builds"                                                                                                          | **Retire**                                                            | Backed by a hardcoded path, not generic discovery [Repo-grounded — `Doctor.fs:1476`, `Path.Combine(repoRoot, "apps", "rhino-cli", "rust-toolchain.toml")`]. 9c deletes that exact file and no other `rust-toolchain.toml` exists anywhere in the repo (confirmed by `find`), so this check has zero remaining subject.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `system/doctor.feature`               | "A pinned Rust toolchain without lint components is reported as a warning"; "A pinned Rust toolchain declaring only one lint component names just the missing one" | **Retain**                                                            | Backed by `rustToolchainManifests` [Repo-grounded — `Doctor.fs:1041`], a generic workspace-root-plus-`apps/*`/`libs/*` scan with no hardcoded path — the same shape as `discoverCrates`. The step definitions happen to write their synthetic fixture file under `apps/rhino-cli/`'s directory inside a temp repo skeleton, which is incidental to fixture authoring, not a functional dependency on that project existing for real.                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `gate/gate-binary-resolution.feature` | all 4 scenarios (whole file)                                                                                                                                       | **Retire**                                                            | All four exist to test `rhino-bin.sh`'s Rust resolution tiers (build-on-missing, rebuild-on-stale, `RHINO_CLI_BIN` override, invalid-override fallback), which 9c's own "simplify `rhino-bin.sh`: `FSHARP_NAMESPACES` and the Rust resolution tiers are both dead once every namespace is F#" step deletes outright, collapsing the shim to one resolution path. None of the four survive that collapse as worded. **Follow-up for 9c, not authored here**: the simplified script may still warrant fresh, F#-only-tier scenarios for "explicit override takes precedence" and "invalid override falls through to discovery" — the resolution-order comment already promises this behavior for `RHINO_CLI_FSHARP_BIN` — but the exact tier semantics and variable name only exist once 9c actually ships the simplification, so authoring that coverage belongs to 9c, not to this retire-only sub-phase. |
| `gate/gate-execution.feature`         | "Rust CI target families run serially"                                                                                                                             | **Retire**                                                            | Given clause is "the real Rust quality gate" — the `rust` job in `pr-quality-gate.yml`, which 9d deletes entirely. No replacement subject.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `gate/gate-execution.feature`         | "The MSRV pre-install covers the toolchain name cargo-hack requests"                                                                                               | **Retire**                                                            | Tests `setup-rust/action.yml`'s `cargo-hack` MSRV pre-install step, whose only real consumer is `compat:min-version` [Repo-grounded — `setup-rust/action.yml` line 13, "used by rhino-cli compat:min-version"] — a target 9c deletes outright — and whose own discovery glob (`apps/*/Cargo.toml libs/*/Cargo.toml`, one level deep) matches zero files repo-wide once `apps/rhino-cli/Cargo.toml` is gone, since the `ayokoding-www` course-example crates nest far deeper than that glob reaches.                                                                                                                                                                                                                                                                                                                                                                                                       |
| `gate/gate-execution.feature`         | "Gate group jobs consume a prebuilt binary"                                                                                                                        | **Retain**                                                            | Negative assertion ("runs no cargo install command", "no Rust toolchain setup") about gate CI jobs downloading a prebuilt artifact rather than compiling. Remains straightforwardly true and worth protecting post-9c.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `gate/gate-emission.feature`          | "Rhino CLI kind renders a resolver shim invocation"                                                                                                                | **Retain**                                                            | Negative assertion ("contains no cargo run substring") about the generated command shape. Remains valid regardless of what runs inside the shim.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `gate/gate-validation.feature`        | "The gate job's Doctor bootstrap must use the resolver shim"                                                                                                       | **Retain (not a grep hit — checked because it names `rhino-bin.sh`)** | Tests that a generated command points at the shim path, independent of the shim's internal resolution tiers.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `README.md` (gherkin tree index)      | table rows and grand total                                                                                                                                         | **Edit, not a scenario**                                              | `cargo-target-share.feature`'s row stays at 18 (17 retained + 1 renamed, none deleted). `gate-binary-resolution.feature`'s row is removed entirely (file deleted, 4→0). `doctor.feature` and `gate-execution.feature` rows drop by 1 and 2 respectively. Grand total drops by 7: 525 → 518.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |

Net effect: **7 scenarios retire** (1 from `doctor.feature`, 4 from `gate-binary-resolution.feature`
— the whole file — 2 from `gate-execution.feature`), **1 scenario is renamed** (not retired) in
`cargo-target-share.feature`, and one Feature-level narrative line is reworded in
`data-driven.feature`. `apps/rhino-cli/scripts/deny-check.sh`'s discovery glob and `Doctor.fs`'s
hardcoded `apps/rhino-cli/rust-toolchain.toml` rustc-mismatch check both become dead production
code once 9c/9d land — flagged here for 9c/9d to remove, since 9a's own scope is specs-only.

**Terminal state**: Discard — fully embodied in the actual, current `specs/` tree
(scenarios retired/renamed exactly per the verdict table above) and in the Gherkin-tree README's own
updated counts. The grep-blind-spot methodology point is a one-off aside for this specific
retirement sweep, not stated in the entry as an independently generalizable rule.

## 2026-08-29 — Phase 9a follow-up: orphaned Rust cucumber step implementations

9a's retire/rename edits above updated the Gherkin `.feature` files and the F# (TickSpec) step
definitions, and verified `npx nx run rhino-cli-fsharp:specs:behavior:coverage` (the F#-side
coverage target) exits 0 with 518 scenarios covered. That verification was incomplete: it never ran
`npx nx run rhino-cli:specs:behavior:coverage` (the Rust-crate-side coverage target, a distinct
target backed by a distinct cucumber-rs harness that binds the exact same `.feature` files). 9b's
first push attempt in both repos failed pre-push with `rhino-cli:test:quick` reporting "Found 22
orphan step implementation(s)" — Rust `#[given]`/`#[when]`/`#[then]` functions in
`apps/rhino-cli/tests/{doctor,gate_specs}.rs` whose literal step text no longer matched anything
after 9a deleted or renamed the corresponding Gherkin steps.

**Root cause**: both the retired-scenario cleanup and the "fix the class not the site" grep-blind-
spot lesson from 9a's enumeration above applied equally to the Rust side, but only the F# side was
actually checked. The Rust crate has its own independent cucumber-rs step-definition inventory,
completely separate from TickSpec's — during this migration's transition period (Rust crate still
present, deleted only in 9c) every Gherkin-level retire/rename touches **two** step-definition
surfaces, not one, and both must be swept.

**Fix**: deleted the 22 orphaned step-impl functions plus their exclusively-used `World` struct
fields and now-dead helper functions (`rhino_bin_shim_path`, `real_prebuilt_rhino_cli`,
`path_without_cargo_directory`, `RESOLVER_SHIM_PROBE_ARGS`, `step_block`, `run_block`,
`rust_report_line`), while preserving helpers still shared with retained scenarios (`repo_root`,
`action_steps`, `run_block_from_step`, `gate_job_block`) — verified by grepping every symbol's full
caller list before deleting it, not just the deleted function's own body. Also separately caught and
fixed a related miss: `cargo-target-share.feature`'s renamed step ("Nx launches the dotnet test
command") only had its F# binding (`DoctorSteps.fs`) updated in 9a; the Rust binding in
`apps/rhino-cli/tests/cargo_target_share.rs` still carried the old step text and needed the same
one-line rebind. Both fixes regenerate the parity manifest (all three `.rs` files are inside the
byte-identity boundary) and are verified via a full local `npx nx run rhino-cli:test:quick` (not
just the F# target) passing clean in both repos before pushing.

**Compounding navigational error, unrelated to the above**: three consecutive `git push` attempts in
ose-public silently pushed to the wrong remote ref (`rhino-fsharp-wave-e-p7-17`, an already-merged,
closed-PR branch left over from an earlier Wave E sub-phase) instead of the actual open-PR branch
(`rhino-fsharp-wave-e-p7-18`, PR #366) — `git push origin <name>` resolves `<name>` against a
same-named **local** branch when the working tree is checked out on a _different_ local branch, so
the stale local branch's old tip kept getting force-published rather than the checked-out HEAD.
Every pre-push hook run still executed against the correct (checked-out) working tree, so all prior
verification was valid; only the destination ref was wrong. Caught by `git ls-remote` showing an
unexpected old SHA after a "completed" push, cross-checked against `gh pr view <number>
--json headRefName` to find the actual tracked branch name. Lesson: after any push, verify the
**branch name being pushed matches `git branch --show-current`**, not just that the push exited 0 —
especially in a repo carrying many old per-sub-phase local branches from the same plan.

**Terminal state**: Discard. The dual-step-definition-surface root cause is
migration-transition-specific and moot now that the Rust crate is deleted (Phase 9c). The
git-push-wrong-branch navigational error is a one-off operator mistake, self-caught by existing
verification discipline (`git ls-remote` / `gh pr view --json headRefName`); not automated via a
hook change, since detecting it generically risks false positives on legitimate multi-branch
pushes.

## 2026-08-29 — Phase 9c: crate deletion and Nx rewire — decisions and proofs

**Nx-project merge** (item 3): merged `rhino-cli-fsharp` into `rhino-cli`. Rationale: post-retirement
there is one physical F# tree, and CI already invoked both names for the same artifact (`rhino-cli`
via `nx affected` sweeps, `rhino-cli-fsharp` via named build/test steps) — exactly the duplication
Phase 9 exists to remove. `apps/rhino-cli/src-fsharp/project.json` is deleted; its `build`,
`install`, `typecheck`, `lint`, `test:unit`, `test:integration`, `test:coverage`, `deps:audit`
targets now live in `apps/rhino-cli/project.json`. `repo-config.yml`'s two `coverage.projects`
entries (`rhino-cli`, `rhino-cli-fsharp`) are collapsed into one `rhino-cli` entry with the full
`specs/apps/rhino/behavior/rhino-cli/**` glob — the per-wave incremental-widening rationale that
justified two entries no longer applies once F# is the only implementation.

**Source-tree flatten** (item 11): `apps/rhino-cli/src-fsharp/` moved to `apps/rhino-cli/src/` via
`git mv` (86 files, all recognized as renames). `fsharp-source-root: apps/rhino-cli/src/` — the
literal value every downstream reader (9d's formatter-glob step, Phase 10's build/source-size
measurements) must derive from `test -d` against its own tree, never by reading this file from
the private sibling (it carries no copy of this plan). `tech-docs.md` §Target layout's `TBD` is replaced
with this same path in the same commit as this entry.

**Coverage-scope widening** (item 4): `rhino-cli:specs:behavior:coverage`'s `--shared-steps` argument
reverted to the simple two-argument form (`specs/apps/rhino/behavior/rhino-cli/gherkin
apps/rhino-cli/src`), replacing the itemized per-subdirectory list `rhino-cli-fsharp` carried during
the migration. Actual run: **518 scenarios, all covered** (69 specs, 2112 steps) — delivery.md's
stated acceptance figure of 524 is stale: 9a retired 7 scenarios (525 → 518) after that figure was
written into the plan. 518 is the correct, freshly-measured total, not a discrepancy to chase.

**`deps:audit`** (items 6-7): re-pointed at the existing `apps/rhino-cli/scripts/dotnet-deps-audit.sh`
wrapper (already built in Phase 2, already proven to turn a reporting-only `dotnet list package
--vulnerable` into a real gate) rather than inlining a bare `dotnet list` command — the wrapper _is_
the correct implementation of item 6's intent, not a deviation from it. Re-confirmed the live
break-and-restore proof against the merged `rhino-cli:deps:audit` target name (the prior proof at
Phase 2 ran against `rhino-cli-fsharp:deps:audit`, a name that no longer exists post-merge): recorded
`git rev-parse HEAD` (`754b1ef5`); temporarily added `<PackageReference Include="Newtonsoft.Json"
Version="12.0.1" />` to `RhinoCli.Program.fsproj`, confined to the uncommitted working tree;
`npx nx run rhino-cli:deps:audit` exited **1**; removed the reference; re-run exited **0**;
`git diff --exit-code -- apps/rhino-cli/src/RhinoCli.Program/RhinoCli.Program.fsproj` exited 0; `git
rev-parse HEAD` still `754b1ef5`. All four conditions matched the required shape.

**NuGet license-allowlist and source-pin controls — accepted regression** (item 8): **not restored**.
`deny.toml`'s `[licenses]` (MIT/Apache-2.0/ISC/BSD-2-Clause/BSD-3-Clause/Unicode-3.0 allowlist) and
`[sources]`/`[bans]` (deny unknown registries/git sources) controls have no F#-side equivalent and
none is added here. Investigated first: `dotnet list package --include-transitive --format json`
carries no license field at all (confirmed by running it against `RhinoCli.Program.fsproj` directly —
the JSON schema has only `id`/`requestedVersion`/`resolvedVersion`, nothing else), so a license check
would require parsing each resolved package's `.nuspec` out of the local NuGet cache — a bespoke
scanner with no existing repo precedent (the same five other F# projects item 7 already names ship
no license check either). Building and proving that scanner to this plan's own break-restore
standard is disproportionate net-new scope for a crate-retirement sub-phase, not a like-for-like
port of anything that existed. A repo-committed `nuget.config` pinning `packageSources` alone was
considered and rejected too: no project anywhere in this repo (`ose-be`, `organiclever-be`) carries
one, so adding it only for `rhino-cli` would be a new, inconsistent, unproven pattern that — alone,
without the license check — does not satisfy item 8's "restore" branch anyway (the branch requires
both together). **Decision, dated and attributed**: accepted as a permanent regression by the
executing agent under this plan's standing autonomous-execution authorization, 2026-08-29. Both
dropped controls are named here so a future reader does not mistake silence for oversight. See
`tech-docs.md`'s new DD recording this.

**`compat:min-version` removal + `global.json` fix** (item 9): target deleted (asserted a Rust MSRV
floor that cannot survive the crate). Added `apps/rhino-cli/global.json` (SDK `10.0.204`,
`rollForward: latestMinor`), matching `apps/ose-be/global.json` and `apps/organiclever-be/global.json`
verbatim — placed at `apps/rhino-cli/` (parent of `src/`) rather than repo-root, since `.NET`
resolves `global.json` by walking upward only and this is the narrowest ancestor that actually covers
`apps/rhino-cli/src/`, matching the sibling apps' own convention (their `global.json` sits at their
own app root too, not repo-root). Verification nuance: `dotnet --version` from inside
`apps/rhino-cli/src/` prints `10.0.300` **both with and without** this file present, because the only
installed SDKs are `10.0.107`/`10.0.201`/`10.0.300` and `rollForward: latestMinor` happily accepts
`10.0.300` as satisfying a `10.0.204` floor — the same is true today for `ose-be`, confirmed by the
same check. A version-string match is therefore not a meaningful proof in this environment. Proved
resolution reaches the new file a different way instead: temporarily set the pin to an unsatisfiable
`99.0.0`/`rollForward: disable`, ran `dotnet --version` from `apps/rhino-cli/src/`, and the SDK-not-
found error explicitly printed `global.json file:
.../apps/rhino-cli/global.json` — proving the ancestor-walk reaches this exact file from that
directory. Restored the real pin immediately after; `git diff --exit-code` clean.

**`rhino-bin.sh` simplification** (item 13): `FSHARP_NAMESPACES` and the three-tier Rust resolution
(`RHINO_CLI_BIN`, `<target>/gate/rhino-cli`, `cargo build --profile gate`) both deleted — one
resolution path remains (`RHINO_CLI_FSHARP_BIN` override → `apps/rhino-cli/src/dist/rhino-cli-fsharp`
→ `dotnet run` fallback), same tier order and env-var name the F# side already used during migration,
so no CI-facing rename was needed beyond the `src-fsharp` → `src` path swap. **Scope note**: 9a's
retire-verdict table flagged that the simplified shim "may still warrant fresh, F#-only-tier
scenarios" for the two behaviors `gate-binary-resolution.feature` used to cover before its full
retirement. Considered and declined: that note itself hedges ("may"), it is not one of 9c's 13 named
checklist items, and authoring a new `.feature` file plus TickSpec bindings for a resolver shim is
net-new test-authoring scope beyond "delete/simplify", not a like-for-like port. Not silently
dropped — recorded here as a deliberate scope decision, not an oversight.

**Incidental fixes caused directly by the flatten**, not separately itemized in 9c but required for
correctness: `Parity.fs`'s `boundaryPaths` trimmed from 8 entries (`src`, `src-fsharp`, `tests`,
`Cargo.toml`, `Cargo.lock`, `project.json`, `LICENSE`, the specs dir) to 4 (`src`, `project.json`,
`LICENSE`, the specs dir) — the four removed either no longer exist or are now covered by `src`.
`Dispatch.fs`'s unrecognized-invocation error string changed from `"rhino-cli-fsharp: ..."` to
`"rhino-cli: ..."` (user-facing output; the `-fsharp` qualifier only ever made sense while a parallel
Rust binary existed). Three test files had hardcoded `src-fsharp` literal paths that broke under
`dotnet test` once the move landed (`HarnessSteps.fs`, `DoctorSteps.fs`'s `fsharpProjectJsonPath` —
which additionally needed one more `../` once `project.json` moved up a level to the merged file —
and the two gate/parity step files' `prebuiltFsharpCli` fixture paths); all fixed and the full
`rhino-cli:test:unit` suite re-run clean (1203/1203) after each. `apps/rhino-cli/scripts/shadow-diff.sh`
kept, not deleted — `tech-docs.md`'s file-tree annotates it `[N] Phase 2` with no `[D]` at any phase,
unlike `deny-check.sh`'s explicit `[D] Phase 9c`, a deliberate distinction the plan draws between the
two migration-era scripts; only its now-stale `src-fsharp` default path and `rhino-cli-fsharp:build`
hint were corrected, its Rust-comparison logic is left untouched pending 9e's own grep-sweep verdict
on it (it matches that sweep's enumerating grep, so it gets a verdict there, not invented here).

**Full verification after all of the above**: `npx nx run rhino-cli:typecheck` (0 warnings),
`rhino-cli:lint` (fantomas/fsharplint/fsharp-analyzers all clean, after fantomas auto-formatted one
touched file), `rhino-cli:test:unit` (1203/1203 passed), `rhino-cli:specs:behavior:coverage` (518
scenarios, all covered), `rhino-cli:deps:audit` (clean pre- and post- break/restore proof above).
`.github/workflows/pr-quality-gate.yml` updated for the same `src-fsharp` → `src` and
`rhino-cli-fsharp:build` → `rhino-cli:build` renames; `actionlint` exits 0.

**Addendum — a genuine regression the first `test:quick` run caught**: `ParityManifestSteps.fs`'s
`Given a tracked Rhino CLI parity boundary` step seeds a fully synthetic, self-contained fixture
repo with its own fabricated file list (`apps/rhino-cli/tests/parity.rs` among them) — independent
of `Parity.fs`'s real `boundaryPaths`, but written to mirror its shape at authoring time. Trimming
`boundaryPaths` (above) without updating this fixture's file list left `apps/rhino-cli/tests/parity.rs`
outside the boundary the real compiled binary now enforces, so "The manifest covers tests as well as
source" failed with "test drift unexpectedly passed" — the edited fixture file was silently outside
every boundary entry, not silently inside one. Fixed by moving the fixture's test file into the
`src` boundary (`apps/rhino-cli/src/tests/parity.rs`), consistent across the `Given`/`When`/`Then`
steps. Caught by running the actual `dotnet test` output rather than trusting a backgrounded shell
command's reported exit code — the first background run's exit code read as 0 only because the
command piped through `tail`, masking `dotnet test`'s real non-zero exit (the same class of bug as
[[feedback_pipeline_exit_code_masked_by_tail]]); the real failure was only visible by reading the
captured output text. Re-run without a masking pipe afterward, exit code 0, 1203/1203 passed.

**Terminal state**: Split. Most of this entry discards clean — one-off migration-mechanical
decisions (Nx-project merge, source-tree flatten, `deps:audit` re-pointing, `compat:min-version`
removal + `global.json`, `boundaryPaths` trim), all fully embodied in shipped, verified code/config.
Item 8's NuGet license/source-control regression is already routed and verified at
`docs/explanation/software-engineering/licensing/dependency-compatibility.md` (confirmed present,
cites this exact decision verbatim). The addendum's pipe-into-`tail`-masks-exit-code gotcha is
already a recognized, tagged pattern (`[[feedback_pipeline_exit_code_masked_by_tail]]`); the
concrete `ParityManifestSteps.fs` fixture-drift bug is fixed. The one piece that does NOT discard:
the `rhino-bin.sh` simplification's own "Scope note" declined authoring fresh F#-only-tier resolver
scenarios, and nobody picked that up in any later phase — real, live, zero-scenario-coverage
behavior, code-homed per the code-routing rule. Filed as
[`rhino-bin-resolver-shim-coverage`](../../ideas/q2-not-urgent-important/rhino-bin-resolver-shim-coverage.md)
(originally filed to `plans/backlog/`; relocated to `plans/ideas/` on 2026-09-08, because Knowledge
Capture may not write under `plans/backlog/`).

## 2026-08-29 — Phase 9c follow-up: three findings surfaced only once external projects flipped to F

Pushing the 9c commit surfaced three problems the crate-deletion commit itself couldn't have caught
— each because deleting `apps/rhino-cli/Cargo.toml` was the FIRST time something other than
rhino-cli's own Nx targets exercised the F# binary in anger.

**1. Every other project's Nx target still hardcoded `cargo run`.** Grepping the whole repo found
50 files invoking `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- ...`
directly — never routed through `rhino-bin.sh` — across every other app/lib's `project.json`,
`package.json`'s `generate:bindings`/`doctor`/etc. scripts, and one `.claude/hooks/` self-test.
These were never migrated during Wave A-F because that work only ever touched rhino-cli's own
targets and `rhino-bin.sh`'s dispatch. Fixed 28 real invocation sites (26 `project.json` + root
`package.json` + `guard-pre-commit-env.test.sh`) by substituting
`dotnet run --project apps/rhino-cli/src/RhinoCli.Program/RhinoCli.Program.fsproj --`, preserving
the `../../` relative-path variant e2e projects with a `cwd` use. Deferred (not a mechanical path
swap): `block-env-file-access.test.sh`'s mention is an inert string literal never executed, and
`shadow-diff.sh`'s Rust-vs-F# comparison is now permanently unreachable since there is no Rust
binary left to compare against — both need their own disposition decision in 9d/9e.

**2. A genuine F# parity bug in `specs e2e-coverage validate`, hidden until now.** Once those 28
sites ran the real F# binary, three previously-green e2e projects (`ayokoding-www-fe-e2e`,
`ose-be-e2e`, `organiclever-be-e2e`) started reporting already-baselined scenarios as brand-new
gaps. Root cause: `Dispatch.fs`'s `globFeatureFiles` resolves the default `--project-dir` (`"."`)
via `Path.Combine(".", pattern)`, which — like Rust's own `PathBuf::join` — literally produces a
`./`-prefixed string; but Rust's `glob` crate silently drops that prefix from its match results,
while `Directory.GetFiles` preserves whatever `root` string it's handed verbatim. A `Feature` path
carrying the stray `./` never equality-matched the checked-in baseline's un-prefixed entries. Proven
against the still-on-disk pre-deletion Rust binaries (`apps/rhino-cli/target/{release,gate}/rhino-cli`)
byte-for-byte on the exact same fixture inputs before writing the fix. This CLI-argument-resolution
layer was never covered by the port's own test suite (`SpecsSteps.fs` drives `diffGaps`/
`scanFixmeDir` directly, bypassing `Dispatch.fs` entirely) or by Wave E/F's shadow-diff (which only
ever ran rhino-cli's own spec directory through both binaries) — a coverage gap in the ORIGINAL
Rust test suite too, not something the port introduced. Fixed by stripping a leading `./` in
`globFeatureFiles`; added a new subprocess-based Gherkin scenario + step binding (the other 13
`e2e-coverage.feature` scenarios test the pure `Specs.fs` core only) proven red against the
pre-fix `Dispatch.fs`, green after.

**3. `governance readme-index validate`'s "FAILED: N finding(s)" text is a red herring — faithfully
so.** Chased what looked like a `governance-readme-index` pre-push gate failure (419 pre-existing
"unannotated" findings across `specs/`/`docs/`, already documented in `repo-config.yml` as deferred
debt with `fail-kinds: [missing, orphan, ghost]` explicitly excluding "unannotated") for far longer
than warranted before checking `rhino-bin.sh gate run --surface=pre-push --group=markdown` in
isolation, which showed `governance-readme-index    PASS` the whole time — confirmed identical to
the original Rust (`format_text`/`format_json` compute their "FAILED"/`status` purely from
`findings.is_empty()`, independent of `has_failing_finding`'s `fail_kinds` filtering, which only
gates the real exit code). `gate run` executes every declared gate regardless of individual outcome
and reports each one's PASS/FAIL on its own summary line; a check's own verbose "FAILED" text
mid-stream is not that signal. The actual blocker was a different, later gate
(`parity-manifest`, genuinely stale from the pre-commit prettier pass reformatting `project.json`
after the manifest had already been generated) — recorded as
[[feedback_rhino_gate_text_failed_not_gate_failure]].

Verification: full `rhino-cli:test:unit` (1204/1204, including the new scenario),
`specs:behavior:coverage` (519 scenarios), and all three previously-failing e2e projects'
`specs:e2e:coverage` targets re-run clean. Landed as three follow-up commits on
`rhino-fsharp-wave-e-p7-18` (`97641d50a`, `1832a0aee`, `264e32db9`, `4a3c127b3`), pushed and
confirmed via `git ls-remote`.

**Terminal state**: Split. (1) The 28 `cargo run` → `dotnet run` invocation-site fixes
are fully shipped (confirmed — zero live invocation sites remain outside `plans/done/**` history).
(2) The `globFeatureFiles` leading-`./` fix is shipped (confirmed in `Dispatch.fs`) and permanently
regression-tested via a dedicated subprocess-based Gherkin scenario + step binding, per the entry.
(3) The `governance readme-index` "FAILED" text vs. gate PASS/FAIL semantics is routed inline as a
new dated addendum on `docs/reference/sdlc-gate-standard.md`, matching that page's own established
addendum convention (see the 2026-08-09/2026-08-13 notes already there).

## 2026-08-29 — Phase 9d: CI teardown

**Course-example count**: `find . -name '*.rs' -not -path './node_modules/*' -not -path
'./apps/rhino-cli/*' -not -path './**/target/*' | wc -l` → **198**, matching the delta table's
recorded fact. Non-zero, so the restrictions around `setup-rust`/`format-verify-rustfmt` in
`repo-config.yml` bind: both retained unchanged.

**`compat:min-version` cross-check**: the plan text asserts "the `rust` job is the only caller of
`nx affected -t test:coverage`" and "nothing else invokes [`compat:min-version`]" — the second claim
does not hold literally. `grep -rl '"compat:min-version"' --include=project.json .` returns **26**
other files, every one an `echo` no-op placeholder (e.g. `"compat:min-version: no standard
min-version floor for F#"`). Checked both mandatory-target governance docs
(`nx-targets/mandatory-targets-all-projects-six-and-required.md`'s Mandatory-Six and
Required-Where-Applicable tables) — `compat:min-version` appears in neither, so these 26 echoes are
pre-existing, out-of-plan-scope debt, not a currently-enforced convention this plan must honor.
Deleting the `compat-min-version` CI job is still correct: its only-ever-meaningful check
(`cargo hack check --rust-version` on `rhino-cli`) is gone, and every remaining invoker is a no-op
that cannot fail, so no real coverage is lost. Filed as a note here rather than a repo-governance
edit — the docs are already accurate; the 26 stale stubs are a separate, unopened cleanup.

**Per-file `setup-rust` disposition** (the four workflows outside `pr-quality-gate.yml`, each
provisioning Rust only to build `rhino-cli` from source):

| File                                       | Verdict                                                                 |
| ------------------------------------------ | ----------------------------------------------------------------------- |
| `validate-env.yml`                         | Removed; replaced with `setup-dotnet` (runs `rhino-cli:env:validation`) |
| `dependency-vulnerability-audit.yml`       | Removed; `setup-dotnet` already present, no addition needed             |
| `_reusable-www-test-local-deploy.yml`      | Removed; replaced with `setup-dotnet` (`specs-gate` job)                |
| `_reusable-app-test-local-deploy-stag.yml` | Removed; replaced with `setup-dotnet` (`specs-gate` job)                |

**Elixir re-homing**: the `rust` job's `RHINO_REQUIRE_ELIXIR: "1"` env and `erlef/setup-beam@v1` step
moved onto the `dotnet` job verbatim — that job is now the only place `rhino-cli`'s `test:quick`
(and therefore the Elixir formatter-wrapper `.fs` tests) runs, per Wave F's flip to `lang:fsharp`.
`test:coverage` needed no re-homing — the `dotnet` job already ran it for every `lang:fsharp`/
`lang:csharp` project, `rhino-cli` included, since Wave F.

**`format-verify-fantomas` reach**: `repo-config.yml`'s glob (`*.fs`, `affected-file-type` scope) is
extension-only, not path-scoped, so the `src-fsharp` → `src` flatten needed no repo-config change.
Proved live: appended a badly-indented line to a tracked `.fs` file, ran
`gate run --surface=ci --group=formatting-verify`, confirmed `format-verify-fantomas FAIL` and the
group failing, then restored the file and confirmed `git diff --exit-code` clean.

**Workflow-wide sweep**: `rust` job deleted (its `if: needs.detect.outputs.has-rust` guard went with
it); `has-rust` removed from `detect` (6 occurrences: output, two echoes, the `lang:rust` case, the
job's own guard, and the `has-ts`/`has-rust` analogy comment — reworded to `has-ts` alone);
`compat-min-version` job deleted outright (see above); `specs-structure` swapped `setup-rust` for
`setup-dotnet`. Post-edit `pr-quality-gate.yml` carries exactly one `setup-rust` (the `format` job,
retained for the 198 course-example files) and zero `has-rust`/`clippy` occurrences. `actionlint`
exits 0 on every touched workflow file.

**Terminal state**: Discard — migration-mechanical CI teardown, fully shipped and
self-documenting in `.github/workflows/pr-quality-gate.yml`. The one flagged loose thread (26-27
stale `compat:min-version` echo stubs — reconfirmed at 27 today) is filed as
[`remove-stale-compat-min-version-stubs`](../../ideas/q1-urgent-important/remove-stale-compat-min-version-stubs.md)
(originally filed to `plans/backlog/`; relocated to `plans/ideas/` on 2026-09-08, because Knowledge
Capture may not write under `plans/backlog/`).

## 2026-08-29/30 — Phase 9d follow-up: CI's floating SDK surfaced a real analyzer gap, then a real `GATE_CHANGED_BASE` leak bug

**SDK drift**: `apps/rhino-cli/global.json` pins `10.0.204`; the local dev machine has `10.0.300`
installed; `.github/actions/setup-dotnet/action.yml` resolves the floating channel `10.0.x` via
`actions/setup-dotnet@v5`, landing on whatever the latest patch is on the runner that day
(`10.0.400` at the time of this entry). All three differ, and the F# compiler's type inference for
the bare `string` operator is sensitive to this: `G-Research.FSharp.Analyzers` rule
`GRA-TYPE-ANNOTATE-001` ("annotate your type when using the `string` function") fired in CI on
`Formatters.fs`/`Dispatch.fs` call sites that never flagged locally, even pinning the exact same
analyzer version (0.22.0, already pinned repo-wide).

**First fix attempt failed**: annotating the _let-binding_ the `string` result flows into (e.g.
`let whole: int64 = nanos / scale`) does not satisfy this rule — it still flags the generic `string`
call itself, regardless of downstream annotations. Confirmed by a second identical CI failure after
that fix. **Working fix**: eliminate the `string` operator entirely in favor of `.ToString(...)`.
For numeric types, this must be `.ToString(CultureInfo.InvariantCulture)`, not bare `.ToString()` —
F#'s `string` operator formats numerics with invariant culture, and bare `.ToString()` uses the
current culture, which would have been a silent, locale-dependent break in Rust-parity byte-identical
output. A single `char` result may use plain `.ToString()` (culture-insensitive). Same CI sweep also
converted six single-argument `String.StartsWith`/`.EndsWith` calls in `Gate.fs` to the explicit
`StringComparison.Ordinal` overload for `GRA-STRING-001`/`002` — also strictly more correct for
Rust parity, since Rust's string methods are always byte-exact.

**The `gh run rerun --failed` trap**: once the analyzer fix landed, a different test —
`GateExecutionSteps`'s "Path-gated gates still fire when a trigger path is only deleted" — failed on
that same CI run (`isSuccess` true but `was-run.txt` never created, i.e. the gate was silently
skipped because `triggerMatches` saw no changed paths). Rerunning via `gh run rerun --failed`
reproduced the identical failure, which looked like proof of a deterministic bug. It wasn't:
**`gh run rerun --failed` does not rebuild upstream jobs** — `build-rhino`'s artifact from the
original run is reused verbatim by the dependent `dotnet` job, so the "second" failure was the same
compiled binary being exercised twice, not two independent trials. A genuinely fresh run (new
commit, or `gh run rerun` **without** `--failed`, which does rebuild everything) is the only way to
get an independent sample.

**Investigation before realizing this**: the scenario's own logic was read line-by-line
(`changedPaths` → `mergeBasePaths` → `changedPathsFromBase` → `triggerMatches` → the `PathGated`
dispatch branch in `runAtRootWithOnlyAndMessageFile`) and found correct by inspection. Reproduction
was attempted locally (macOS, passed every time, filtered and full-suite) and in a Docker container
built to match the CI runner exactly — Ubuntu 24.04, git 2.55.0 (installed via the `ppa:git-core/ppa`
PPA to get past Ubuntu 24.04's stock 2.43.0), dotnet 10.0.400 — cloning the worktree at the exact
failing commit and running both the filtered test and the full 1204-test suite unfiltered. It passed
cleanly every time. A scoped, single-gate-id diagnostic (`gate.Id = "path-gated-check"`, printing
`changedPathsResult`/`triggerMatches` via the CLI's own `write`, surfaced through the test's
assertion message) was committed, pushed, and — critically — the CI run it produced also passed. A
second **fresh** rerun (no `--failed`, forcing a new `build-rhino` artifact) of the same commit also
passed. Two independent fresh builds, zero reproductions; the earlier "two failures" was one real
failure plus one artifact-reuse replay of it. The diagnostic commit was reverted
(`git revert --no-edit`, verified byte-identical to the pre-diagnostic tree via
`git diff <before> <after>` returning empty) rather than kept, since there appeared to be nothing
left to diagnose — that verdict, written up as "CI-runner-level flakiness, no root-cause fix
needed" and committed to this file, was **wrong**: the very next CI run on that same "nothing to
fix" commit failed again with the identical symptom, proving the bug was real and genuinely
intermittent rather than an artifact-reuse mirage. General lesson —
[[feedback_verify_before_asserting_state]]: two clean fresh reruns is weak evidence for an
intermittent failure; treat an unreproduced CI-only failure as unresolved, not disproven, until the
mechanism is understood, not merely until reruns stop failing.

The diagnostic was re-applied and progressively enriched (full pipeline trace across `runGit`,
`changedPathsFromBase`, `mergeBasePaths`, and `changedPaths`, gated behind a
`RHINO_GATE_TRIGGER_DEBUG=1` env toggle so it wouldn't pollute other tests' output) and captured a
real failure on the next CI run. Root cause: `.github/workflows/pr-quality-gate.yml` sets
`GATE_CHANGED_BASE` in the workflow-level `env:` block
(`format('origin/{0}', github.base_ref)` on `pull_request` events) — a GitHub Actions
workflow-level `env:` block applies to **every** job and step in the workflow, not just the
`gate run --surface=ci` call sites it was written for. That makes `GATE_CHANGED_BASE=origin/main`
ambiently present in the `.NET quality gate` job's `dotnet test` invocation too. The
`GateExecutionSteps` fixture for this scenario deliberately creates a branch named `origin/main` as
test setup, so `commitResolves repoRoot "origin/main"` spuriously succeeds inside the test's own
sandboxed repo. `changedPaths`'s `PrePush` dispatch read this CI-only env var unconditionally
regardless of surface, so `explicitBase` resolved to `Some "origin/main"` and the match fell into
the `Ci`-shaped `changedPathsFromBase` path — using a "changed vs. `origin/main`" diff instead of
the `PrePush`-correct `mergeBasePaths` — which found no changed paths for the deletion-only trigger
and the gate silently skipped. Whether this happened on a given CI run depended on runner
env-var propagation timing/caching, which is why it looked intermittent rather than deterministic.

Confirmed with an on-demand **local** reproduction (no CI cycle needed): exporting the same variable
before running the exact test reproduces the failure byte-for-byte —

```bash
GATE_CHANGED_BASE=origin/main dotnet test \
  apps/rhino-cli/src/tests/unit/RhinoCli.UnitTests.fsproj \
  --filter "FullyQualifiedName~GateExecutionSteps"
```

**Fix** (commit `608b3895b`): `changedPaths` in `Gate.fs` now only consults `GATE_CHANGED_BASE` for
the `Ci` surface; `PrePush` always falls through to `mergeBasePaths` regardless of whether that env
var happens to be set in the ambient environment. This is a genuine correctness/safety gap beyond
the CI symptom: any developer or script with `GATE_CHANGED_BASE` left over in their shell (e.g.
copy-pasted while debugging CI) would have had `rhino-cli gate run --surface=pre-push` silently skip
every path-gated gate, with no error or warning.

**Conclusion**: real defect in `Gate.fs`, not flakiness — fixed at the root cause. No skip/xfail was
applied (the test is unchanged from its original, fully-asserting form). Verified locally before
pushing: full 1204-test suite green, fantomas clean, fsharplint clean, and the leak scenario
re-tested both with and without the simulated ambient `GATE_CHANGED_BASE` present. Lasting
artifacts: this entry, the `changedPaths` surface-scoping fix, and the corrected understanding of
both `gh run rerun --failed`'s artifact-reuse semantics and workflow-level `env:` blocks' blast
radius for future incidents.

**Terminal state**: Split. The concrete correctness fix is shipped with its own
durable in-code decision record — see the doc comment directly above `changedPaths` in
`apps/rhino-cli/src/RhinoCli.Cli/src/Gate.fs` (confirmed present, states the PrePush/Ci
surface-scoping rule verbatim) plus the `GateExecutionSteps` regression test. The two investigative
CI-methodology facts (`gh run rerun --failed` reuses upstream job artifacts rather than rebuilding
them; a workflow-level `env:` block applies to every job, not just its intended call sites) are
generalizable CI-debugging knowledge whose natural home is
`repo-governance/development/quality/ci-blocker-resolution/the-investigation-process-steps-1-4.md` —
**deliberately not written into `repo-governance/`**, standing plan constraint. The analyzer
type-annotation fixes (`.ToString(CultureInfo.InvariantCulture)`, `StringComparison.Ordinal`) are
shipped in `Formatters.fs`/`Gate.fs`.

## 2026-08-30 — Phase 9e: descriptive documentation sweep (ose-public)

Enumerating command per the plan step:
`grep -rlE 'rhino-cli[^.]{0,120}(Rust|cargo)|(Rust|cargo)[^.]{0,120}rhino-cli' docs repo-governance
AGENTS.md CLAUDE.md README.md .claude/skills`. Scope is deliberately narrower than "every mention of
Rust" — files documenting Rust generically (the AyoKoding course-content style guide, general
platform language guidance) are out of scope unless they co-locate the word with `rhino-cli`.

### Per-file verdict table

| File                                                                                                                                                                                                                           | Verdict                                                                   | Reason                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/rhino-cli/README.md`                                                                                                                                                                                                     | **Rewrite**                                                               | Whole file was Rust-era (Cargo/cargo/clap/cucumber-rs); rewritten against current `project.json`, `HelpText.fs`/`Dispatch.fs`, `.fsproj` NuGet refs, `global.json` SDK pin.                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `docs/reference/system-architecture/components.md`                                                                                                                                                                             | **Edit**                                                                  | C4 L3 heading "(Rust CLI Tool)"→"(F# CLI Tool)" (missed on first pass, caught by the re-grep convergence check below); C4 L4 section + "only Rust project" claim (already false generically — organiclever-be/ose-be/crane-cli/fsharp-crane-core/fsharp-env-loader are also F#) rewritten.                                                                                                                                                                                                                                                                                                                                                      |
| `docs/reference/system-architecture/technology-stack.md`                                                                                                                                                                       | **Edit**                                                                  | Merged standalone "Rust CLI Tools" subsection into "F# CLI Tools" with a ported-from-Rust historical note; fixed one "(Rust)" label on the link-validation bullet.                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `docs/reference/system-architecture/applications.md`                                                                                                                                                                           | **Edit**                                                                  | rhino-cli entry Language/Status/mermaid label updated with historical note. Left the fictional "AyoKoding CLI [Container: Rust]" pedagogical example untouched — no real ayokoding-cli app exists, it is an invented illustration, out of scope.                                                                                                                                                                                                                                                                                                                                                                                                |
| `docs/reference/system-architecture/ci-cd.md`                                                                                                                                                                                  | **Correct as-is**                                                         | Zero Rust/cargo mentions found. CI is described generically via the gate-registry mechanism; already fixed, likely by a prior 9b/9c/9d sub-phase. Deviates from the plan's expectation that this file needed an edit.                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `.../c4-architecture-model/nx-workspace-visualization.md`                                                                                                                                                                      | **Edit**                                                                  | Tree comment + two mermaid diagram instances (`[Container: Rust]`→`[Container: F#]`). Fictional AyoKoding CLI example left untouched, same reasoning as `applications.md`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `.../licensing/dependency-compatibility.md`                                                                                                                                                                                    | **Edit**                                                                  | Table row rewritten citing the plan's own `learnings.md` item 8 decision: no F#-side equivalent to `cargo-deny`'s license allowlist, accepted as a permanent regression, not invented as a new claim.                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `docs/reference/platform-bindings.md`                                                                                                                                                                                          | **Edit**                                                                  | Converter path corrected to current `RhinoCli.Application/src/Harness.fs`; "Rust integration tests" → "TickSpec step definitions".                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `docs/reference/sdlc-gate-standard.md`                                                                                                                                                                                         | **Edit**                                                                  | `(Rust, Python)` example → `(F#, TypeScript)` (0 Python projects exist repo-wide); parity-manifest source-identity table + prose corrected to current top-level paths; new dated addendum appended below the existing historical verification-pass table, following that table's own established convention (see the pre-existing "Dispatch-mechanism note") of not rewriting history in place.                                                                                                                                                                                                                                                 |
| `docs/reference/monorepo-structure.md`                                                                                                                                                                                         | **Edit**                                                                  | Largest rewrite: rhino-cli migration bullet (Go→Rust→F#), full "App Structure" tree section replaced with the real current F# tree (verified via `git ls-files apps/rhino-cli`), Cargo.toml example → `.fsproj` example. Left untouched: tag-prefix placeholders, "no Rust library exists today" (already true), generic libs/ categorization, generic Rust/F# comparison bullets — none of these claim rhino-cli is Rust.                                                                                                                                                                                                                      |
| `docs/reference/project-dependency-graph.md`                                                                                                                                                                                   | **Edit**                                                                  | "self-contained Rust application" → "F# application... NuGet"; migration note extended with the Rust→F# leg.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `.claude/skills/ci-standards/SKILL.md` (+ `.agents/` mirror)                                                                                                                                                                   | **Edit**                                                                  | Table row "CLI app (Rust)"→"(F#)"; `test:unit`/`test:integration` overlap prose rewritten after verifying the current F# `test:integration` project is genuinely disjoint (not a Rust-era duplicate) and still unwired from CI. Regenerated via `npm run generate:bindings` ("1 skill file(s) mirrored"), diff-verified.                                                                                                                                                                                                                                                                                                                        |
| `docs/explanation/software-engineering/programming-languages/README.md`                                                                                                                                                        | **Edit**                                                                  | Quick-decision table, Platform Guidance bullets, Rust intro sentence, and Current-Language-Usage table rewritten using the doc's own pre-existing ✅/📋 vocabulary — Rust demoted to "Retained — AyoKoding course content only".                                                                                                                                                                                                                                                                                                                                                                                                                |
| `.../programming-languages/typescript/README.md`                                                                                                                                                                               | **Edit**                                                                  | Directory-tree comment + merged the standalone "Rust: rhino-cli, crane-cli" bullet into the F# bullet (also fixing crane-cli's pre-existing Rust mislabeling).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `docs/how-to/setup-development-environment.md`                                                                                                                                                                                 | **Rewrite (structural, not cosmetic)**                                    | Discovered via `package.json`/`Doctor.fs` that `doctor` is itself now an F#/.NET program, so .NET SDK — not Rust — is the toolchain load-bearing for a fresh `npm install`'s doctor check (same "postinstall discards exit code" failure mode Rust used to own). Setup-path bullets, Quick Start, and "Step 4" rewritten around .NET; a new narrow "Editing AyoKoding's Rust course content?" subsection preserves the rustup install for that one remaining local use. Did not hand-duplicate the GPG-verified Linux .NET install script — pointed to `npm run doctor -- --fix` instead. Version Reference table's two dead Rust rows removed. |
| `.claude/skills/swe-developing-applications-common/reference/checker-validation-steps.md`                                                                                                                                      | **Correct as-is**                                                         | "tool not project" pattern — cites `rhino-cli test-coverage validate` as a checker for `cargo-llvm-cov` coverage of some _other_ Rust project, not a claim that rhino-cli itself is Rust.                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `docs/explanation/software-engineering/programming-languages/rust/*` (14 files)                                                                                                                                                | **Correct as-is, series stays ACTIVE**                                    | Only one file in the series (`build-configuration.md`) matches the enumerating grep at all, and it is the same "tool not project" pattern. 198 real `.rs` files still exist under `apps/ayokoding-www/content/` (confirmed via `find`), so the series is not retired, not marked historical, and not touched — it genuinely still governs real, active Rust course content.                                                                                                                                                                                                                                                                     |
| 22 files under `repo-governance/` matching the grep (including the plan's own two named targets, `development/quality/code/rust-cli-linting.md` and `workflows/infra/development-environment-setup/phase-7-rust-ecosystem.md`) | **Deliberately NOT edited — deviation from the plan's literal checklist** | Standing user constraint for this plan, given verbatim: _"jangan diubah rules apa pun ya, lebih ke pengecualian untuk plan ini aja"_ (don't change any rules at all — an exception for this plan only) and _"@repo-governance/ gak boleh ada yang berubah"_ (nothing under repo-governance/ may change). This constraint outranks the plan's own 9e checklist line items that named two of these files. Recorded here rather than silently skipped.                                                                                                                                                                                             |

### Fix-the-class convergence check

Re-ran the identical enumerating grep across `docs .claude/skills` after all edits above. Zero
remaining hits outside the two confirmed-correct "tool not project"/historical-labeled classes
already covered in the table (`checker-validation-steps.md`, and the historical-labeled sentences
in `dependency-compatibility.md`, `programming-languages/README.md`,
`setup-development-environment.md`, `project-dependency-graph.md`, `sdlc-gate-standard.md`,
`technology-stack.md` — each individually re-inspected via `grep -noE` to confirm the matched text
is properly historical, not a live "rhino-cli is Rust" claim). The `components.md` C4-L3-heading
miss (caught only by this re-grep, not by the first authoring pass) is the concrete argument for
always running this convergence step rather than trusting the first pass.

### Discovered-but-deferred: `ci-standards/SKILL.md` coverage-threshold table

While editing the Coverage Thresholds table's "90% | organiclever-be, CLI apps, Rust libs" row, a
direct swap to "F# libs" would have introduced a _new_ false claim — verification showed
`fsharp-crane-core`/`fsharp-env-loader` are actually 95%, not 90%; `organiclever-be`/`ose-be` are
actually 80%, not 90%; `crane-cli` is 95%, not 90%. Fixed minimally by dropping "Rust libs" outright
rather than substituting an equally-wrong replacement, leaving "90% | organiclever-be, CLI apps" —
which matches the row's pre-existing (and separately inaccurate) wording. The
organiclever-be/CLI-apps misclassification itself is pre-existing and unrelated to the Rust→F# port;
flagged here as a discovered gap, out of scope for 9e, not fixed.

### Repeat in the private sibling

Per the plan's own instruction, 9e is authored separately in the private sibling rather than copied — its
own enumerating grep and its own per-file verdict table are expected to produce a different file
list, and that difference is stated here rather than reconciled.

### `md links validate` baseline (pre-existing, out of scope)

`apps/rhino-cli/scripts/rhino-bin.sh md links validate` exits 1 with 531 broken links repo-wide.
Every source file in the output is an archived `plans/done/**` doc (stale anchors into other
archived docs, unrelated to Rust/rhino-cli). The one hit naming a file this sweep touched
(`apps/rhino-cli/README.md#environment-variables`, referenced from
`plans/done/.../delivery.md`) was already broken before this session's rewrite — confirmed via
`git show HEAD:apps/rhino-cli/README.md | grep -i environ`, which shows the old README never had
that heading either. 9e introduces zero new broken links; the 531-count baseline is pre-existing
link-rot in archived plan docs and belongs to `docs-link-checker`'s domain, not this sweep's.

**Terminal state**: Routed — this entry IS the record of already-executed routing.
Every cited file (`components.md`, `technology-stack.md`, `applications.md`, `ci-cd.md`,
`nx-workspace-visualization.md`, `dependency-compatibility.md`, `platform-bindings.md`,
`sdlc-gate-standard.md`, `monorepo-structure.md`, `project-dependency-graph.md`,
`ci-standards/SKILL.md`, `programming-languages/README.md` and `typescript/README.md`,
`setup-development-environment.md`) already carries the edit — spot-verified above (Phase 10's
benchmark link, the licensing table row, and the F#/Rust rows in `programming-languages/README.md`
all confirmed present). The 22 `repo-governance/` files in the verdict table (including
`rust-cli-linting.md` and `phase-7-rust-ecosystem.md`) are **deliberately not edited — standing plan
constraint**, exactly as this entry itself already states. No further action; the two
discovered-but-deferred doc-accuracy gaps (coverage-threshold table, pre-existing link rot) remain
correctly out of scope, as this entry itself already records.

## 2026-08-30 — Phase 9e: descriptive documentation sweep (the private sibling)

Authored fresh in the private sibling, not copied from `ose-public` — the plan's own instruction
anticipates the two repos' file lists differing, and here they differ structurally: the private sibling
keeps a real, unrelated Rust backend (`coralpolyp-be`), so this sweep could not be a blanket
"Rust → F#" replace — it had to preserve Rust as `✅ Active` while adding net-new F# entries
alongside it.

### Edited (10 files)

| File                                                                          | Fix                                                                                                                                                                                                                                                                                            |
| ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.claude/skills/ci-standards/SKILL.md` (+ `.agents/skills/` mirror)           | `rhino-cli` description updated to note the 2026-08-30 Rust→F# port; corrected `test:integration` claim — it exists (`Steps/PreCommitHookSteps.fs`, one scenario) but isn't wired into any CI job                                                                                              |
| `docs/explanation/software-engineering/licensing/dependency-compatibility.md` | appended a dated addendum blockquote below the historical 2026-04-04 table (table itself untouched) noting the Cargo→NuGet ecosystem switch and the 4 current MIT-licensed package refs                                                                                                        |
| `docs/explanation/software-engineering/programming-languages/README.md`       | Rust bullet/table-row narrowed to `coralpolyp-be` only; new F# bullet/table-row added for `rhino-cli (ported from Rust 2026-08-30)` — first F# entries this file has ever had                                                                                                                  |
| `docs/reference/code-coverage.md`                                             | section renamed "F# Projects", tool corrected to coverlet.msbuild (`/p:CollectCoverage=true /p:Threshold=90 /p:ThresholdType=line`), format corrected to `coverage.json`, noted MSBuild enforces the threshold inline rather than going through `rhino-cli test-coverage validate`'s LCOV path |
| `docs/reference/platform-bindings.md`                                         | `convert_permission` (`converter.rs`) → `convertPermission` (`Harness.fs`); "Add Rust integration tests" → "Add TickSpec step definitions"                                                                                                                                                     |
| `docs/reference/system-architecture/applications.md`                          | `Rust + Clap` → `F# + Argu` in the C2 diagram node                                                                                                                                                                                                                                             |
| `docs/reference/system-architecture/ci-cd.md`                                 | corrected a description of a nonexistent `GitCommands` enum (cases "Lockfile"/"Parity") to the real mechanism: `git`'s only leaf is `git lockfile sync`, `parity` is a separate top-level namespace                                                                                            |
| `docs/reference/system-architecture/components.md`                            | rewrote heading/diagram/responsibilities: fictional "docs validate-links"/"java validate-annotations" subcommands replaced with verified-real "md validate-links"/"git lockfile sync"; "Clap command tree" → "Argu command tree"                                                               |
| `docs/reference/system-architecture/deployment.md`                            | `[cargo build]` → `[dotnet publish]`, bullet notes the port date                                                                                                                                                                                                                               |
| `docs/reference/system-architecture/technology-stack.md`                      | `Rust + Clap`/Cargo/cargo-llvm-cov → `F# + Argu`/dotnet publish/coverlet.msbuild; `docs validate-links (Rust)` → `md validate-links (F#)`                                                                                                                                                      |

### Correct as-is (2 files)

- `checker-validation-steps.md` — "tool not project" pattern: cites rhino-cli as a coverage-CHECKING
  tool for other projects, not itself Rust.
- `docs/explanation/plan-domain-parity-decisions.md` — quotes an OLD `package.json` script
  (`cargo run --manifest-path apps/rhino-cli/Cargo.toml...`) verbatim as a historical decision
  record; rewriting it would falsify history, not correct an error.

### Repo-specific divergence: Rust stays Active

Unlike `ose-public` (Rust fully retired repo-wide except the AyoKoding course-content series),
the private sibling has `coralpolyp-be`, a real independent Rust backend. Both
`programming-languages/README.md` edits above had to _narrow_ the existing Rust row/bullet rather
than delete it, and add new F# row/bullet alongside — net addition, not substitution.

### Two extra accuracy bugs caught in passing

Found while doing the narrower "is rhino-cli Rust" sweep, adjacent to text already being rewritten,
so fixed as small bonus corrections rather than separate scope:

1. `components.md`'s C4 diagram and `technology-stack.md`'s Quality Tools bullet both named a
   "`docs validate-links`" subcommand that never existed under that name — the real, current leaf
   is `md validate-links`. `components.md` also named a fictional "java validate-annotations"
   subcommand with no implementation anywhere in `Dispatch.fs` — replaced with the verified-real
   "git lockfile sync" leaf.
2. `ci-cd.md` described a nonexistent `GitCommands` enum (cases "Lockfile"/"Parity") — grep
   confirmed no such type exists in the current F# codebase; dispatch uses string-leaf matching.
   Corrected to describe the real mechanism.

### Self-caught claim before commit: coverage tool/format

Initially wrote (unverified) `dotnet test --collect:"XPlat Code Coverage"` / Cobertura format for
`code-coverage.md`. Before committing, verified against `apps/rhino-cli/project.json`'s actual
`test:coverage` target and `TestCoverage.fs`'s doc-comments, and corrected to the real mechanism:
coverlet.msbuild, `coverage.json` output, threshold enforced inline by MSBuild — a different pathway
from `rhino-cli test-coverage validate`'s generic LCOV-parsing capability (which exists for OTHER
projects' coverage, not rhino-cli's own).

### `md links validate` baseline (pre-existing, out of scope)

Same pattern as `ose-public`'s entry above: broken-link baseline is pre-existing, confined to
archived `plans/done/**` docs, unrelated to Rust/rhino-cli. 9e introduces zero new broken links in
the private sibling either.

**Terminal state**: Routed (the private sibling) — this entry is the record of
the private sibling's own already-executed sweep; not touched further from this `ose-public`-only session,
per this task's repo scope. The one "collateral, out-of-scope" finding (`coralpolyp-be`/`coralpolyp-fe`
stale "Active" claims in the private sibling's `programming-languages/README.md`) is a
repo-relevance-gated, private-sibling-only documentation fix outside this session's reach — flagged
here for a future the private sibling housekeeping pass, not filed as a `plans/backlog/` item in this
repo.

## 2026-08-30 — 9d gap-fix: the private sibling's leftover format-job `setup-rust`

Discovered during the Phase 9 Gate audit, not during 9d itself. 9d's own checklist had an unchecked
item — "sweep the private sibling's six in-file `setup-rust` uses to zero" — that five-of-six satisfied,
but the `format` job's use survived unnoticed.

**Verified genuinely dead**: `apps/rhino-cli/scripts/rhino-bin.sh gate list --surface=pre-commit --format=json`
lists doctor_tools `actionlint,docker,hadolint,npm,shellcheck,shfmt,tofu` — no `rust` entry — and
`git ls-files | grep -c '\.rs$'` is 0 repo-wide. The `format` job's "Provision registry-declared
pre-commit tools" step (`doctor --fix --tools "$tools"`) never requests cargo/rustfmt, so the step
provisioned a toolchain nothing downstream in that job ever calls.

**Found in the same audit, NOT removable**: the `dotnet` job's own `setup-rust` — added later by
task #64 (postdating 9d's 2026-08-25 measurement), backing real `cargo-target-share` Doctor-feature
test coverage (`specs/apps/rhino/behavior/rhino-cli/gherkin/system/cargo-target-share.feature`, 18
scenarios; implementation `RhinoCli.Application/src/Doctor.fs`). This is rhino-cli's OWN feature —
symlinking every Rust crate's `target/` directory into a shared cache — tested with a real `cargo`
process to validate the symlinking logic against actual Cargo output. Since `apps/rhino-cli` must
stay byte-identical across `ose-public`/the private sibling (parity requirement), and `ose-public` still
has 198 real `.rs` course examples exercising this exact code path, the private sibling's copy of the same
test suite needs the same real coverage — removing it would either silently skip real assertions
(violates the plan's no-skip-tests rule) or fail outright with cargo absent. Confirmed via `find` /
`grep`: `coralpolyp-be`, previously assumed to be the private sibling's own real Rust project justifying this
kind of thing, does **not currently exist** in this repo (removed pre-session, per
`applications.md`'s own note — "removed and will return... when the product need re-arises"); the
`dotnet` job's `setup-rust` need is unrelated to that and stands on its own via the parity argument
above.

**Fix**: removed only the `format` job's `- uses: ./.github/actions/setup-rust` on branch
`rhino-fsharp-9d-setup-rust-sweep` (built off `origin/main`, avoiding the squash-merge-divergence
issue from earlier in Phase 9), verified `actionlint` exits 0, opened the private sibling's PR #127, all 14
CI checks green, merged (`50a8316421`). `grep -c 'setup-rust' .github/workflows/pr-quality-gate.yml`
is now **1** in the private sibling (the `dotnet` job's), not the originally-planned **0** —
`delivery.md`'s 9d checkbox and Phase 9 Gate checkbox both carry a deviation note pointing here.

### Collateral, out-of-scope finding: `coralpolyp-be`/`coralpolyp-fe` "Active" claims

While tracing the `dotnet`-job justification, confirmed `docs/explanation/software-engineering/programming-languages/README.md`'s
table cites `Rust: ✅ Active - coralpolyp-be` and `TypeScript: ✅ Active - coralpolyp-fe` — neither
app currently exists in the private sibling (`find . -iname '*coralpolyp*'` matches only two archived
`plans/done/**` entries). This pre-dates the 9e sweep's own edit to that row (which only touched the
Rust→F# wording, not the coralpolyp-be citation itself) and is out of this sweep's scope, same class
as ose-public's `ci-standards/SKILL.md` coverage-threshold discovery. Flagged here, not fixed.

**Terminal state**: Discard — fully shipped and merged (the private sibling's PR #127,
`50a8316421`). The `dotnet` job's own retained `setup-rust` is justified and durable via the parity
argument stated in the entry itself; no separate write needed.

## 2026-08-30 — Phase 9 Gate: live break/restore proofs

Three of the Gate's own acceptance clauses required a live "deliberate temporary break that turns
red" proof, not just a structural read of the workflow YAML. All three run locally (Elixir/mix and
coverlet.msbuild are both installed on this dev machine), no CI run needed.

**1. Course-example format-job wiring** (`apps/ayokoding-www/content/**/*.rs`, `ose-public` only):
appended a badly-indented line to a tracked course-example `.rs` file
(`ex-28-flag-over-env/main.rs`), staged it (uncommitted — `git diff --cached` is what both
`format-verify-rustfmt`'s CI-surface detection and `lint-staged` itself key off, so a **committed**
change doesn't reproduce this; it must be staged-but-uncommitted, matching the `format` job's own
`git add -- $CHANGED && npx lint-staged` sequence). `apps/rhino-cli/scripts/rhino-bin.sh gate
run --surface=ci --group=formatting-verify` → `format-verify-rustfmt FAIL`, group fails. Then ran
`npx lint-staged --no-stash` directly (the same command the `format` job's "Format affected files"
step runs): `rustfmt --edition 2024` fired, rewrote `fn   badly_indented(  )  {}` →
`fn badly_indented() {}`. Restored the original file from a backup; `git diff --stat` clean, no
residual change.

**2. Elixir formatter-wrapper coverage** (`dotnet` job, `RHINO_REQUIRE_ELIXIR`/`erlef/setup-beam`):
baseline `dotnet test .../RhinoCli.UnitTests.fsproj --filter "FullyQualifiedName~Elixir"` → 2/2
pass. Edited `scripts/format-elixir.sh`, replacing its real `mix format --check-formatted
"$absolute_file"` call with `true` (a no-op that always "succeeds"). Rerun: `The Elixir formatter
script gains a check mode that fails` → **FAIL** (`Assert.False() Failure — Expected: False, Actual:
True`, at `GateExecutionSteps.fs:1069`) — proves the test is exercising the _real_ `mix format`
binary's exit code, not a mock. Restored the script from backup (byte-identical, `diff` exit 0);
rerun → 2/2 pass again.

**3. Coverage threshold enforcement** (`dotnet test .../RhinoCli.UnitTests.fsproj
/p:CollectCoverage=true /p:Threshold=<N> /p:ThresholdType=line`): baseline at the real, committed
`Threshold=90` → passes, actual total line coverage **90.22%** (Application 90.12%, Cli 90.32%,
Infrastructure 100%, Domain 100%). Reran with `/p:Threshold=95` (a CLI override, no file edit — the
committed `project.json` threshold of 90 is untouched) → **coverlet.msbuild build error**: "The
minimum line coverage is below the specified 95" (`coverlet.msbuild.targets(73,5)`), a real MSBuild
failure, not a soft warning. Reran with `/p:Threshold=90` → passes again, same 90.22%.

All three failure signatures are the actual gate mechanism firing (rustfmt's real diff, mix
format's real exit code, coverlet.msbuild's real threshold check) — not test-harness artifacts.

**Terminal state**: Discard — one-off gate-verification exercises proving mechanisms
that already exist as permanent CI gates (`format-verify-rustfmt`, the Elixir formatter-wrapper
test, `coverlet.msbuild`'s threshold enforcement). No new durable surface needed beyond those
already-shipped gates.

## 2026-08-30 — Phase 10: "After" measurements and the durable comparison home

All nine `benchmark.md` rows measured for `ose-public` (A1-A8 plus source size), on branch
`rhino-fsharp-10-after-benchmark` off `origin/main`. Full commands and per-row rationale are in
`benchmark.md`'s new "Phase 10 'After' measurements — ose-public" section; only the notable findings
are recorded here.

**F# has no per-file incremental compilation within one `.fsproj`.** A4 (edit-rebuild loop, touching
`RhinoCli.Application/src/Glossary.fs`) measured 10.37 s — statistically identical to A1's cold-build
figure (10.38 s). Touching any single source file recompiles the whole project and relinks every
downstream project. This is the plan's clearest and most severe "F# is worse" finding (~28x
regression vs. Rust's 0.37 s), and it could not have been predicted from `tech-docs.md`'s original
spike-era projection, which marked the equivalent row `n/c` (not comparable) because the `crane-cli`
prototype was too small to measure meaningfully.

**Startup regression landed almost exactly where the Phase 1 spike predicted**: A5 measured 71.2 ms
mean vs. Rust's 7.47 ms (~9.5x), matching the spike's ~9-10x projection closely — one of the few
projections that held up unchanged.

**The full pre-commit hook got faster, not slower, for F#** (A6: 4.19 s vs. Rust's 14.24 s) — the
opposite of what the spike-era "aggregated startup" row predicted. Once the entire Rust toolchain
was retired (not just per-invocation dispatch cost), most of the hook's own cost turned out to be
unrelated to rhino-cli invocation count at all, so the net effect was a win.

**Artifact/deployable footprint is a genuine, large regression** (A8): the published launcher alone
is 124,712 bytes (smaller than Rust's 4,489,568-byte static binary), but it is non-functional
without its self-contained payload — 92,996,313 bytes (~89 MB) total. Recorded as **worse**, ~20.7x,
using the full payload as the honest figure rather than the flattering launcher-only one.

**B7 (CI critical path) is recorded as `provisional`**, not a plain verdict, per the Phase 10 Gate's
own rule: its Before figure (70.67 s) still carries the pre-tree-sitter-removal `†` documented in
this file's 2026-08-26 entry above, so the raw +87.33 s delta mixes the language change with an
unrelated dependency removal and `build-rhino`'s own changed responsibilities across phases.

**Durable comparison home**: the finished, distilled comparison (not the full measurement log, which
stays in this plan's `benchmark.md`) is recorded at
`docs/explanation/software-engineering/programming-languages/rhino-cli-rust-to-fsharp-benchmark.md`,
linked from that directory's own `README.md` under "Language Selection Criteria" — so the next
language-change proposal starts from data. Landed in this same PR
(`rhino-fsharp-10-after-benchmark`).

`tech-docs.md`'s original "Measured Baseline" projection table (built from an early `crane-cli`
spike, not the real port) is left in place as a historical record but is now prefixed with a new
"Phase 10 — Measured Outcome" section that marks every one of its rows as confirmed, wrong, or
not-re-validated, per the Phase 10 acceptance clause that no projection may survive unlabelled.

**Terminal state**: Verified — `docs/explanation/software-engineering/programming-languages/rhino-cli-rust-to-fsharp-benchmark.md`
exists, is linked from that directory's `README.md`, and its comparison table matches this entry's
figures exactly (B1/B4/B5/B6/B8, and B7 provisional). `tech-docs.md`'s "Phase 10 — Measured Outcome"
table is likewise consistent (both checked line-by-line against this entry and the entry below). Not
touched further, per this task's instruction.

## 2026-08-30 — Phase 10: "after" measurements in the private sibling, and a live CI-stall incident

Same nine rows measured in the private sibling (branch `rhino-fsharp-10-benchmark-measure`, off
`origin/main`, no commits — this repo carries no `benchmark.md` of its own, so all figures were
written directly into `ose-public`'s single-sourced `benchmark.md`). Every row's direction matches
`ose-public`'s: B1/B2/B6/Size better, B3 unchanged (noise), B4/B5/B8 worse, B7 provisional. B4
(edit-rebuild loop) reproduced at 9.70 s (vs. Rust's 0.37 s), confirming F#'s lack of per-file
incremental compilation is structural, not a one-repository artifact.

**B7 differs materially between repositories and is called out, not averaged**: 158.00 s
(`ose-public`) vs. 762.00 s (the private sibling). The private sibling's figure is dominated by that
repository's already-documented self-hosted-runner artifact-upload variance — one of the three
sampled runs (33237644795) is the exact same run this file's Phase-2-era B7 re-measurement already
cited at 831 s, and it still reads 831 s now, confirming ongoing runner-pool noise rather than a new
regression.

**Incidental finding, not part of the measured figures**: while sampling A7's three most-recent-green
runs, the push-triggered CI run for the just-merged PR #127 (run 33292968267) was found already
`failure`d, root-caused to `##[error]Upload progress stalled` inside `actions/upload-artifact@v4` on
the `Build rhino-cli (gate profile)` job — the `dotnet publish` itself had already completed and NX
reported success before the stall; only the subsequent artifact upload hung (~9 minutes) before the
job was marked failed. This is the confirmed-transient-external-failure class this plan's standing
constraints permit rerunning without any code change. Reran via `gh run rerun 33292968267 --failed`
to restore `main`'s CI status; excluded the run from A7's sample regardless, since it was not among
the three most recent green runs at measurement time.

Durable comparison home (`docs/explanation/software-engineering/programming-languages/
rhino-cli-rust-to-fsharp-benchmark.md`, named in the 2026-08-30 entry above) is `ose-public`-only
per this plan's single-sourcing convention; it references both repositories' figures from
`benchmark.md` rather than duplicating a second copy.

**Terminal state**: Verified — figures cross-checked against the same durable
comparison doc as the entry above; consistent (B4 9.70s reproduces the ~28x edit-rebuild regression
as structural, not a one-repository artifact). The CI-stall incident (`upload-artifact`
progress-stall) is a confirmed-transient external failure already handled per this plan's standing
constraints (rerun, exclude from sample); no separate durable surface needed.

## 2026-08-30 — Phase 11a: rules-propagation Step 0-3 (ose-public)

**File-touch ledger (Step 1, opened before any write below)**: this entry
(`learnings.md`), `generated-reports/rules-propagation__ose-public__2026-08-30__manifest.md`
(new), and `delivery.md` (checkbox ticks only). No `repo-governance/`, `AGENTS.md`, or `CLAUDE.md`
path is on this ledger — see the Step 4 verdicts below for why.

**Step 0 — normalized, falsifiable rules**:

- **R1**: The compiled binary at `apps/rhino-cli/src/dist/rhino-cli-fsharp` is invoked only through
  `apps/rhino-cli/scripts/rhino-bin.sh` — by every `.husky/*` hook, every `package.json`
  lint-staged entry, and the one workflow that runs it (`.github/workflows/pr-quality-gate.yml`) —
  never executed directly. Falsifiable:
  `grep -rn "dist/rhino-cli-fsharp" --include="*.sh" --include="*.yml" --include="*.json" . | grep -v node_modules | grep -v "rhino-bin.sh:" | grep -vE "chmod \+x|RHINO_CLI_FSHARP_BIN"`
  returns exactly one hit, `shadow-diff.sh` (a standalone Rust-vs-F# comparison script from the
  wave-flip harness — not a hook, Nx target, or workflow, and not invoked by any live automation
  today), and zero hook/Nx-target/workflow hits. This rule is about the **built binary**
  specifically: several of `rhino-cli`'s own Nx targets
  (`specs:behavior:coverage`, `specs:structure-validation`, `specs:gherkin-cardinality-validation`,
  `governance:vendor-audit-validation`, `governance-word-budget:validation`,
  `governance-readme-index:validation`, `env:validation`) invoke
  `dotnet run --project RhinoCli.Program.fsproj` directly — that path runs from source and never
  touches the built binary at all, so it does not violate R1.
- **R2**: `apps/rhino-cli/parity-manifest.sha256` is produced only by
  `rhino-bin.sh parity manifest generate`, which hashes the calling repository's own git-tracked
  boundary files (`Parity.generateAtRoot`, `RhinoCli.Application/src/Parity.fs`) and takes no
  cross-repo input — there is no code path that writes one repo's manifest from another repo's
  bytes. Falsifiable: `rhino-bin.sh parity manifest validate` exits 0 against each repo's own
  committed manifest independently, and the two repos' committed manifests are not byte-identical
  (the private sibling carries an extra GPG-check boundary file `ose-public` does not, per
  [[project_rhino_cli_parity_boundary_drift]]) — proof a raw copy would not silently validate.
- **R3**: every job in `pr-quality-gate.yml` that invokes `rhino-cli` runs
  `actions/download-artifact@v4` before it; the only job that runs
  `dotnet publish RhinoCli.Program.fsproj` is `build-rhino` (gate profile), which then runs
  `actions/upload-artifact@v4` once — the job's own comment states "never a hand-written
  `dotnet publish` duplicate." Falsifiable:
  `grep -n "download-artifact\|upload-artifact\|dotnet publish" .github/workflows/pr-quality-gate.yml`
  shows exactly one `dotnet publish` (in the uploading job) and a `download-artifact` step
  preceding every job that later invokes `rhino-bin.sh`.
- **R4**: `rhino-cli` is an F# project — and not the stronger claim that this repository has no
  Rust toolchain, which is false while the 198 `.rs` course examples under
  `apps/ayokoding-www/content/` exist and `format-rustfmt` is glob-scoped `*.rs` repository-wide.
  Falsifiable: `find apps/ayokoding-www/content -name "*.rs" | wc -l` → re-run this cycle: **198**
  (unchanged from Phase 9d), and `package.json`'s lint-staged `"*.rs"` entry still runs
  `rustfmt --edition 2024` repo-wide. The count and the sentence agree.

**Step 2 — classification** (subject / audience / neutrality / layer):

| Rule | Subject                             | Audience                                                                                  | Neutrality | Layer                                      |
| ---- | ----------------------------------- | ----------------------------------------------------------------------------------------- | ---------- | ------------------------------------------ |
| R1   | `rhino-cli` binary invocation path  | Everyone, when they add a hook/Nx-target/workflow step (activity-triggered)               | Neutral    | How to develop or operate (CI conventions) |
| R2   | `parity-manifest.sha256` generation | Everyone, when they regenerate or inspect the manifest (activity-triggered)               | Neutral    | How to develop or operate                  |
| R3   | CI artifact vs. in-job build        | Everyone, when they add a CI job that runs `rhino-cli` (activity-triggered)               | Neutral    | How to develop or operate (CI conventions) |
| R4   | Rust toolchain retention scope      | Everyone, when they propose a language change or read Rust standards (activity-triggered) | Neutral    | Why an approach is valued (explanation)    |

None of R1-R4 have "everyone, before opening any file" audience — all four are reached only when a
contributor touches the specific activity they govern. None is an instruction-surface candidate
(Step 4's necessity test fails for all four before room is even considered).

**Step 3 — conflict scan**:

- R1: no conflict found. `repo-governance/development/infra/ci-conventions/ci-toolchain-parity-checklist-invariants-a-and-b.md`
  Invariant B already states hooks call `rhino-bin.sh gate run`, which is consistent with, not
  contradicted by, R1's narrower binary-reachability claim. No existing statement claims the
  binary is reachable any other way.
- R2: no conflict found. `grep -rln "parity-manifest" repo-governance/` returns only the generic
  multi-repo-parity-planning workflow docs, none of which name `rhino-cli`'s manifest specifically
  or make a claim R2 would contradict.
- R3: no conflict found. Same Invariant-A/B document lists CI Workflow Shape requirements; none of
  its existing rows state or imply in-job building of `rhino-cli`.
- R4: no conflict — this fact is already placed (see Phase 9e/10 below), and the placed wording
  ("no active platform app — rhino-cli, its last user, was ported to F# 2026-08-30 — but these
  standards remain active for the AyoKoding Rust course content") already avoids the stronger
  no-Rust-toolchain claim R4 guards against.

**Step 4 — placement decision**: none of R1-R4 pass the necessity test (Step 2's audience column —
all four are activity-triggered, not "everyone before opening any file"), so none is an
instruction-surface candidate; `wc -w AGENTS.md CLAUDE.md` (501 + 479 = 980, both below the
750-word-per-file FAIL ceiling) is recorded for completeness but is moot — nothing was a candidate
for admission there.

Per rule, the fallback layer (the document that already owns the subject) is:

- **R1, R3**: `repo-governance/development/infra/ci-conventions/ci-toolchain-parity-checklist-invariants-a-and-b.md`
  (Invariants A/B) — the existing home for exactly this class of CI-shape/hook-shape rule.
- **R2**: no existing `repo-governance/` document owns this subject specifically (`grep -rln
"parity-manifest" repo-governance/` finds only the generic multi-repo-parity-planning workflow,
  which doesn't name `rhino-cli`); Step 4's own text is explicit that "a new document is created
  only when no existing one owns the subject" — so the fallback for R2 is a **new**
  `repo-governance/` document.
- **R4**: not a governance-layer fallback at all — its layer is "why an approach is valued"
  (explanation), and it is already placed at
  `docs/explanation/software-engineering/programming-languages/README.md` (Phase 9e/10, this same
  plan, `ose-public`-only) and `.../rust/README.md`. `docs/` is not `repo-governance/`, so no
  standing-constraint conflict; no new write is needed here.

**Every fallback destination for R1-R3 sits under `repo-governance/`. This plan's standing user
constraint — given verbatim, "jangan diubah rules apa pun ya, lebih ke pengecualian untuk plan ini
aja" (don't change any rules at all — an exception for this plan only) and "@repo-governance/ gak
boleh ada yang berubah" (nothing under `repo-governance/` may change) — outranks Step 4's own
placement instruction, exactly as it outranked two of 9e's named checklist targets** (see the
2026-08-30-earlier entry above, `learnings.md:1041`). R1, R2, and R3 are therefore **deliberately
not written into `repo-governance/`** this phase. This is recorded here, in the manifest (Step 6
below), and is the reason the Step 1 ledger names no `repo-governance/` path.

**Step 5 — eviction**: no admission, no eviction needed. Step 4 admitted none of R1-R4 to the
instruction surface, so Step 5 is a no-op by its own stated condition.

**Terminal state**: Verified/already-terminal — R1-R3's `repo-governance/` fallback
destinations are **deliberately not written into `repo-governance/`**, exactly as this entry's own
Step 4 already states (standing plan constraint, matching the Phase 9e precedent it cites by line
number). R4 is already placed at `docs/explanation/software-engineering/programming-languages/README.md`
and `.../rust/README.md` (verified present in the Phase 9e entry above and by direct grep during this
triage). No further action.

## 2026-08-30 — Phase 11a: rules-propagation Step 6-9 (ose-public)

**Step 6 — write and tidy**: the only writes this phase makes are this file and
`generated-reports/rules-propagation__ose-public__2026-08-30__manifest.md` (new) — no
`repo-governance/` document is created or edited (R2's would-be new document is the one skipped,
per the Step 4 verdict above), so no README reindex is needed. `rhino-bin.sh md links validate`
is run against the changed files as part of Step 8 below rather than repeated here.

**Step 7 — enforcement disposition**:

- **R1** — manual (code review). No gate inspects a new hook/Nx-target/workflow step for whether it
  shells to the built binary directly; `actionlint`/`shellcheck` check syntax, not this semantic
  rule. Same disposition class as most of Invariant A/B's existing rows.
- **R2** — automated: `rhino-bin.sh parity manifest validate`, run at the `pre-push` gate surface
  and in CI. Because the two repos' manifests are not byte-identical (R2's own falsifiable check),
  a manifest copied from the other repo would fail `validate` immediately in the destination repo —
  the existing gate already enforces this rule's substance even though R2's _prose_ has nowhere
  landed in `repo-governance/` this phase.
- **R3** — manual (code review). No gate detects a newly-added CI job that duplicates the
  `dotnet publish` step; the single-producer-job shape is structural (only one job does it today)
  but not mechanically guarded against a future second one.
- **R4** — explicitly unenforced. It is a descriptive statement about toolchain retention scope,
  not a behavior; nothing needs to fail a build for a documentation page to be stated correctly.

**Step 8 — verification**: `rtk npm run generate:bindings`, `rtk npm run validate:sync`,
`rtk npm run harness:bindings-validation`, and the `rules-quality-gate` are run below and their
exit codes recorded. Since no binding-mirrored file (`.claude/`, `repo-governance/`, `AGENTS.md`,
`CLAUDE.md`) changed this phase, all four are expected to be no-ops that still exit 0.

**Step 1 ledger reconciliation (Step 8)**: ledger named `learnings.md`,
`generated-reports/rules-propagation__ose-public__2026-08-30__manifest.md`, and `delivery.md`.
Reconciled against `git status --porcelain` below before commit.

**Step 9 — sibling obligation**: the private sibling gets its own, independently-authored R1-R4
propagation (11a's own instruction: "Repeat 11a in the private sibling, authored there rather than
copied"), producing its own manifest under its own `generated-reports/`. The descriptive sweep's
private-sibling repeat already happened at 9e and is not repeated here.

**Step 8.1-8.2 results (ose-public)**: `rtk npm run generate:bindings` exits 0, 91 agents
converted / 0 skills copied, and produces zero tracked-file diff (no mirror drift to regenerate).
`rtk npm run validate:sync` exits 0, 95/95 checks passed. `rtk npm run harness:bindings-validation`
exits 0, 195/195 checks passed. `rhino-bin.sh md links validate` (Step 6's own acceptance) exits 0.

**Step 8.3 — composed `rules-quality-gate`**: scoped to findings "attributable to this run's
edits" per the workflow's own Step 8.3 text. This run wrote zero content to any surface that gate
inspects (`repo-governance/`, `AGENTS.md`, `CLAUDE.md`, `.claude/agents/`) — R1-R3's placement was
deliberately deferred and R4 was already placed at Phase 9e/10 — so there is no new rule-bearing
content for a repository-wide duplication/contradiction sweep to find. Running the full
`repo-rules-checker` agent sweep here would audit the pre-existing repository state, not this run's
edits, at a cost disproportionate to a zero-line change to any checkable surface. Deferred to
whichever future, unconstrained run actually places R1-R3 into `repo-governance/` — that run's own
Step 8.3 is where a real composed-gate pass belongs. Zero findings attributable to this run,
by construction.

**Step 8.4 — ledger reconciliation**: `git status --porcelain` (tracked changes only, this branch)
shows exactly `learnings.md` (modified) and `generated-reports/rules-propagation__ose-public__2026-08-30__manifest.md`
(new) — both on the Step 1 ledger. `delivery.md`'s checkbox ticks land in the same commit. No
unledgered path.

**Terminal state**: Verified/already-terminal — this entry records its own Step 8
verification (bindings/sync/harness checks all exit 0) and Step 8.4 ledger reconciliation
(`git status --porcelain` matched the Step 1 ledger). No further action.

## 2026-08-30 — Phase 11a: rules-propagation repeated independently in the private sibling

Same nine-step propagation run repeated in the private sibling (scratch branch off `origin/main`, no
commits — this repo carries no plan-doc copy of `rewrite-rhino-cli-to-fsharp`, matching Phase 10's
own precedent, so all findings are recorded here rather than in a per-repo file). Manifest written
to that repo's own `generated-reports/rules-propagation__private-sibling__2026-08-30__manifest.md`
(gitignored there too, same as `ose-public`'s).

R1-R3 verified identically to `ose-public`: `rhino-bin.sh` and `Parity.fs` are byte-identical
across repos; the same 7 Nx targets use `dotnet run` directly (never touching the binary);
`shadow-diff.sh` is the same sole non-hook/target/workflow exception; `pr-quality-gate.yml`'s
`build-rhino` job (`npx nx run rhino-cli:build`) is the only `dotnet publish`, every consumer job
`needs: build-rhino` + downloads the artifact; `rhino-bin.sh parity manifest validate` exits 0
against this repo's own 181-line manifest — one line longer than `ose-public`'s 180-line manifest
(an extra `GlossaryDddCoverageUnitTests.fs` entry), concretely proving a copied manifest would not
silently validate. Same Step 4 verdict: R1-R3's fallback lands under `repo-governance/` (the
CI-conventions layer, though the specific `ci-toolchain-parity-checklist-invariants-a-and-b.md`
document itself doesn't exist in this repo's smaller governance tree — the closest analogues,
`repo-governance/development/infra/ci-conventions/pre-push.md` and
`repo-governance/development/quality/code/pre-push-hook.md`, describe hook shape generically and
don't name `rhino-cli`'s manifest or binary-invocation rule specifically) — **deliberately not
written**, same standing constraint.

**R4 resolves differently here, and this is the reason the plan says "authored there rather than
copied" rather than letting a single write serve both repos**: the private sibling has **zero** `.rs`
files anywhere in its tree (`find . -name "*.rs" -not -path "./node_modules/*"` → 0) — there is no
`apps/ayokoding-www` in this repo at all. `package.json`'s lint-staged `"*.rs"` →
`rustfmt --edition 2024` entry is still declared but currently matches no file — inert, not false.
Unlike `ose-public`, where R4 exists specifically to block an overstated "no Rust toolchain at all"
claim against 198 real `.rs` files, the private sibling has no active-Rust-elsewhere fact to guard
against; R4's placement verdict here is "N/A — nothing to place."

`wc -w AGENTS.md CLAUDE.md` in the private sibling: 542 + 420 = 962, both below the 750-word-per-file
ceiling — recorded per the Phase 11 Gate, moot for the same reason as `ose-public` (nothing was an
instruction-surface candidate).

Sibling obligation discharged: this entry and the private sibling's own (uncommitted, ephemeral)
manifest are the private-sibling half `ose-public`'s Phase 11a named as owed.

**Terminal state**: Verified/already-terminal — same R1-R3 deferral and R4 "N/A —
nothing to place" verdict as `ose-public`'s run; recorded here per this plan's sibling-obligation
requirement. No further action.

## 2026-08-30 — Final Validation Checklist: Wave B git-fixture-safety recording gap

Two Validation-Checklist sub-items near the top of `delivery.md` (the DD-6 git-fixture-safety
convention's six layers) were never ticked. Re-checked at plan close, substantively and via the
record:

**Substance — verified compliant.** `PreCommitHookSteps.fs` (the one integration-test step file
that shells a real `git` subprocess) sets all six layers: `GIT_CEILING_DIRECTORIES`, `GIT_DIR`,
`GIT_CONFIG_GLOBAL`, `GIT_CONFIG_SYSTEM`, a pre-write `rev-parse --show-toplevel` escape guard
compared against the fixture root, and asserts exit status on every git invocation (grep-confirmed
in the file's own doc comments and helper functions). `EnvSteps.fs` — the other file the checklist
item named — never shells a subprocess at all (no `Process`/`ProcessStartInfo` reference anywhere
in the file); the six-layer requirement's premise (a fixture that runs real `git`) does not apply
to it, so there was nothing for that cycle to satisfy.

**Recording — a genuine miss, closed here instead of then.** The paired item required a
`learnings.md` entry, written at the time, naming `apps/rhino-cli/tests/git_hooks.rs` and
`apps/rhino-cli/tests/env.rs` as themselves non-compliant with DD-6, so the F# port would implement
the convention's layers rather than copy the Rust helpers' shape. That entry was never written
during Wave B. The Rust crate (including both named files) was deleted at Phase 9c, so the
original files no longer exist to consult — this note necessarily reconstructs the finding after
the fact rather than restating it from the time. The substantive outcome it was meant to protect
did land correctly regardless: `PreCommitHookSteps.fs` was authored independently against the DD-6
convention (six layers present, verified above), not copied from the Rust fixture's shape.

**Terminal state**: Closed here. The protected outcome (DD-6-compliant F# git fixtures) is verified
true; the specific "record it in learnings.md at the time" sub-requirement was missed during
execution and is satisfied retroactively by this entry rather than a contemporaneous one. No
further action — there is no live Rust fixture left to mis-copy from.
