# Business Requirements Document — rhino-cli F# port

## Goal

Reduce the maintenance surface of the platform's most-edited tooling binary by expressing its
validator-shaped logic in F# instead of Rust, without changing a single byte of its observable
behavior.

`rhino-cli` is 49,460 lines of actual code across 13 namespaces
[Repo-grounded — `apps/rhino-cli/src/`, comment/blank lines excluded]. Almost all of it is the same
shape: walk a file tree, parse text, classify findings by severity, emit text/JSON/markdown. That
shape is what discriminated unions, exhaustive pattern matching, pipeline operators, and
railway-oriented error handling exist for. Rust expresses it with more ceremony — explicit lifetimes
on borrowed paths, `Result` threading at every fallible boundary, and a mandated `///` doc comment
on every private item.

**The goal is source-size reduction for maintainability**, on unchanged behavior.

## Measurement policy — recorded, not obeyed

This plan carries **no kill gate**. The maintainer weighed the projected trade-offs, which are
recorded in full in [README.md](./README.md) §What was measured, and directed the rewrite anyway.
An earlier draft of this document proposed abandoning the plan if F# turned out not to be smaller;
that clause is removed deliberately, not by oversight.

What replaces it is a discipline, not a gate:

- Phase 0 captures nine "before" figures into `benchmark.md` before a line of F# is written.
- Every wave gate appends a running "after wave N" figure for startup and pre-commit wall time, so a
  regression is visible when it appears rather than at the end.
- Phase 10 fills the "after" column and writes a **better / worse / unchanged verdict with an
  absolute delta** on every row — including the rows where F# loses. No row may be omitted for being
  unflattering.
- Phase 10 routes the finished comparison to a durable home outside `plans/`, so the next
  language-change proposal in this repo starts from data rather than from argument.

## Why now

- The crate has grown from 27,990 src lines at the Go→Rust port's archival commit to 65,858 today
  [Repo-grounded — `git ls-tree` at `6d3fd6128` vs. working tree]. Two of its files exceed 2,000
  lines each (`commands/gate/validate.rs` at 2,766, `application/governance/readme_index.rs` at
  2,202). File size is now a real review burden.
- The repo already runs a production F# CLI (`apps/crane-cli`) with the full toolchain settled:
  `xunit.v3` 3.2.2, `TickSpec` 2.0.5, `coverlet` 8.0.1, G-Research F# analyzers, `net10.0`
  [Repo-grounded — `apps/crane-cli/tests/unit/crane-cli-unit-tests.fsproj`,
  `apps/crane-cli/crane-cli.fsproj`]. There is no new-technology risk in the test or lint stack.
- The 71 `.feature` files under `specs/apps/rhino/` are the behavior contract and are
  language-agnostic [Repo-grounded]. TickSpec consumes the same Gherkin the Rust `cucumber` harness
  does, so the acceptance surface transfers unchanged.

## Affected roles

| Role                           | Impact                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Contributor (any role)         | `npm run doctor -- --fix` provisions the .NET SDK (already required by the F# backends) and eventually stops provisioning Rust. Hook latency rises by a projected 0.41 s per commit, measured for real at each wave gate.                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| CI workflows                   | While both binaries exist, `build-rhino` builds Rust **and** publishes F#, and three consumer jobs download both. At Phase 9 the `rust` job and the `has-rust` detect branch are deleted in both repos. `setup-rust` diverges by design: `ose-public` keeps it in the `format` job and keeps `.github/actions/setup-rust/` itself, because 198 Rust course examples under `apps/ayokoding-www/content/` still need formatting; the private sibling has none, so its six in-file uses go to zero and the action directory is deleted there. Five `ose-public` workflow files reference the action today [Repo-grounded — `grep -rlc setup-rust .github/workflows/`, measured 2026-08-25]. |
| The private sibling maintainer | The semantically equivalent change lands in the same delivery units, authored there rather than file-copied; the parity manifest is regenerated by each repo's own generator.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Rust style-guide readers       | The fourteen files under `docs/explanation/software-engineering/programming-languages/rust/` cite `rhino-cli` as their worked example. Phase 9e records an explicit disposition — re-example, mark historical, or retire — rather than leaving them quietly wrong.                                                                                                                                                                                                                                                                                                                                                                                                                       |

## Success metrics

- **Primary**: all 525 Gherkin scenarios pass against the F# implementation, and every namespace was
  proved byte-identical by `shadow-diff.sh` before its shim entry flipped.
- **Recorded, not gated**: F# source line count (`src-fsharp/` excluding its `tests/` subdirectory)
  against the Rust `src/`-only count it replaced, counted on comparable terms (code lines only,
  comments and blanks excluded, both sides, same command shape, both sides' own test directories
  excluded — see `benchmark.md`'s Source size section).
- **Hard constraint**: startup stays within the ceiling accepted at the Phase 1 gate, and the CI
  shape stays toolchain-free — no `setup-dotnet` in the eight jobs that currently install nothing.
- **Hard constraint**: byte-identical stdout/stderr/exit-code against the Rust binary for every
  scenario, verified per namespace before its shim entry flips.

## Non-Goals

- **Compile speed of first-party code.** Measured on 2026-08-25: F# marginal throughput
  ~1,500 LOC/s vs. Rust's ~5,900 LOC/s, i.e. ~4x slower per line. In felt terms the edit-rebuild
  loop goes from a measured **11.1 s** to a projected **~20–33 s** [Judgment call, range set by the
  source-size hypothesis]. **This is the plan's one genuinely significant projected regression** — a
  contributor notices it on every edit. It is accepted, not mitigated, and must never be sold as a
  build-speed win. Note the fair counterpart: 92.7% of a cold Rust build is dependency crates that
  F# does not compile at all, so total CI build time may move the other way — see
  [tech-docs.md](./tech-docs.md) §Felt cost in perspective. Phase 10 settles which way it actually
  went.
- **Runtime performance.** Not measured, not claimed, not a goal beyond the startup constraint.
- **Feature work.** No new commands, flags, or output formats. Anything discovered mid-migration is
  filed to `plans/backlog/`, never landed inline.

## Business risks

| Risk                                                                                                                                                     | Severity | Mitigation                                                                                                                                                                                                                                             |
| -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Neither NativeAOT nor a self-contained publish yields a runnable toolchain-free binary                                                                   | MEDIUM   | Phase 1 measures both before any porting work, and framework-dependent publish is always available as a third fallback — at the cost of adding `setup-dotnet` to eight CI jobs, which Phase 1 makes an explicit, costed choice rather than a surprise. |
| The plan is long — 525 scenarios, ~71 implementation PRs — and a competing change lands against the Rust crate mid-migration                             | HIGH     | Both known candidates are listed in [README.md](./README.md) §Dependencies. Sequence them before or after, never during. Each wave is independently revertible by removing shim entries, so a collision costs one wave, not the plan.                  |
| CI carries two binaries for the whole migration, lengthening the `build-rhino` critical path                                                             | MEDIUM   | `build-rhino` is 69-74 s and gates every other job. The added publish step is measured at the Phase 2 gate and at every wave gate, and disappears at Phase 9. It is a known, bounded, visible cost.                                                    |
| Phase 9 deletes the only `tag:lang:rust` project, and with it the `rust` job's unique `RHINO_REQUIRE_ELIXIR` coverage and its `test:coverage` invocation | HIGH     | Phase 9d re-homes both into the `dotnet` job **before** deleting the `rust` job, and proves each with a deliberate temporary break that must turn CI red. Deleting the job without this is a coverage regression disguised as cleanup.                 |
| RAII fixture ownership is lost — `tempfile::TempDir` has no borrow-checked F# analogue                                                                   | MEDIUM   | The Rust BRD named this as one of five type-checkable bug classes. F# gets `IDisposable` + `use`, a runtime convention. Accepted regression, recorded here rather than hidden.                                                                         |
| Long dual-implementation window with two binaries to keep green                                                                                          | MEDIUM   | Waves are small relative to the whole and each flips the shim on completion. The Rust crate stays authoritative for every namespace not yet flipped.                                                                                                   |
| The Rust style-guide series and the Rust ecosystem setup workflow silently become fiction                                                                | MEDIUM   | Phase 9e names them and forces a recorded disposition. Fourteen style-guide files plus two governance surfaces, enumerated by a grep whose output is committed.                                                                                        |
| CI artifact grows from 4.5 MB to a self-contained binary                                                                                                 | LOW      | The binary is never distributed; its only transfer is 9 hops inside one CI run, costing seconds. Size is not a decision input.                                                                                                                         |

## Explicit acknowledgement

The plan author's recommendation, recorded for the reader, stated in felt terms rather than ratios:

- **Against the plan, and it counts**: the edit-rebuild loop is projected to roughly double or
  triple, 11.1 s to 20–33 s. Every contributor pays this on every edit.
- **Against the plan, but it does not count**: startup (+0.41 s per commit) and artifact size
  (seconds of intra-CI transfer). Both were overstated in earlier drafts of this document and are
  corrected here rather than quietly dropped. Neither is a reason to reject the plan.
- **For the plan, unproven until Phase 10**: fewer source lines. This is the sole claimed benefit.
- **For the plan, plausible but unmeasured**: `build-rhino` is 69–74 s and gates every other CI job;
  F# skips 92.7% of the compile work Rust does. Phase 10 settles it with a number.

The maintainer reviewed these measurements and directed the full rewrite. This document records the
trade-off so the Phase 10 comparison can be read honestly by someone who was not in the room.
