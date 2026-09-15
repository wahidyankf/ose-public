<!-- Knowledge Capture running log — append entries during execution. -->
<!-- Triage every entry (or record the explicit "none" escape) before archival. -->

# Learnings: optimize-cis

## Learning: zsh does not word-split unquoted variables, silently voiding timing harnesses

- **Context**: benchmarking `rhino-cli` gate commands during plan authoring, using a
  `for c in "md links validate" ...; do $BIN $c; done` loop under `zsh`.
- **Observation**: `zsh` passed `"md links validate"` as a single argument, so every invocation
  exited with `unrecognized subcommand` in ~3 ms. The measurements looked like a spectacular result
  and were entirely fabricated by the harness. A second harness variant used `python3` subprocesses
  for timestamps, whose ~700 ms startup swamped the thing being measured. Both were caught only by
  checking exit codes and output, not by looking at the timings.
- **Why it might generalize**: this repo's default shell is `zsh`, and agents write ad-hoc timing
  loops routinely. A benchmarking-method rule — measure under `bash`, loop N times and divide, and
  always verify non-error execution before trusting a number — would catch this class every time.
  Same family as the recorded `grep -L`, `ls`-is-eza, and RTK-output-transform traps: a builtin
  quietly transforms the thing being measured and a false zero reads as a pass.

**Terminal state**: ROUTED INLINE to [Trustworthy Measurement](../../../repo-governance/development/practice/trustworthy-measurement.md) §1 — a new practice doc created by this triage, registered in both the practice and development indexes.

## Learning: cross-worktree cargo build-lock contention costs more than the disk it saves

- **Context**: first `cargo run` invocation of the session in a fresh worktree.
- **Observation**: blocked **65.05 s wall at 0.31 s user / 0.50 s sys** — pure lock wait, no
  compilation. Cause: `doctor --fix` symlinks every worktree's per-crate `target/` into one shared
  `~/.cache/ose-cargo-target/<repo>/<crate>`, so concurrent cargo processes across worktrees
  serialize on a single build-directory lock.
- **Why it might generalize**: the repo mandates `worktree-to-pr` and assumes concurrent agents on
  one disk, so shared-mutable-build-state is a standing design tension, not a one-off. Whether the
  disk saving is worth the serialization is a real design question — possibly answered by per-profile
  sharing or a content-addressed cache instead of a shared target dir.

**Terminal state**: FILED as [`plans/ideas/q2-not-urgent-important/shared-cargo-target-lock-contention.md`](../../ideas/q2-not-urgent-important/shared-cargo-target-lock-contention.md), merged with the Phase 9 entry below on the same subject. Not landed inline: reversing the trade means per-worktree targets plus a shared cache layer, which is a design question with its own rollback story.

## Learning: cross-phase forward-references in a checklist item's own text can hard-error

- **Context**: Phase 2 item 5 (`rhino-bin.sh` creation) specified `cargo build --profile gate` and
  `target/gate/rhino-cli`, but `[profile.gate]` is not added to `Cargo.toml` until Phase 4 — which
  even carries its own dedicated step to repoint `rhino-bin.sh` at `--profile gate`, proving the
  sequencing was always meant to be later.
- **Observation**: had the item been executed literally, the first test exercising the shim's
  build-fallback path would have hard-errored with `error: profile`gate`is not defined`. Caught
  only because the executing agent proactively flagged the missing profile section before writing
  the script, not by any earlier plan-quality-gate pass — 5 `plan-checker`/`plan-fixer` iterations
  had already run clean over this exact text.
- **Why it might generalize**: `plan-checker` currently validates structure/completeness, not
  whether a step's own command text is satisfiable given what prior phases have actually built by
  that point. A phase-ordering / forward-reference check (does this step's command reference an
  artifact — profile, flag, file — that a later phase's step is the one that creates it?) would
  catch this class before execution, not during it.

**Terminal state**: FILED as [`plans/ideas/q1-urgent-important/plan-checker-forward-reference-detection.md`](../../ideas/q1-urgent-important/plan-checker-forward-reference-detection.md), merged with the second instance below. Not landed inline: naive detection would drown in false positives, so the brief's first step is measuring that rate over the `done/` corpus.

## Learning: a byte-identity-governed file trips its local parity-manifest gate on the very next push

- **Context**: Phase 2's `emit.rs` edit (DD-1 resolver-shim rendering) is inside the zero-carve-out
  `apps/rhino-cli` byte-identity boundary (`src/`, `Cargo.toml`, `Cargo.lock`, `project.json`,
  `LICENSE`, the shared Gherkin tree) spanning `ose-public`/`ose-primer`/the private sibling.
- **Observation**: the first `git push` after committing the edit was blocked by the local
  `parity-manifest` pre-push gate — not a cross-repo diff, just this repo's own recorded checksum of
  `emit.rs` going stale the moment the file changed. Fix was `rhino-cli parity manifest generate`
  (regenerates the local checksum), committed as its own follow-up commit, then the push succeeded.
  The gate's own error text states the real obligation plainly: the identical change must still
  propagate to the other repos — regenerating the local manifest does not satisfy that, it only
  unblocks this repo's own push.
- **Why it might generalize**: any future phase (this plan's own Phase 10, or any unrelated future
  edit) touching a byte-identity-governed `apps/rhino-cli` file should expect this same local gate to
  fire on the very next push, immediately, before any cross-repo work has happened — it is a
  same-repo self-consistency check, not a signal that propagation is already done or overdue.

**Terminal state**: ROUTED INLINE to [plan-multi-repo-parity-planning-and-execution](../../../repo-governance/workflows/plan/plan-multi-repo-parity-planning-and-execution.md), as an explicit note that the gate fires on the first push, is a same-repo self-consistency check, and that regenerating the manifest does not discharge the propagation obligation.

## Learning: isolated single-shot benchmarks overstated a batched-execution saving by ~4x

- **Context**: `tech-docs.md` §A.2 benchmarked prettier/markdownlint-cli2's pre-DD-2 "current form"
  as standalone `npx --no -- <tool>` invocations (622 ms / 441 ms) to derive DD-2's claimed ~250 ms
  per-tool saving and the plan's "3,047 ms → 683 ms" M1 projection, which Phase 3's own gate then
  encoded as a hard `≤900 ms` acceptance clause.
- **Observation**: the real pre-commit path never paid `npx` per tool. `repo-config.yml`'s actual
  commands were always bare (`prettier --write`, no `npx` prefix); only the outer
  `apps/rhino-cli/src/commands/gate/run.rs` batch runner spawns `npx --no -- lint-staged` **once**
  for the whole batch, and prettier/markdownlint-cli2 ran as its children via lint-staged's own
  `node_modules/.bin`-inclusive `PATH` — the isolated per-tool `npx` tax the benchmark measured was
  never actually being paid twice in the integrated path. Real measured Phase 3 M1 saving: −138 ms
  (−5.4 % vs Phase 2), not the ~500+ ms the isolated benchmark implied. Phase 3 Gate's `≤900 ms`
  acceptance clause was corrected in place (see `delivery.md` Phase 3 Gate) rather than forced to a
  false PASS.
- **Why it might generalize**: a **candidate follow-up** worth triaging (a `DD-10`-class idea, not
  authored or scoped by this plan): the one remaining process-spawn cost neither DD-1 nor DD-2
  touches is that single outer `npx --no -- lint-staged` spawn in `run.rs` — replacing it with a
  direct `node_modules/.bin/lint-staged` call is outside `GateKind` command-rendering (DD-1/DD-2's
  actual mechanism) and was never an authored step here. More generally: a per-invocation isolated
  benchmark does not necessarily predict its saving inside a batched/child-process execution model —
  measure the actual integrated path before hard-gating a phase on the isolated number.

**Terminal state**: ROUTED INLINE to [Trustworthy Measurement](../../../repo-governance/development/practice/trustworthy-measurement.md) §2, with this exact 4x overstatement as the worked example. The `DD-10`-class candidate it mentions (replacing the outer `npx --no -- lint-staged` spawn with a direct `node_modules/.bin` call) is recorded in [`results.md`](./results.md) under M1's accepted-as-is disposition rather than filed separately — it is one line of a larger structural question about what pre-commit does.

## Learning: a new gate-emission.feature scenario needs step bindings in TWO places, every time

- **Context**: both Phase 2 (resolver-shim scenario) and Phase 3 (node_modules/.bin scenario) added
  a scenario to `gate-emission.feature` and bound it at the `emit.rs` unit-test level, per the
  phase's own authored RED step. Both times, `apps/rhino-cli/tests/gate_specs.rs`'s cucumber harness
  — which scans the whole `gate/` feature directory regardless of which scenario a given phase is
  "working on" — hit an undefined-step failure on the very next `test:quick`/pre-push run, requiring
  a same-day follow-up fix commit each time.
- **Observation**: this is now a confirmed repeat, not a one-off. The pre-push `test-quick` gate did
  catch it correctly both times (nothing shipped broken), but only after a full commit+push cycle,
  costing a wasted push attempt and a follow-up commit each time.
- **Why it might generalize**: any future phase in this plan (or any future rhino-cli change) that
  adds a `gate-emission.feature`/`gate-execution.feature`/etc. scenario must budget for TWO binding
  sites, not one — the unit-test module AND `gate_specs.rs` — and should verify
  `cargo test --test gate_specs` locally (not just the narrower `--lib gate::emit`) before ever
  committing, not rely on the pre-push gate to catch it after the fact. Worth flagging for Phase 12
  triage as a documentation gap: the RED-step convention in this plan's own delivery.md items only
  ever names the unit-test command, never the integration-test command, for scenarios of this kind.

**Terminal state**: ROUTED INLINE to [`apps/rhino-cli/README.md`](../../../apps/rhino-cli/README.md) §Adding a Gherkin Scenario: Two Binding Sites — both sites named, `cargo test --test gate_specs` given as the pre-commit verification, and the same-or-earlier-phase rule stated. Deliberately **not** placed in the Gherkin tree's own README, which is manifest-tracked inside the `apps/rhino-cli` byte-identity boundary: putting a documentation note there would have obligated byte-identical propagation to `ose-primer` and the private sibling, re-opening two sibling worktrees for a doc line. `apps/rhino-cli/README.md` is outside the manifest and is where a contributor adding a scenario already looks.

## Learning: `cargo hack check --rust-version` installs a major.minor toolchain distinct from the pinned patch

- **Context**: Phase 4's MSRV bump set `rust-version = "1.95.0"` in all four `ose-public` manifests,
  matching the already-installed `1.95.0-aarch64-apple-darwin` `rustup` toolchain exactly. The
  `compat:min-version` Nx target (`cargo hack --manifest-path apps/rhino-cli/Cargo.toml check
--rust-version`) was expected to need no new toolchain as a result.
- **Observation**: it installed one anyway — a **new**, separate `1.95-aarch64-apple-darwin`
  toolchain (1.3 GB), distinct from the already-present `1.95.0-aarch64-apple-darwin`. `cargo-hack`
  appears to resolve/invoke the major.minor form of the pinned `rust-version` rather than the exact
  patch, and `rustup` treats `1.95` and `1.95.0` as separate installed toolchains even though they
  currently resolve to the same release.
- **Why it might generalize**: Phase 9 (disk hygiene, this plan's own rustup-toolchain-pruning phase)
  should expect and account for this extra toolchain when auditing what's installed and why — it is
  a legitimate, reproducible side effect of running `compat:min-version` at all, not drift or a
  concurrent-agent artifact. Any future MSRV bump anywhere in this repo should expect the same
  `X.Y`-vs-`X.Y.Z` toolchain duplication from this exact Nx target.

**Terminal state**: ROUTED INLINE to [Rust Build Configuration](../../../docs/explanation/software-engineering/programming-languages/rust/build-configuration.md) — the MSRV compatibility gate resolves the declared floor to its major-minor form, so an exact-patch pin still yields a second `X.Y` toolchain; expect it in any disk audit and on any future MSRV bump. Landed after the concurrent PR-review fixer released the file.

## Learning: a plan step can add a Gherkin scenario that no phase can yet bind — 2nd instance of the cross-phase forward-reference class

- **Context**: Phase 5's own delivery.md text instructed adding the AC-9 and AC-10 CI-topology
  scenarios (prebuilt-binary consumption, conditional `npm ci` skip) to `gate-execution.feature`
  during Phase 5 — but AC-9 describes the `build-rhino` job Phase 6 creates and AC-10 describes the
  conditional node-setup input Phase 7 creates. Neither exists in `.github/workflows/pr-quality-gate.yml`
  yet at Phase 5.
- **Observation**: `specs gherkin-cardinality validate` passed immediately (it only checks keyword
  structure), so nothing caught this at authoring time. The real failure surfaced one layer deeper:
  `apps/rhino-cli/tests/gate_specs.rs`'s cucumber suite requires a literal, **passing** step binding
  for every scenario in the entire `gherkin/gate/` tree regardless of which phase "owns" it, and there
  was no truthful way to bind either scenario — the behavior they assert doesn't exist yet. Forcing a
  binding would have meant fabricating a fixture that asserts against nothing real.
- **Why it might generalize**: this is the same forward-reference class already logged above
  ("cross-phase forward-references in a checklist item's own text can hard-error"), but at the
  Gherkin-coverage layer instead of a Cargo-profile layer — proof it's a general planning-time gap,
  not a one-off. Fixed here by moving the scenario authoring out of Phase 5 and into Phase 6/Phase 7
  themselves, right where each behavior actually lands. The general rule this suggests for
  `plan-checker`: a step that adds a Gherkin scenario should be checked not just for keyword structure
  but for whether the behavior it describes is created by an **earlier or same** phase — never a
  later one — since this repo's coverage tools require whole-tree, always-live bindings.

**Terminal state**: MERGED into the forward-reference brief filed above — [`plan-checker-forward-reference-detection`](../../ideas/q1-urgent-important/plan-checker-forward-reference-detection.md) carries both instances, since two instances at two layers is what makes it a class.

## Learning: "does this job run git diff/nx affected" must be checked one layer deeper than the workflow YAML

- **Context**: Phase 6's fetch-depth reduction item reasoned that `build-rhino`, `enumerate`, and
  `gate` could all safely drop `fetch-depth: 0` because none of their `run:` steps invoke `nx
affected` or `git diff` directly in the workflow YAML.
- **Observation**: that reasoning was correct for `build-rhino` and `enumerate`, but wrong for `gate`
  — its single `run:` step dispatches `rhino-cli gate run --surface=ci --group=<id>`, which internally
  fans out to several affected-file-type and Nx-scoped gates (`format-verify-*`,
  `shell-docker-actions`, `specs-structure`) that themselves run `git diff`/`nx affected` against
  `origin/main` one process down. A shallow clone has no `origin/main` ref, so 3 of 6 matrix groups
  failed live in CI (`31281760676`) with "unknown revision" / "git diff ... failed" — not a flake,
  a real gap in the analysis, caught only once the real workflow ran end-to-end.
- **Why it might generalize**: "does this job need full history" can't be answered by grepping the
  job's own YAML for `git diff`/`nx affected` — it has to be answered by asking what the job's
  dispatched CLI/script does _underneath_, including any commands that further dispatch to other
  tools. Any future fetch-depth or similar shallow-clone optimization in this repo's CI should trace
  the full call chain of what a job actually invokes, not just its literal `run:` lines.

**Terminal state**: DISCARDED as a standalone rule — it is the specific case of a general principle already stated in [Trustworthy Measurement](../../../repo-governance/development/practice/trustworthy-measurement.md) §3 (establish what actually holds the property before applying the remedy) and in the CI-blocker Step 7 addition (verify by observing the consumer, not by re-reading intent). A third near-duplicate rule would dilute both rather than add coverage.

## Learning: `gate list --by-group`'s hand-wired exclusion and `gate run --group`'s membership must be the same filter, not two independent implementations of "which gates belong to this group"

- **Context**: Phase 7's `run-npm-ci` wiring derives per-group node-need from `matrix.group.doctor_tools`,
  which comes from `gate list --format=json --by-group` — a code path that already excludes hand-wired
  gates (`gate/list.rs`'s `visible_gates` filter, JSON format only) from the emitted group membership.
- **Observation**: `gate/run.rs`'s `resolve_group_gates` (the code path `gate run --surface=ci --group=<id>`
  actually executes) shared the group-_bucketing_ predicate with `list.rs` (`gates_in_ci_group`) but not
  its hand-wired _exclusion_. So the `specs` CI group's emitted membership (used to compute
  `run-npm-ci`) was `[specs-gherkin-cardinality]`, while the group actually **executed** was
  `[specs-gherkin-cardinality, specs-structure]` — `specs-structure` is `kind: nx`/`wiring: hand-wired`
  and needs `node_modules`, which `run-npm-ci=false` (correctly computed from the visible membership)
  then stopped installing. Live CI (`31284082843`) failed with "Could not find Nx modules" the moment
  this stopped being masked by `npm ci` always running unconditionally beforehand — a pre-existing,
  silently-redundant double-execution of a hand-wired gate that Phase 7's optimization exposed rather
  than caused.
- **Why it might generalize**: whenever two code paths both claim to answer "which gates are in this
  group" (one for _reporting/enumeration_, one for _execution_), a filter applied to one but not the
  other is invisible until something downstream depends on the two agreeing — here, until execution
  behavior (`npm ci` or not) started depending on enumeration output (`doctor_tools`). The fix folds
  the same hand-wired exclusion into `resolve_group_gates` so both paths compute identical membership
  from one predicate, closing the class rather than the single instance.

**Terminal state**: DISCARDED — the class is already closed in code. The fix folded the hand-wired exclusion into `resolve_group_gates` so enumeration and execution compute identical membership from one predicate, and the regression test added with it fails if they diverge again. A durable surface would not catch this better than the guard already does.

## Learning: A "pre-install the pinned toolchain" race fix only works if it installs the toolchain _name_ the racing tool actually asks rustup for

- **Context**: The `setup-rust` composite action already carried a pre-install step whose stated
  purpose was to defeat the rustup download race that parallel `cargo hack check --rust-version`
  tasks trigger. Its loop read each crate's declared `rust-version` and ran
  `rustup toolchain install "$v"`, with `$v` being the full `1.95.0` string.
- **Observation**: `cargo hack --rust-version` does not request `1.95.0` — it resolves the floor to
  its **major-minor** form and shells out to `rustup toolchain add 1.95 --no-self-update`. rustup
  stores `1.95` and `1.95.0` as **distinct toolchains in distinct directories**, so pre-installing
  `1.95.0` satisfied nothing: all four Rust crates still raced rustup for `1.95` in parallel, and
  three of four failed live in CI (`31285020618`) with a bare
  `error: process didn't exit successfully: rustup toolchain add 1.95 --no-self-update (exit status: 1)`.
  The mitigation had been in place and passing review for several phases while providing zero
  protection — its failure mode looked exactly like the original flake it was written to fix, which
  is why four prior occurrences were all classified as accepted infra flake rather than a live bug.
- **Second defect, same step**: the extraction used `grep -rhoP`. BSD grep (macOS) has no `-P`, so on
  a non-GNU-grep host the loop iterates over an empty list, installs nothing, and still exits 0 —
  a silent no-op that a local run cannot distinguish from success. Rewritten with portable `sed`.
- **Why it might generalize**: a mitigation that names a resource must name it in the **same
  vocabulary the consumer uses**, and the way to verify that is to observe the consumer's actual
  invocation, not to re-read the mitigation's own intent. The regression test added here does exactly
  that — it executes the real checked-in script with a stub `rustup` on `PATH` and asserts on the
  toolchain names the script genuinely requests, so any future drift between "what we pre-install"
  and "what the tool asks for" fails locally instead of after ~50 minutes of CI.

**Terminal state**: ROUTED INLINE to [CI Blocker Resolution](../../../repo-governance/development/quality/ci-blocker-resolution.md) as a new Step 7 — audit the mitigation when one already exists and the symptom persists, verify by observing the consumer's actual invocation, and watch for silent no-ops (the `grep -rhoP` BSD-portability defect) in the mitigation itself.

## Learning: A wall-clock target can only be moved by the critical path, so check which job actually holds it before applying the remedy the plan prescribes

- **Context**: Phase 7 Gate treats an M4 (CI wall-clock p50) regression as a hard stop and prescribes
  a specific remedy — "re-balance group composition before proceeding." Measured p50 came in at
  1,219 s against a 974.5 s baseline: nominally +25.1 %, squarely in hard-stop territory.
- **Observation**: the per-job timeline showed the run's critical path was the **TypeScript quality
  gate at 1,033 s**, and that same job took 1,030 s and 1,018 s on this branch _before_ the topology
  change — it was untouched. All six gate groups finished by 01:03:45 in a run that ended 01:16:41,
  putting them ~13 minutes clear of the critical path. Re-balancing group composition could not have
  moved wall-clock by a single second. The real gap was diff scope: this branch edits
  `repo-config.yml`, `.github/`, and governance docs, so every TypeScript project is affected,
  whereas the Phase 0 baseline sampled 18 much narrower PRs.
- **Why it might generalize**: a plan can correctly identify a metric, correctly set a threshold, and
  still hard-code a remedy aimed at the wrong component — because the remedy is written before anyone
  has seen a real timeline. Wall-clock in a fan-out DAG is a **max**, not a sum: it is insensitive to
  everything off the critical path, so any wall-clock remedy must first prove the thing it changes is
  _on_ it. The same asymmetry explains why M3 (runner-seconds, a sum) fell 47.6 % in the same runs
  where M4 rose — the two metrics were never going to move together, and a plan that treats both as
  symptoms of one cause will mis-diagnose whichever one it reads second.

**Terminal state**: ROUTED INLINE to [Trustworthy Measurement](../../../repo-governance/development/practice/trustworthy-measurement.md) §3 and §4 — wall-clock in a fan-out DAG is a max, sum-type and max-type metrics do not move together, and a remedy authored before anyone saw a timeline is a hypothesis.

## Learning: sharing one build directory across worktrees converts a disk problem into a serialization problem

- **Context**: DD-1..DD-8's target-share step points every worktree's `apps/<crate>/target` at one
  physical directory under `~/.cache/ose-cargo-target/<repo>/<crate>`. Phase 9 extended it so a
  single `doctor --fix` covers every worktree rather than only the checkout it was invoked from —
  which reclaimed 221 MB the moment it ran, because the main checkout's `apps/rhino-cli/target` was
  still a plain 221 MB directory that no one had ever shared.
- **Observation**: the saving is real and it is not free. Cargo takes an exclusive build lock on the
  target directory, so two worktrees building the same crate no longer proceed in parallel — one
  blocks. A **65 s** block was observed during this plan, with the waiting build reporting that it
  was "Blocking waiting for file lock on build directory". Widening the sharing widens the
  contention: before this change only the worktrees that had individually run `doctor --fix`
  contended; after it, every worktree does.
- **Why it might generalize**: deduplication and parallelism are in direct tension whenever the
  deduplicated resource carries a mutual-exclusion lock. The disk saving scales with the number of
  worktrees (N copies collapse to 1) and so does the contention (N builders queue on 1 lock), so the
  same parameter that makes the optimization look better makes the regression worse — there is no
  N at which one wins and the other stops mattering. Deliberately **not** fixed here: reversing the
  tradeoff means per-worktree target directories with a shared _cache_ layer (sccache or an
  equivalent), which is a design question with its own rollback story, not a tweak to a doctor step.
  Recorded so the next person meeting a mysterious 65 s stall knows it is a designed-in consequence
  and not a hung build.

**Terminal state**: MERGED into [`shared-cargo-target-lock-contention`](../../ideas/q2-not-urgent-important/shared-cargo-target-lock-contention.md) filed above, which carries both this entry and the 65 s measurement from the earlier one.

## Learning: a hardcoded count is the wrong guard for "nothing escaped the check"

- **Context**: `cargo_target_share.rs` guarded the inherited-Git-state isolation rule with
  `assert_eq!(commands.len(), 9, "seven serialized unit commands plus integration and coverage")`.
  Phase 8 legitimately collapsed six `cargo test --test X` invocations into one, and the guard went
  red at 4 — reporting a defect where there was only a restructure.
- **Observation**: the count was a proxy for the property that actually matters, which the _previous_
  assertion already checks — every inspected command starts with
  `env -u GIT_DIR -u GIT_WORK_TREE -u GIT_COMMON_DIR`. What the count was reaching for is coverage:
  that the inspected set is the _whole_ set, so no direct Cargo test command escapes the property
  check. Replaced with an equality against every `cargo test` / `cargo llvm-cov` string found by
  scanning all of `project.json` — which cannot go stale on restructuring, and unlike the count
  actually fails when a new direct Cargo command is added to a target the guard does not read.
- **Why it might generalize**: a magic number in a regression test is almost always a stand-in for a
  derivable set. It fails open in the case that matters (add a command to an uninspected target and
  the count can still be made to match) and fails closed in the case that does not (any legitimate
  refactor), which is exactly backwards. Whenever a test asserts "how many", ask what set it is
  really asserting membership of, and derive that set from the same source of truth the production
  code reads.

**Terminal state**: ROUTED INLINE to [Regression Test Mandate](../../../repo-governance/development/quality/regression-test-mandate.md) as a new subsection — never guard coverage with a hardcoded count; derive the set from the same source of truth the production code reads.

## Learning: a pinned toolchain without declared components is a race, not a pin

- **Context**: the private sibling's Rust quality gate failed intermittently across four runs.
  `apps/coralpolyp-be/rust-toolchain.toml` pinned `channel = "1.95.0"` and stopped there, while
  `apps/rhino-cli/rust-toolchain.toml` pinned the same channel _and_ declared
  `components = ["clippy", "rustfmt", "llvm-tools"]`. CI pre-installs every declared MSRV with
  `rustup toolchain install <v> --profile minimal`, which ships neither rustfmt nor clippy, so the
  `1.95.0` toolchain acquired rustfmt only as a side effect of rhino-cli's toolchain file being
  read first. `nx run-many` runs the per-crate lint targets in parallel, so whether
  `coralpolyp-be:lint` saw a usable `cargo fmt` came down to task ordering:
  `error: 'cargo-fmt' is not installed for the toolchain '1.95.0-x86_64-unknown-linux-gnu'`.
- **Observation**: the pin looked complete because the channel was pinned — the part that varied was
  invisible. A toolchain file states two things, _which_ toolchain and _what it contains_, and only
  the first is obviously a pin. Omitting the second does not fall back to a default; it falls back
  to whatever a concurrent actor happened to install. Declaring the components makes rustup
  provision them before the first cargo proxy call in that directory, which is deterministic.
- **Why it might generalize**: whenever a pin is split across "identity" and "contents", pinning only
  the identity produces a dependency on installation order that is invisible in the file, invisible
  in the diff, and reproduces only under parallelism. The tell is a failure that alternates with no
  corresponding change — and the fix is to make the contents declarative at every site, then guard
  the class rather than the site that happened to fail (here, a `gate validate` check over every
  `rust-toolchain.toml`, since the next crate added would reintroduce it).

**Terminal state**: DISCARDED as a documentation entry — the class is closed by the `gate validate` check added in this plan, which fails when any `rust-toolchain.toml` in the repo omits `rustfmt` or `clippy`, with a reproducing test. The next crate added cannot reintroduce it silently, which is exactly what the litmus test asks for.

## Learning: read Nx's group markers, not the tail of the log

- **Context**: the same failure was triaged three times as a silent crash under runner resource
  contention. The evidence was the end of the job log: a stream of `test ... ok` lines cut off
  mid-flight, then `##[error]Process completed with exit code 1` with no summary.
- **Observation**: that tail was rhino-cli's **passing** `test:quick` output. Nx flushes each task's
  captured output as the task completes, so the last block in the log belongs to whichever task
  finished last — not to the one that failed. The failing task was four blocks earlier, marked
  `##[group]❌ > nx run coralpolyp-be:lint`. Grepping the `##[group]✅` / `##[group]❌` markers
  located it immediately, and the real error was a one-line rustup message, not a crash.
- **Why it might generalize**: any tool that buffers per-task output and interleaves it breaks the
  usual "read the bottom of the log" heuristic, and breaks it in the most misleading direction — the
  tail looks truncated, which reads as a crash. Under a parallel task runner, always locate the
  failing unit by its status marker before reading any output, and treat "log ends mid-stream" as a
  statement about flush order rather than about the process.

**Terminal state**: ROUTED INLINE to [CI Monitoring](../../../repo-governance/development/workflow/ci-monitoring.md) as a new section — locate the failing task by its `##[group]❌` status marker before reading any output, and treat a mid-stream log ending as a statement about flush order rather than about the process.

## Learning: cgroup delegation is a precondition for `systemd --user` in CI

- **Context**: `coralpolyp-sandbox-linux-integration` starts a disposable `systemd --user` manager to
  exercise the Linux sandbox. It had never passed on the self-hosted fleet, failing with
  `Failed to retrieve unit state: Process org.freedesktop.systemd1 exited with status 1` and
  `error: CI could not start the disposable systemd user manager`. The script's own preconditions —
  `dbus-daemon`, `systemd`, `systemctl` present, `XDG_RUNTIME_DIR` and `DBUS_SESSION_BUS_ADDRESS`
  exported — were all satisfied.
- **Observation**: the GitHub Actions runner runs as a system service under `system.slice` with
  `Delegate=no`, so a user manager launched from a job cannot create the cgroup subtree it needs and
  exits before `systemctl --user` can reach it. Confirmed causally rather than by inspection:
  `systemd-run --slice=system.slice --property=Delegate=no --uid=1000` reproduces the error
  verbatim, and the identical invocation with `Delegate=yes` starts the manager. The fix is a
  `Delegate=yes` line in the runner service's drop-in override, expressed in the ansible playbook so
  it survives a VM rebuild.
- **Why it might generalize**: a test that needs its own process supervisor, container runtime, or
  namespace has a precondition that lives on the _host_, not in the repo, and no amount of
  in-script capability checking will surface it — `systemd` was on `PATH` the whole time. When a
  gate fails identically on every runner while its stated preconditions all pass, the missing
  precondition is one the script cannot name. Prove it with a two-arm probe that differs only in
  the suspected property before changing any provisioning.

**Terminal state**: ROUTED to the private sibling — the causal analysis is folded into that repo's `plans/ideas/q2-not-urgent-important/preexisting-deploy-workflow-failures.md` (commit `73adc2e7c`), and the `Delegate=yes` fix with its probe evidence is committed in that repo's `infra/on-premise/ansible/playbook-runner.yml`. Kept out of `ose-public` under the repo-relevance gate: it describes private on-premise runner infrastructure.
