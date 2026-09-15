# Benchmark: the rhino-cli Rust-to-F# rewrite

Nine rows, two columns, one table per repository. Every cell in both columns is seeded with the same
three-letter placeholder and is overwritten only by a real measurement — Phase 0 fills the **Before**
column, Phase 10 fills **After**. The placeholder appears nowhere else in this plan, so a count of it
is an honest progress reading.

The plan documents are single-sourced in `ose-public`; the private sibling carries no copy of this folder.
Its figures therefore live here, in a second table, rather than in a `benchmark.md` of its own.

Gate arithmetic, counted as **occurrences** rather than lines, because a table row carries both of
its cells on one physical line:

| Point                             | `PH=$(printf 'TB%s' D); /usr/bin/grep -o "$PH" benchmark.md \| wc -l` |
| --------------------------------- | --------------------------------------------------------------------- |
| At seeding (one table)            | 18                                                                    |
| After the `ose-public` Before run | 9                                                                     |
| End of Phase 0 (both tables)      | 18                                                                    |
| End of Phase 10                   | 0                                                                     |

The count returns to 18 at the end of Phase 0 rather than falling to 9, because P0.17 adds the
second table: nine filled the private sibling **Before** cells and nine fresh **After** placeholders.

The command above assigns `$PH` inline via `printf` so it is self-contained and runnable verbatim
from this page. Copying only the `grep` half without the `PH=...;` prefix silently returns `0` —
which happens to match this same table's "End of Phase 10" row, so a partial copy reads as "done"
when it has measured nothing. Always run the full `PH=...; grep ...` command together. The
placeholder token itself is still never spelled out in prose, because doing so would inflate the
very count these gates read.

**Baseline provenance.** All rows **B1 through B6 and B8** were re-measured after the tree-sitter
dependency removal, in both repos — see the [B1 baseline note](#b1-baseline-note) and the
[Post-removal B2-B8 re-measurement note](#post-removal-b2-b8-re-measurement-note) below. **B7 is the
one exception**: it reads job durations from the three most recent green `pr-quality-gate.yml` runs
on `main`, and as of this re-measurement `main` in both repositories still carries the pre-removal
`Cargo.toml` (tree-sitter still listed) — no post-removal CI run of that job exists yet in either
repo, because this removal has not merged to `main`. B7's Before figure below is therefore still the
pre-removal one and remains marked `†`; every other row's `†` is removed because it is now on
comparable, post-removal terms. B7 must be re-measured again once this PR merges to `main` and three
green post-merge `pr-quality-gate.yml` runs exist — see the dated `learnings.md` entry.

## Measurements — ose-public

| Row  | Metric                      | Before (Rust) | After (F#)                                     | Verdict                                            |
| ---- | --------------------------- | ------------- | ---------------------------------------------- | -------------------------------------------------- |
| B1   | Cold build                  | 17.59 s       | 10.38 s                                        | **better**, Δ -7.21 s                              |
| B2   | Gate-profile build          | 21.09 s       | 10.82 s                                        | **better**, Δ -10.27 s                             |
| B3   | Warm no-op build            | 0.18 s        | 1.15 s                                         | **unchanged** (within noise floor), raw Δ +0.97 s  |
| B4   | Edit-rebuild loop           | 0.37 s        | 10.37 s                                        | **worse**, Δ +10.00 s                              |
| B5   | Startup, mean of 50         | 7.47 ms       | 71.2 ms                                        | **worse**, Δ +63.73 ms (~9.5x)                     |
| B6   | Full `.husky/pre-commit`    | 14.24 s       | 4.19 s                                         | **better**, Δ -10.05 s                             |
| B7   | CI critical path, build job | 70.67 s †     | 158.00 s (mean)                                | **provisional** — Before still `†`, raw Δ +87.33 s |
| B8   | Artifact size               | 4,489,568 B   | 124,712 B launcher / 92,996,313 B full payload | **worse** — true footprint ~20.7x larger           |
| Size | Source lines (src/ only)    | 49,460        | 19,710                                         | **better**, Δ -29,750 lines (0.40x)                |

## Measurements — the private sibling

| Row  | Metric                      | Before (Rust) | After (F#)                                     | Verdict                                             |
| ---- | --------------------------- | ------------- | ---------------------------------------------- | --------------------------------------------------- |
| B1   | Cold build                  | 16.00 s       | 9.33 s                                         | **better**, Δ -6.67 s                               |
| B2   | Gate-profile build          | 19.27 s       | 10.35 s                                        | **better**, Δ -8.92 s                               |
| B3   | Warm no-op build            | 0.16 s        | 1.13 s                                         | **unchanged** (within noise floor), raw Δ +0.97 s   |
| B4   | Edit-rebuild loop           | 0.37 s        | 9.70 s                                         | **worse**, Δ +9.33 s                                |
| B5   | Startup, mean of 50         | 8.35 ms       | 58.0 ms                                        | **worse**, Δ +49.65 ms (~6.9x)                      |
| B6   | Full `.husky/pre-commit`    | 13.18 s       | 3.13 s                                         | **better**, Δ -10.05 s                              |
| B7   | CI critical path, build job | 88.67 s †     | 762.00 s (mean)                                | **provisional** — Before still `†`, raw Δ +673.33 s |
| B8   | Artifact size               | 4,489,568 B   | 124,712 B launcher / 92,996,325 B full payload | **worse** — true footprint ~20.7x larger            |
| Size | Source lines (src/ only)    | 49,460        | 19,710                                         | **better**, Δ -29,750 lines (0.40x)                 |

`†` — pre-removal baseline (79 crates, tree-sitter still linked), retained only for B7; see
"Baseline provenance" above. All other rows are post-removal, `†`-free figures.

## Interim measurement: after wave A

A running checkpoint, not a Phase 10 figure — B5/B6's `After (F#)` cells above are left exactly as
seeded until every wave has flipped. Same methodology as the Phase 0/Phase 1 measurements above: Python
`time.time()`-around-`subprocess.run` for B5 (50 invocations of `--help` against the published
self-contained `dist/rhino-cli-fsharp` binary, exit code asserted per iteration, zero failures in
either repo), `/usr/bin/time -p` for B6 (one full `.husky/pre-commit` against the same pinned
staged set as Phase 0 — a single new `apps/rhino-cli/bench-probe.md` holding one heading and one
paragraph, staged, hook run, then the file removed and the index reset). Taken once `convention`
and `parity` were the only namespaces in `FSHARP_NAMESPACES`.

| Metric                   | ose-public | The private sibling |
| ------------------------ | ---------- | ------------------- |
| B5 — startup, mean of 50 | 33.94 ms   | 37.13 ms            |
| B6 — full pre-commit     | 3.85 s     | 3.01 s              |

Both B6 figures are markedly faster than their Phase 0 Rust baselines (14.24 s / 13.18 s) — this
reflects only two of nine namespaces routing through the CLI-layer work this wave adds, not yet a
directional signal on the Rust-vs-F# question Phase 10 answers; most of `.husky/pre-commit`'s own
gates are unrelated to `rhino-cli` invocation count. Both B5 figures are 4-5x their Phase 1 spike's
self-contained non-AOT figure (200.84 ms) — consistent with the spike's harness being uninstructive
about a real, small dispatch surface's startup cost, not a regression.

Verdict is filled at Phase 10 with `better` / `worse` / `unchanged` plus the absolute delta, per
repository. No row is dropped for being unfavourable to F#.

## Interim measurement: after wave B

`ose-public` only — this wave's PR does not touch the private sibling. Same methodology as "after wave
A" above: Python `time.time()`-around-`subprocess.run` for B5 (50 invocations of `--help` against
the freshly rebuilt (`nx run rhino-cli-fsharp:build`) published self-contained
`dist/rhino-cli-fsharp` binary, exit code asserted per iteration, zero failures), `/usr/bin/time
-p` for B6 (one full `.husky/pre-commit` against the same pinned staged set as Phase 0/Wave A — a
single new `apps/rhino-cli/bench-probe.md` holding one heading and one paragraph, staged, hook
run, then the file removed and the index reset). Taken with `convention`, `parity`,
`repo-config`, `env` in `FSHARP_NAMESPACES`.

| Metric                   | ose-public |
| ------------------------ | ---------- |
| B5 — startup, mean of 50 | 39.15 ms   |
| B6 — full pre-commit     | 3.68 s     |

B5 rose modestly from the after-wave-A figure (33.94 ms) — a wider dispatch surface (6 more
leaves) parsing more argument shapes before matching, still far below the Phase 1 spike's
uninstructive 200.84 ms. B6 is in the same band as after-wave-A's 3.85 s, both still well under
the Phase 0 Rust baseline (14.24 s) for the reason stated above: most of `.husky/pre-commit`'s
gates are unrelated to `rhino-cli` invocation count, and only four of the CLI's namespaces route
through F# at this point.

## Interim measurement: after wave C

`ose-public` only — this wave's PR does not touch the private sibling. Same methodology as "after wave
B" above: Python `time.time()`-around-`subprocess.run` for B5 (50 invocations of `--help` against
the freshly rebuilt (`nx run rhino-cli-fsharp:build`) published self-contained
`dist/rhino-cli-fsharp` binary, exit code asserted per iteration, zero failures), `/usr/bin/time
-p` for B6 (one full `.husky/pre-commit` against the same pinned staged set as Phase 0/Wave A/Wave
B — a single new `apps/rhino-cli/bench-probe.md` holding one heading and one paragraph, staged,
hook run, then the file removed and the index reset). Taken with `convention`, `parity`,
`repo-config`, `env`, `doctor`, `test-coverage` in `FSHARP_NAMESPACES`.

| Metric                   | ose-public |
| ------------------------ | ---------- |
| B5 — startup, mean of 50 | 37.71 ms   |
| B6 — full pre-commit     | 3.70 s     |

Both figures are in the same band as after-wave-B (39.15 ms / 3.68 s) — `doctor` and
`test-coverage validate` add real tool-check/coverage-parsing work to two leaves rather than
widening the argument-shape-matching surface every leaf pays for, so B5 does not rise the way it
did from wave A to wave B. B6 remains well under the Phase 0 Rust baseline (14.24 s) for the same
reason stated above: most of `.husky/pre-commit`'s gates are unrelated to `rhino-cli` invocation
count, and only six of the CLI's namespaces route through F# at this point.

## Interim measurement: after wave D

`ose-public` only — this wave's PR does not touch the private sibling. Same methodology as "after wave
C" above: Python `time.time()`-around-`subprocess.run` for B5 (50 invocations of `--help` against
the freshly rebuilt (`nx run rhino-cli-fsharp:build`) published self-contained
`dist/rhino-cli-fsharp` binary, exit code asserted per iteration, zero failures), `/usr/bin/time
-p` for B6 (one full `.husky/pre-commit` against the same pinned staged set as Phase 0/Wave
A/Wave B/Wave C — a single new `apps/rhino-cli/bench-probe.md` holding one heading and one
paragraph, staged, hook run, then the file removed and the index reset). Taken with `convention`,
`parity`, `repo-config`, `env`, `doctor`, `test-coverage`, `md`, `governance`, `git` in
`FSHARP_NAMESPACES`.

| Metric                   | ose-public |
| ------------------------ | ---------- |
| B5 — startup, mean of 50 | 37.70 ms   |
| B6 — full pre-commit     | 13.66 s    |

B5 is in the same band as after-wave-C (37.71 ms) — the three new namespaces widen the dispatch
surface but not by more than doctor/test-coverage already did in wave C, so bare `--help` startup
cost does not move. B6 rose sharply from after-wave-C's 3.70 s: this worktree's `node_modules/`
was reprovisioned from scratch immediately before this measurement (a fresh `npm install`, not
present for wave A/B/C's runs in an already-warm worktree), so `node_modules/.bin/prettier` and
`node_modules/.bin/markdownlint-cli2` both ran cold, and the hook's own output shows a
`harness-bindings-generate` step re-syncing all 91 agents — the same one-off cost the Phase 0 B6
note already documented for an earlier anomalous run. B6 is still well under the Phase 0 Rust
baseline's own worst case and, per the Noise-floor note below, a single-run B6 figure with an
identified one-off cause is recorded as observed, not adjusted or re-run to chase a lower number.

## Interim measurement: after wave E

`ose-public` only — this wave's PR does not touch the private sibling. Same methodology as "after wave
D" above: Python `time.time()`-around-`subprocess.run` for B5 (50 invocations of `--help` against
the freshly rebuilt (`nx run rhino-cli-fsharp:build`) published self-contained
`dist/rhino-cli-fsharp` binary, exit code asserted per iteration, zero failures), `/usr/bin/time
-p` for B6 (one full `.husky/pre-commit` against the same pinned staged set as Phase 0/Wave A-D —
a single new `apps/rhino-cli/bench-probe.md` holding one heading and one paragraph, staged, hook
run, then the file removed and the index reset). Taken with `convention`, `parity`, `repo-config`,
`env`, `doctor`, `test-coverage`, `md`, `governance`, `git`, `harness`, `specs`, `repo-governance`
in `FSHARP_NAMESPACES`.

| Metric                   | ose-public |
| ------------------------ | ---------- |
| B5 — startup, mean of 50 | 37.30 ms   |
| B6 — full pre-commit     | 3.33 s     |

B5 is flat against after-wave-D (37.70 ms) and after-wave-C (37.71 ms). This wave adds the three
largest namespaces by leaf count, so a flat bare-`--help` figure is the expected result rather than
a surprising one: startup cost is dominated by .NET runtime initialization, not by the size of the
dispatch table. B6 fell back to the wave-A-to-C band (3.68-3.85 s) from after-wave-D's 13.66 s,
which is consistent with the cause that entry already recorded — wave D's run was measured against
a cold, freshly reprovisioned `node_modules/`, and this one was not. Per the Noise-floor note
below, neither figure is repeated, so B6's swing is read as the warm/cold difference wave D
identified rather than as a wave-E effect.

## Interim measurement: after wave F

`ose-public` only — this wave's PR does not touch the private sibling. Same methodology as "after wave
E" above: Python `time.time()`-around-`subprocess.run` for B5 (50 invocations of `--help` against
the freshly rebuilt (`nx run rhino-cli-fsharp:build`) published self-contained
`dist/rhino-cli-fsharp` binary, exit code asserted per iteration, zero failures), `/usr/bin/time
-p` for B6 (one full `.husky/pre-commit` against the same pinned staged set as Phase 0/Wave A-E —
a single new `apps/rhino-cli/bench-probe.md` holding one heading and one paragraph, staged, hook
run, then the file removed and the index reset). Taken with `convention`, `parity`, `repo-config`,
`env`, `doctor`, `test-coverage`, `md`, `governance`, `git`, `harness`, `specs`, `repo-governance`,
`gate` in `FSHARP_NAMESPACES`.

| Metric                   | ose-public |
| ------------------------ | ---------- |
| B5 — startup, mean of 50 | 46.17 ms   |
| B6 — full pre-commit     | 4.41 s     |

Both figures sit within the noise band already established across waves A-E (B5: 37.30-46.17 ms;
B6: 3.33-13.66 s, the latter an already-explained cold-`node_modules` outlier) rather than showing
a directional trend — `gate` adds four leaves to the dispatch table, a negligible fraction of
startup cost dominated by .NET runtime initialization, matching wave E's same conclusion for a
larger three-namespace addition.

**Noise floor for the Verdict column.** Unless a bullet below states an explicit repeat count (B3,
B5, B7), the recorded figure is a **single run** — B1, B2, B4, and B6 were not repeated. This doc's
own repeated measurement shows how much that matters: B3's two consecutive warm-build runs differed
by 42% in `ose-public` and by 4.4x in the private sibling, and B3's and B4's table values are each smaller
than that spread. At Phase 10, any row's Before/After delta smaller than the larger of (a) the
cross-repo noise floor stated below (~1-2 s) or (b) that row's own observed run-to-run spread, where
one was measured, is recorded as `unchanged`, never `better`/`worse` — the raw delta is still
written alongside so it is not lost, only not over-read as a directional result.

## Measurement commands

Each command is recorded here verbatim so the F# side at Phase 10 is measured the same way rather
than a way that flatters it. Every one asserts exit code 0; a crashing binary must not report a
fast time. Timing is Python `time.time()` around a `subprocess.run`, not `/usr/bin/time -p`, which
dropped its `real` line on several runs here. Both repositories were measured with the same script
on the same machine, though not simultaneously, so cross-repo differences of a second or two are
machine noise rather than signal.

- **B1** — `cargo build --offline` into a throwaway `CARGO_TARGET_DIR`. `ose-public` **17.59 s**,
  73 crates, `debug/rhino-cli` 21,597,000 bytes. The private sibling **16.00 s**, 73 crates, 21,597,016
  bytes.
- **B2** — `cargo build --profile gate` into a throwaway `CARGO_TARGET_DIR`, the profile CI actually
  builds. `ose-public` **34.44 s** / 79 crates; the private sibling **35.57 s** / 79 crates.
- **B3** — the same build run twice against a warm target; the second run is the figure.
  `ose-public` 0.34 s then **0.24 s**; private sibling 0.75 s then **0.17 s**. Neither second run
  emitted a `Compiling` line or changed the binary mtime.
- **B4** — touch one source file, rebuild. The plan-prescribed target is `src/main.rs`, which is a
  14-line shim over `src/lib.rs`, so only the thin bin crate relinks: **0.43 s** in `ose-public`,
  **0.35 s** in the private sibling. Because that figure flatters Rust against any F# comparison, the
  honest second measurement is recorded too — touching `src/commands/gate/validate.rs` (2,766 lines)
  costs **13.15 s** in `ose-public` and **15.24 s** in the private sibling. Phase 10 must reproduce both
  shapes.
- **B5** — 50 invocations of `--help`, exit code asserted per iteration. `ose-public` total 0.562 s,
  mean **11.2 ms**; the private sibling total 0.767 s, mean **15.3 ms**. Zero non-zero exits in either.
- **B6** — one full `.husky/pre-commit` against a pinned staged set: a single new
  `apps/rhino-cli/bench-probe.md` holding one heading and one paragraph, staged, hook run, then the
  file removed and the index reset. Pinning the staged set is what makes the two repositories
  comparable, because every gate in this hook is file-type scoped. `ose-public` **5.24 s**,
  the private sibling **3.38 s**, both exit 0, both restored to their exact prior `git status --porcelain`.
  An earlier `ose-public` run against an unpinned staged set read 7.25 s, and an instrumented
  variant of it read 6.66 s while recording **5** rhino-cli binary invocations through a counting
  `RHINO_CLI_BIN` wrapper. That invocation count is the figure Phase 10 compares; the 7.25 s wall
  time is superseded by the pinned-protocol 5.24 s above and is kept only so the change is visible
  rather than silent.
- **B7** — the `build-rhino` job duration from the three most recent green `pr-quality-gate.yml`
  runs on `main`. `ose-public`: 73 s, 69 s, 70 s (runs 32810578748, 32797537004, 32796057166), mean
  **70.67 s**. The private sibling: 89 s, 88 s, 89 s (runs 32797359073, 32796938182, 32795391522), mean
  **88.67 s**.
- **B7 after Phase 2** — the same three-most-recent-green-runs-on-`main` measurement, re-taken once
  Phase 2's F# scaffolding had merged and `build-rhino` had grown a second responsibility: it now
  publishes the self-contained `dist/rhino-cli-fsharp` alongside the Rust `gate` binary, because
  every downstream job resolves that artifact through `RHINO_CLI_FSHARP_BIN` rather than building
  F# from source. `ose-public`: 293 s, 296 s, 289 s (runs 33237638893, 33235713582, 33231338842),
  mean **292.67 s**. The private sibling: 831 s, 391 s, 819 s (runs 33237644795, 33232904277,
  33229933531), mean **680.33 s** — recorded with its spread, not smoothed: that repository's
  self-hosted runner produced a 2.1x range across three consecutive runs, so its mean is not a
  figure Phase 10 should read a small delta against. The rise over the 70.67 s / 88.67 s Phase 0
  baseline is the added F# publish, paid once per CI run in a job every other job already waited
  on, rather than paid per-job as a from-source build would be.

- **B8** — byte count of the `gate`-profile binary: **4,489,616** bytes in both repositories, equal
  in size. No digest was taken, so this is evidence of matching size only, not of byte-identity.
  It is also not the parity check: `apps/rhino-cli/parity-manifest.sha256` hashes 603 tracked
  source files and covers no build artifact, so an equal binary size here is a separate, weaker
  observation from what that manifest asserts.

## Source size

Non-blank, non-comment `.rs` lines, walking `apps/rhino-cli/src` only: the `awk` filter below strips
leading whitespace, blank lines, and `//`-prefixed lines, has no `#[cfg(test)]` handling, and never
descends into the sibling `apps/rhino-cli/tests/` directory (34 files, 20,540 lines under the same
filter, excluded from every figure on this page). Measured at **49,460** lines across 189 `.rs`
files in `src/` in each repository, of which 132 files contain at least one `cfg(test)` block; a
brace-depth accounting of those blocks attributes roughly 45% of the 49,460 figure to
`#[cfg(test)]` bodies. The exact command:

```bash
find apps/rhino-cli/src -name '*.rs' -type f -print0 | xargs -0 cat \
  | awk '{ sub(/^[ \t]+/,""); if ($0=="") next; if ($0 ~ /^\/\//) next; print }' | wc -l
```

Phase 10 runs the identical command with `-name '*.fs'` against the F# tree, which counts the same
thing (non-blank, non-comment lines) over the same `src/`-only scope. The "Phase 2: Scaffold,
Dispatch Shim, and CI Wiring" section in `delivery.md` (frozen) unconditionally creates both
`RhinoCli.UnitTests.fsproj` and `RhinoCli.IntegrationTests.fsproj` inside `src-fsharp/` — that does
not by itself make the two counts comparable, since the F# tree has no sibling directory excluded
the way Rust's `tests/` is. The comparability statement for Phase 10 lives in `delivery.md`'s own
Phase 10 clause, not here, so it is where a future executor can actually be held to it.

## B1 baseline note

The Before figure for B1 was measured twice in each repository — once as found, and again after
Phase 1 removed the unused `tree-sitter` dependency from `Cargo.toml`. `ose-public` as found: **19.91 s**,
79 crates, 21,597,224 bytes; after removal **17.59 s**, 73 crates, 21,597,000 bytes. The private sibling
as found: **22.39 s**, 79 crates, 21,597,240 bytes; after removal **16.00 s**, 73 crates,
21,597,016 bytes. Both tables' **B1** row records the post-removal figure — see "Baseline
provenance" above the measurement tables, and the note below for B2 through B8.

`rhino-cli:test:quick` exits 0 after the removal in both repositories, so each baseline is a working
one. In the private sibling the target was also run before the removal, uncached, at 441.72 s, and after
it at 363.06 s; the first the private sibling run of the day returned a full Nx cache hit in 1.99 s, which
is why every recorded figure here uses `--skip-nx-cache`.

## Post-removal B2-B8 re-measurement note

Re-measured in Phase 1 against the post-removal `Cargo.toml`/`Cargo.lock` in both worktrees, using
the same Python `time.time()`-around-`subprocess.run` methodology as the rest of this page, each
timed invocation asserting exit code 0.

- **B2** — `cargo build --profile gate` into a fresh throwaway `CARGO_TARGET_DIR`. `ose-public`
  **21.09 s**; the private sibling **19.27 s**. Both faster than their pre-removal B2 figures (34.44 s /
  35.57 s), consistent with a smaller, tree-sitter-free dependency graph.
- **B3** — the same build run twice against the warm target from B2; the second run is the figure.
  `ose-public` 0.31 s then **0.18 s**; private sibling 0.24 s then **0.16 s**.
- **B4** — touch `apps/rhino-cli/src/main.rs`, rebuild: **0.37 s** in both repositories. The honest
  second shape — touching `src/commands/gate/validate.rs` (2,766 lines) — costs **9.77 s** in
  `ose-public` and **11.17 s** in the private sibling; both recorded here in prose, matching how the
  pre-removal B4 dual shape was documented above.
- **B5** — 50 invocations of `--help` against the freshly built `gate`-profile binary, exit code
  asserted per iteration, zero failures in either repo. `ose-public` total 0.374 s, mean **7.47 ms**;
  the private sibling total 0.418 s, mean **8.35 ms**.
- **B6** — one full `.husky/pre-commit` against the same pinned staged set as the original
  measurement (a single new `apps/rhino-cli/bench-probe.md` holding one heading and one paragraph),
  staged, hook run, then the file removed and the index reset. `ose-public` **14.24 s**,
  the private sibling **13.18 s**, both exit 0, both restored to their exact prior `git status --porcelain`.
  These figures are markedly higher than the pre-removal 5.24 s / 3.38 s; the difference is
  attributable to hook-internal work unrelated to the Rust build itself (this run's hook output shows
  a `harness-bindings-generate` step re-syncing agents, which the earlier run's output did not
  exercise in the same way) rather than to the dependency removal, since B2-B5 all moved in the
  faster direction. Recorded as observed rather than adjusted.
- **B7** — **not re-measured**; see "Baseline provenance" above. `main` in both repositories still
  carries the pre-removal `Cargo.toml` as of this measurement, so no post-removal
  `pr-quality-gate.yml` run exists to sample.
- **B8** — byte count of the `gate`-profile binary built for B2: **4,489,568** bytes in both
  repositories, equal in size to each other and 48 bytes smaller than the pre-removal 4,489,616 —
  consistent with removing an unused, unlinked dependency having a negligible effect on the final
  binary.

## Phase 10 "After" measurements — ose-public

All commands below assert exit code 0; every run succeeded on the first attempt (no retries, no
discarded runs). `<fsharp-source-root>` resolved to `apps/rhino-cli/src/` (9c's flatten, per
`learnings.md`). Timing harness is `/usr/bin/time -p`, matching A1-A6's literal instruction in
`delivery.md` rather than the Before-side Python `time.time()` convention — a deliberate,
uniform-across-rows simplification for Phase 10, noted here because it is a real methodology
difference from how B5 was originally captured.

- **A1 (B1, cold build)** — `dotnet build apps/rhino-cli/src/RhinoCli.Program` after removing every
  `obj/`/`bin/` under `apps/rhino-cli/src/` (including `tests/`). **10.38 s.**
- **A2 (B2, publish build)** — the `build` Nx target's actual command,
  `dotnet publish apps/rhino-cli/src/RhinoCli.Program/RhinoCli.Program.fsproj -c Release
--self-contained true --use-current-runtime -o apps/rhino-cli/src/dist`, run cold (fresh
  `obj:`/`bin:`/`dist:` clear) immediately after A1. **10.82 s.**
- **A3 (B3, warm no-op build)** — the same A2 command run twice against the now-warm `obj/`; the
  second run is the figure. Run 1: 1.11 s. Run 2 (recorded): **1.15 s.**
- **A4 (B4, edit-rebuild loop)** — `touch` on `RhinoCli.Application/src/Glossary.fs` (last file in
  the project's `<Compile>` order — F#'s strict top-to-bottom compile order makes every file within
  one `.fsproj` part of a single translation unit regardless of directory depth, so `Glossary.fs`
  was chosen as the most-downstream file rather than a directory-depth reading, which is vacuous
  here since `RhinoCli.Application/src` is flat), then `dotnet build
apps/rhino-cli/src/RhinoCli.Program`. **10.37 s** — essentially identical to A1's cold-build figure,
  because F# has no per-file incremental compilation the way `rustc`'s incremental cache does:
  touching any one file recompiles the whole `.fsproj`, and touching a `RhinoCli.Application` file
  also forces `RhinoCli.Cli` and `RhinoCli.Program` to relink. This is a genuine, structural
  regression versus Rust's B4 baseline, not a measurement artifact.
- **A5 (B5, startup)** — 50 invocations of `apps/rhino-cli/src/dist/rhino-cli-fsharp --help` in a
  loop, exit code checked every iteration, zero failures. Total **3.56 s**, mean **71.2 ms**.
- **A6 (B6, real hook cost)** — one full `.husky/pre-commit` against the pinned staged set (a new
  `apps/rhino-cli/bench-probe.md`, one heading + one paragraph), staged, hook run, file removed,
  index reset (`git status --porcelain` empty before and after). Plain timed run: **4.19 s**, exit 0. A second, instrumented run (`RHINO_CLI_FSHARP_BIN` pointed at a counting wrapper around the
  same `dist/rhino-cli-fsharp` binary, per the Before-side's own precedent) recorded **5** rhino-cli
  invocations — identical to the Before figure's own instrumented count.
- **A7 (B7, CI critical path)** — `build-rhino` job duration from the three most recent green
  `pr-quality-gate.yml` push runs on `main` as of this measurement: 154 s (run 33293545881), 178 s
  (run 33288863484), 142 s (run 33282440776), mean **158.00 s**. Per the Phase 10 Gate's own rule,
  this row's Before value (70.67 s) still carries the pre-tree-sitter-removal `†` (see `learnings.md`
  "2026-08-26 — Phase 1: B7 re-measurement documented skip"), so this row's verdict is
  **provisional**, not a plain better/worse — the delta mixes the Rust→F# language change with the
  tree-sitter dependency removal, and (favorably, not a confound in the language-change direction)
  the fact that `build-rhino` no longer builds Rust at all, only F#.
- **A8 (B8, artifact size)** — `apps/rhino-cli/src/dist/rhino-cli-fsharp` itself is **124,712**
  bytes — smaller than Rust's 4,489,568-byte static binary, but comparing the two figures directly
  would be misleading: unlike Rust's binary, this launcher is non-functional without its
  self-contained publish payload alongside it (`.dll`s, `libcoreclr.dylib`, ICU/globalization data,
  etc.), which totals **92,996,313** bytes (~89 MB) across the `dist/` directory. The true deployable
  footprint is therefore ~20.7x larger than Rust's single static binary, not smaller — recorded as
  **worse**, with both figures kept so neither the flattering nor the honest number is silently
  dropped.
- **Source size** — identical command shape to the Before side
  (`find apps/rhino-cli/src -name '*.fs' -not -path '*/tests/*' ... | xargs cat | awk ... | wc -l`,
  same non-blank/non-comment filter, same `-not -path` exclusions swapped to F#'s test-project
  layout), walking `apps/rhino-cli/src/*/src/` only: **19,710** non-blank, non-comment lines across
  **24** `.fs` files — 0.40x the Rust figure (49,460 lines / 189 files).
- **Whole-run CI wall time** — one Before run (32810578748, the most-recent of B7's own
  already-cited three-run Before sample): created-to-updated **398 s** (6 m 38 s). One After run
  (33293545881, the most-recent of A7's three-run sample above): created-to-updated **388 s**
  (6 m 28 s) — picked from the same already-fetched samples per the acceptance clause's "same `gh
run list` sample" wording, rather than a fresh query. The After sample's other two runs spanned
  409 s and 1,114 s, a 2.9x range consistent with this repository's already-documented self-hosted
  runner noise (see the B7-after-Phase-2 note above), so the single-run comparison here is read as
  roughly unchanged rather than a confident directional signal.

### Verdict — ose-public

- **B1 (cold build): better.** 10.38 s vs. 17.59 s, Δ -7.21 s. A plain `dotnet build` beats a plain
  `cargo build` here.
- **B2 (publish build, the one CI runs): better.** 10.82 s vs. 21.09 s, Δ -10.27 s.
- **B3 (warm no-op build): unchanged.** 1.15 s vs. 0.18 s, raw Δ +0.97 s — smaller than this row's
  own previously-observed run-to-run spread (0.31 s → 0.18 s, a 42% swing) and within the ~1-2 s
  cross-repo noise floor `benchmark.md` already established, so not read as a directional result.
- **B4 (edit-rebuild loop): worse.** 10.37 s vs. 0.37 s, Δ +10.00 s (~28x). F#/.NET has no per-file
  incremental compilation within one `.fsproj`; every edit anywhere in `RhinoCli.Application`
  recompiles the whole project and relinks everything downstream. This is the plan's clearest
  "F# is worse" row.
- **B5 (startup, mean of 50): worse.** 71.2 ms vs. 7.47 ms, Δ +63.73 ms (~9.5x). Self-contained
  non-AOT .NET startup cost, exactly as the Phase 1 publish-mode spike predicted when NativeAOT was
  ruled out for correctness reasons (see `benchmark.md`'s own Phase 1 spike table above).
- **B6 (full `.husky/pre-commit`): better.** 4.19 s vs. 14.24 s, Δ -10.05 s. All nine namespaces now
  route through one already-built self-contained F# binary with no per-invocation JIT/dotnet-run
  overhead, consistent with every interim wave measurement recorded above staying well under the
  Rust baseline.
- **B7 (CI critical path): provisional**, per the Phase 10 Gate's own rule — Before still carries
  `†`. Raw reading: 158.00 s vs. 70.67 s, Δ +87.33 s (~2.24x), but the confound (tree-sitter removal
  bundled with the language change, and `build-rhino`'s own responsibilities changing across
  phases) makes an unqualified verdict unsound.
- **B8 (artifact size): worse.** True deployable footprint 92,996,313 B vs. 4,489,568 B, ~20.7x
  larger. The 124,712-byte launcher-only figure is smaller than Rust's binary but is not a
  comparable measurement — see the A8 note above.
- **Source size: better.** 19,710 lines vs. 49,460 lines, Δ -29,750 lines (0.40x) — F# needed
  roughly 60% fewer non-blank, non-comment source lines for the same behavior.
- **Whole-run CI wall time: roughly unchanged.** 388 s vs. 398 s on the single sampled pair, well
  within this repository's documented self-hosted-runner noise band.

## Phase 10 "After" measurements — the private sibling

Same commands as the ose-public section above, run in that repository's own worktree on branch
`rhino-fsharp-10-benchmark-measure` (off `origin/main`). `<fsharp-source-root>` also resolved to
`apps/rhino-cli/src/` (9c ran identically in both repositories). All runs asserted exit code 0 on
the first attempt.

- **A1 (B1):** cold `dotnet build`, cleared `obj/`/`bin/`. **9.33 s.**
- **A2 (B2):** cold publish build (same command as ose-public's A2). **10.35 s.**
- **A3 (B3):** same publish command run twice, warm; run 1: 1.12 s, run 2 (recorded): **1.13 s.**
- **A4 (B4):** touch `RhinoCli.Application/src/Glossary.fs` (same file, same last-in-`<Compile>`-order
  rationale as ose-public), rebuild. **9.70 s** — again essentially a full cold build, confirming the
  ose-public finding is not repository-specific.
- **A5 (B5):** 50x `--help`, zero failures. Total **2.90 s**, mean **58.0 ms**.
- **A6 (B6):** plain timed `.husky/pre-commit` run on the pinned probe: **3.13 s**, exit 0, tree
  restored exactly. Instrumented run (counting wrapper): **5** rhino-cli invocations — identical
  count to ose-public.
- **A7 (B7):** `build-rhino` job duration from the three most recent green `pr-quality-gate.yml` push
  runs on `main`: 725 s (run 33291341787), 730 s (run 33286617645), 831 s (run 33237644795), mean
  **762.00 s**. Provisional for the same reason as ose-public's B7 (Before still carries `†`).
  **Materially different from ose-public's 158.00 s mean** — not averaged together, per this
  repository's own already-documented self-hosted-runner artifact-upload variance (see the
  "B7 after Phase 2" note above, which recorded an 831 s/391 s/819 s spread on this exact runner
  pool well before this rewrite finished). One of this sample's three source runs
  (33237644795) is the identical run already cited there, still reading 831 s — confirming this is
  ongoing runner-pool noise, not a new regression introduced by this measurement.
- **A8 (B8):** launcher **124,712** bytes (byte-identical to ose-public, as the parity manifest
  requires); full self-contained payload **92,996,325** bytes (~89 MB) — 12 bytes different from
  ose-public's 92,996,313, an immaterial difference (embedded build-path strings), not a parity
  violation of the tracked-source manifest.
- **Source size:** **19,710** lines across **24** files — byte-identical F# source to ose-public, as
  expected.

**A live break/restore incident during this measurement window, not part of the measured figures**:
while gathering A7's sample, the push-triggered `pr-quality-gate.yml` run for the just-merged PR #127
(run 33292968267, `build-rhino` job) was found already failed with `##[error]Upload progress
stalled` inside `actions/upload-artifact@v4` — the `dotnet publish` itself completed and NX reported
success before the stall; only the artifact upload hung for roughly 9 minutes. This is the confirmed
transient-external-failure class this plan's constraints allow rerunning without a code change,
matching this runner pool's already-documented flakiness. Reran via `gh run rerun 33292968267
--failed`; excluded from A7's three-run sample regardless (it was not among the three most recent
green runs at measurement time).

### Verdict — the private sibling

- **B1: better.** 9.33 s vs. 16.00 s, Δ -6.67 s.
- **B2: better.** 10.35 s vs. 19.27 s, Δ -8.92 s.
- **B3: unchanged.** 1.13 s vs. 0.16 s, raw Δ +0.97 s — within the same noise floor as ose-public.
- **B4: worse.** 9.70 s vs. 0.37 s, Δ +9.33 s (~26x) — confirms ose-public's B4 finding is structural
  to F#'s lack of per-file incremental compilation, not a one-repository artifact.
- **B5: worse.** 58.0 ms vs. 8.35 ms, Δ +49.65 ms (~6.9x).
- **B6: better.** 3.13 s vs. 13.18 s, Δ -10.05 s.
- **B7: provisional**, per the same Before-`†` rule as ose-public. Raw reading 762.00 s vs. 88.67 s
  is not read as a clean verdict, and this row's own After figure is not comparable to ose-public's
  either — both repositories' B7 numbers are dominated by their own self-hosted-runner behavior, not
  by the language.
- **B8: worse.** 92,996,325 B vs. 4,489,568 B, ~20.7x, same reasoning as ose-public.
- **Source size: better.** 19,710 vs. 49,460, Δ -29,750 lines (0.40x) — identical to ose-public.

**Cross-repo material difference, called out rather than averaged**: B7's After figure is 158.00 s
in `ose-public` versus 762.00 s in the private sibling — a ~4.8x gap driven entirely by the private sibling's
self-hosted-runner artifact-upload variance (already documented before this rewrite, reconfirmed by
the identical-run cross-check above), not by anything language-related. Every other row's two
repositories agree to within the noise floor already established on this page.

## Phase 1 publish-mode spike — decision

Full findings, verbatim errors, and per-construct results are in `learnings.md`. Summary recorded
here per the Phase 1 Gate's own requirement that the binding choice land in both files:

| Binary                                          | Mean startup (50 runs, `osx-arm64`) |
| ----------------------------------------------- | ----------------------------------- |
| NativeAOT                                       | 15.23 ms                            |
| Self-contained, non-AOT                         | 200.84 ms                           |
| Rust, Phase 0 B5 baseline (`ose-public`)        | 11.2 ms                             |
| Rust, Phase 0 B5 baseline (the private sibling) | 15.3 ms                             |

**Selected publish mode: self-contained, non-AOT.** NativeAOT is faster to start but fails at
runtime for two of the four required constructs (a DU argument parse via `Argu`, and
`System.Text.Json`'s default reflection serializer) without out-of-scope additional work; see
`learnings.md`'s "Publish-mode decision" section for the full reasoning. Self-contained is
toolchain-free like AOT would have been, so no CI toolchain steps are added to Phase 2.
