# Optimize CIs — Gate, CI, Build, and Disk Cost

Make the whole quality-gate lifecycle — pre-commit, pre-push, and the PR quality gate — fast and
cheap, by removing **fixed per-invocation and per-job overhead** rather than by removing checks or
changing language.

## Context

Three surfaces enforce quality in this repository: three Husky hooks
([`.husky/`](../../../.husky/)), the generated `lint-staged` block in
[`package.json`](../../../package.json), and
[`.github/workflows/pr-quality-gate.yml`](../../../.github/workflows/pr-quality-gate.yml). All three
dispatch through [`apps/rhino-cli`](../../../apps/rhino-cli/README.md), and all three feel slow.

The motivating hypothesis was that `rhino-cli` itself is slow to start, and that a rewrite in Go
would fix it. **That hypothesis was measured and is false.** Every number below was produced by
experiment on 2026-08-08 — on this machine for local costs, and from GitHub Actions run history
across all four OSE repos for CI costs. None is estimated.

| Hypothesis                     | Measured result                                                                               |
| ------------------------------ | --------------------------------------------------------------------------------------------- |
| `rhino-cli` is slow to start   | `rhino-cli --version` on the built binary: **3.2 ms** (N=100)                                 |
| …so the gates are slow         | `cargo run --release --quiet -- --version`: **388 ms** — a **121× wrapper tax**               |
| …and a Go rewrite would fix it | A rewrite carries the identical wrapper and CI topology. It changes none of the numbers below |

The real costs sit in three places, none of which is the Rust:

1. **Process-launch wrappers.** Every generated gate command shells out through `cargo run --release`
   (~399 ms) or `npx` (~250–263 ms of overhead) to invoke work that takes 30–35 ms.
2. **CI job topology.** `ose-public` fans the gate registry out to a **41-way matrix, 45 jobs**. Each
   job is a fresh VM that re-pays a full-history checkout, a complete `npm ci`, and a Rust toolchain
   install — **268 s of job time to execute a 77 s command, 77.2 % overhead**.
3. **Build-profile and fingerprint multiplication.** The release profile is tuned for a shipped
   artifact (`lto = "thin"`, `codegen-units = 1`) but is what every gate rebuilds; and
   `rhino-cli:test:quick` compiles the same 82-dependency tree under three distinct profiles.

**The fix is not speculative — it is already running in your own repos.** `beaver-nest` groups
related checks onto shared jobs and costs **4.9× less** for the same coverage. The private sibling ran both
topologies in the same sample window, on the same runners: `actionlint` fell from **234 s to 16 s**
(14.6×) purely by moving from its own job into a grouped one.

## First principles

Each surface's cost decomposes into work and overhead. Every axis below attacks an overhead term;
no axis removes a check.

| Axis                | Cost identity                                                                     |
| ------------------- | --------------------------------------------------------------------------------- |
| **A — invocation**  | `(gate invocations) × (process-launch tax per invocation) + (real work)`          |
| **B — CI topology** | `(jobs) × (fixed per-job setup) + (real work)`                                    |
| **C — build**       | `(code recompiled per gate) × (optimization work per unit) × (distinct profiles)` |
| **D — disk**        | `(target dirs × profiles × size) + (toolchains) + (unbounded scratch)`            |

## Headline measurements

Full evidence, method, and raw data: [`tech-docs.md`](./tech-docs.md) §Measurement Baseline.

### Local — invocation tax

| Invocation                                             |      ms/run |   N |
| ------------------------------------------------------ | ----------: | --: |
| `rhino-cli --version` (direct binary)                  |     **3.2** | 100 |
| `cargo run --release --quiet -- --version`             |     **388** |  20 |
| `md <validator> validate` (direct binary, 10 md files) |   **30–35** |   3 |
| the same via `cargo run --release`                     | **375–414** |   3 |
| `./node_modules/.bin/prettier --check` (10 md files)   |     **359** |   5 |
| `npx --no -- prettier --check` (same 10 files)         |     **622** |   5 |
| `./node_modules/.bin/markdownlint-cli2`                |     **189** |   5 |
| `npx --no -- markdownlint-cli2`                        |     **441** |   5 |
| `npx nx show projects`                                 |   **3,560** |   3 |

A markdown-only commit runs the full pre-commit path in **~3,047 ms** today (hook shim 388 ms +
`lint-staged` 2,659 ms); under direct dispatch the same checks cost **~683 ms** — **4.5× faster, with
nothing removed**.

The two taxes are not equal. `cargo run` costs **~399 ms per invocation to wrap ~33 ms of work** and
is the dominant local cost; `npx` costs a real but smaller **~250–263 ms** per tool.

### CI — job topology (22-run `pr-quality-gate` sample per repo)

| Repo                      | jobs/run |    runner-seconds/run |   overhead |
| ------------------------- | -------: | --------------------: | ---------: |
| ose-public                |       45 | **10,945 s (182:25)** | **77.2 %** |
| ose-primer                |       48 |     11,683 s (194:43) |     77.0 % |
| The private sibling       |       35 |      9,239 s (153:59) |     91.9 % |
| **beaver-nest (grouped)** |   **19** |   **2,226 s (37:06)** |     80.3 % |

`setup-node` — which runs a full `npm ci` — executes **792× per 22 runs** in `ose-public` at a p50 of
**144 s**, accounting for **46.5 % of the entire gate**. Across the four repos in this sample it
consumed **414,000 runner-seconds (115 hours)**.

### Build and disk

| Measurement                                          | Value                                                                            |
| ---------------------------------------------------- | -------------------------------------------------------------------------------- |
| Cold `rhino-cli` release build (current profile)     | **53.0 s** wall / 98.7 s CPU                                                     |
| Same build, `lto=off, codegen-units=16, opt-level=1` | **19.6 s** — **2.7× faster, identical runtime**                                  |
| `rhino-cli:test:quick` wall time                     | **194 s** (typecheck 21 s, lint 10 s, test:unit 119 s, coverage 40 s, specs 4 s) |
| `target/` growth across one `test:quick`             | **222 MB → 2.7 GB** (debug 1.8 GB + llvm-cov 712 MB + release 222 MB)            |
| `ose-public` GitHub Actions cache                    | **98.0 % of the 10 GiB ceiling**; retention collapsed to ~1 day                  |
| `ose-public/local-temp/`                             | **12.31 GB** — 88.2 % of the repo, sweeper-exempt and unbounded                  |

## Scope

### In scope

| Area                                          | What changes                                                                                                                                                                                                                                                                      |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/rhino-cli/src/commands/gate/emit.rs`    | Generated gate commands resolve a prebuilt binary instead of prefixing `cargo run --release`                                                                                                                                                                                      |
| `.husky/` shims, `package.json` `lint-staged` | Regenerated to the resolved-binary form; `npx` replaced by direct `node_modules/.bin` dispatch                                                                                                                                                                                    |
| `repo-config.yml` `gates:`                    | New **required** `ci_group` field per gate entry; groups are declared, never derived                                                                                                                                                                                              |
| `.github/workflows/pr-quality-gate.yml`       | Matrix runs over declared groups, not individual gates; `rhino-cli` built once and passed to jobs as an artifact                                                                                                                                                                  |
| `.github/actions/setup-node/action.yml`       | Nx cache key stops minting a fresh 237.9 MB entry per commit                                                                                                                                                                                                                      |
| `apps/rhino-cli/Cargo.toml`                   | A dedicated fast gate profile alongside the shipped release profile                                                                                                                                                                                                               |
| `apps/rhino-cli/project.json`                 | `test:quick` stops compiling the same tree under three profiles                                                                                                                                                                                                                   |
| Disk hygiene                                  | `local-temp/` retention; unpinned toolchain pruning; worktree `target/` sharing                                                                                                                                                                                                   |
| `rust-toolchain.toml` + `Cargo.toml` MSRV     | One Rust version (`1.95.0`) across all three repos, replacing 3 disagreeing declared values; `doctor` validates the channel and, repo-wide, that every `rust-toolchain.toml` declares the `rustfmt`/`clippy` lint components (`apps/rhino-cli/src/application/doctor/checker.rs`) |
| Cross-repo parity                             | `ose-primer` and the private sibling receive the full change set under the byte-identity gate; `beaver-nest` is excluded (see below)                                                                                                                                              |

### Out of scope

- **Removing, weakening, or skipping any check.** Every gate that runs today still runs after this
  plan. This is an overhead-removal plan; coverage is invariant and is asserted as such.
- **Rewriting `rhino-cli` in another language.** The measurements above close that question: the
  binary's own work is 3–1081 ms, and every cost this plan targets would survive a rewrite
  unchanged. See [`tech-docs.md`](./tech-docs.md) §Why Not A Rewrite.
- **`rhino-cli` type-safety work** (`indexing_slicing`, `arithmetic_side_effects` crate-wide). Real,
  but unrelated to performance; it belongs in its own plan.
- New `rhino-cli` features, validators, or subcommands.
- The `TypeScript quality gate`'s 744 s of genuine `nx affected` work. It is the critical path and it
  is real work, not overhead. Reducing it is a testing-strategy question, not a CI-plumbing one.

### Affected repositories — three of four

| Repo                | In scope |                                                              Measured cost today | Rationale                                                                                                              |
| ------------------- | :------: | -------------------------------------------------------------------------------: | ---------------------------------------------------------------------------------------------------------------------- |
| `ose-public`        | **yes**  |                                             10,945 runner-s/run, 77.2 % overhead | Primary; all four axes                                                                                                 |
| `ose-primer`        | **yes**  |                                             11,683 runner-s/run, 77.0 % overhead | Highest absolute CI cost of the four; byte-identity boundary makes propagation mandatory anyway                        |
| The private sibling | **yes**  | 9,239 runner-s/run, **91.9 % overhead**, 23 `cargo run` entries in `lint-staged` | Largest proportional win; its self-hosted pool also queues at p50 18:42, so removing jobs relieves contention directly |
| `beaver-nest`       |  **no**  |                                              2,226 runner-s/run, 80.3 % overhead | Excluded — see below                                                                                                   |

**Why `beaver-nest` is excluded.** Three independent reasons, any one of which would be sufficient:

1. Its `rhino-cli` is a **fork with no `src/commands/gate/` subsystem at all** — no `emit.rs`, no
   `run.rs` `[Repo-grounded]`. Axis A and DD-3/DD-4 have no code to change there; they would have to be
   hand-written against a divergent copy.
2. It is **already the fastest repo by 4.9×**, having adopted grouped CI jobs. It is the reference
   implementation this plan copies, not a laggard.
3. It is **slated for deprecation immediately after this plan** (maintainer decision, 2026-08-08), so
   any port would be discarded within days.

**Tripwire.** If that deprecation slips past this plan's completion, the cheap repo-agnostic wins
(DD-6 gate profile, DD-8 cache key, DD-5 conditional `npm ci` — all present in its config
`[Repo-grounded]`) should be filed as a small follow-up. `delivery.md` Phase 10 records this
explicitly rather than leaving it to memory.

### Superseded plan

This plan **replaces and deletes** `plans/backlog/rhino-cli-optimization/`, per an explicit decision
recorded during pre-write grilling on 2026-08-08. That plan reached the same core conclusion — the
profile and the invocation sites are the cost, not the language — but scoped only the crate-internal
axes and never examined the CI topology, which the measurements here show is the single largest cost
centre. Deleting it is a deliberate choice, made with its contents reviewed;
[`delivery.md`](./delivery.md) Phase 1 performs the removal and de-indexes it.

## Approach summary

1. **Phase 0** re-establishes the baseline in this worktree and records every "before" number the
   plan's targets are measured against. It opens no PR.
2. **Axis A** removes the process-launch tax: the generated commands resolve a prebuilt binary, and
   `npx` gives way to direct `node_modules/.bin` dispatch. This is the pre-commit win.
3. **Axis B** adopts the grouped CI topology already proven in `beaver-nest`, keeping
   `repo-config.yml` authoritative by making the group an explicit required field rather than a
   derived one. `rhino-cli` is built once per run and passed to jobs as an artifact.
4. **Axis C** separates the shipped release profile from the fast gate profile, and stops
   `test:quick` from compiling the same tree three times.
5. **Axis D** reclaims disk and encodes the hygiene so the footprint does not regrow.
6. **A propagation phase** carries the change set across the repos each parity boundary requires,
   and a Knowledge Capture phase closes the plan.

Every axis is **behaviour-preserving by construction and by assertion**: each phase gate re-runs the
full gate set and diffs its output against the Phase 0 capture. A phase that changes what a gate
reports fails its own gate.

## Success targets

Committed numeric targets, one per surface, all measured against the Phase 0 baseline. Full
definitions and measurement commands: [`brd.md`](./brd.md) §Success Metrics.

| Surface                             |                 Baseline (measured) |                Target |
| ----------------------------------- | ----------------------------------: | --------------------: |
| pre-commit, markdown-only commit    |                            3,047 ms |          **≤ 900 ms** |
| pre-push, `rhino-cli` affected      |                               194 s |            **≤ 90 s** |
| PR quality gate, runner-seconds/run |                            10,945 s |         **≤ 3,500 s** |
| PR quality gate, wall-clock p50     |                        see `brd.md` |     **no regression** |
| `target/` after one `test:quick`    |                              2.7 GB |          **≤ 1.2 GB** |
| Actions cache utilization           |                    98.0 % of 10 GiB |            **≤ 60 %** |
| Reclaimed local disk                | 28.00 GB, 15.92 GB non-load-bearing | **≥ 10 GB reclaimed** |
| Rust version cardinality            |                 3 distinct declared |      **1, all repos** |

## Documents

| File                             | Contents                                                                                                |
| -------------------------------- | ------------------------------------------------------------------------------------------------------- |
| [`brd.md`](./brd.md)             | Business rationale, affected roles, success metrics with measurement commands, business risks           |
| [`prd.md`](./prd.md)             | Personas, user stories, Gherkin acceptance criteria, product scope                                      |
| [`tech-docs.md`](./tech-docs.md) | Full measurement baseline and method, cost model per axis, design decisions, file-impact tree, rollback |
| [`delivery.md`](./delivery.md)   | Phased, gated delivery checklist                                                                        |
| [`learnings.md`](./learnings.md) | Running log drained by the Knowledge Capture phase                                                      |

Raw evidence produced during authoring lives in `local-temp/` (gitignored):
`local-benchmark-evidence.md`, `ci-history-evidence.md`, `disk-occupancy-evidence.md`.

## Delivery Mode

`worktree-to-pr` — mandatory in `ose-public` (`main` is branch-protected including for admins). See
[`delivery.md`](./delivery.md) for the worktree declaration and delivery boundaries.

> Home prefix normalised: absolute home-directory paths in this plan's files were rewritten to a portable form (such as `~/`, `$HOME/`, or a `<placeholder>`), so captured output here is not byte-verbatim.
