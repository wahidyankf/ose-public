# Phase 1 timing

Measured 2026-10-20 on the dev Mac (warm caches, calm host) with
`examples run --single-run`; CI (ubuntu-latest) will differ, so these are
lower bounds and the projection below keeps a wide margin. CI budget:
`_reusable-ayokoding-www-examples-check.yml` gives 300 min per shard for
the full selection (60 min otherwise).

## One locked unit per toolchain (single-run wall, env image cached)

- Clojure + locked jars (PR1 Pedestal, 77-line lock): 5s.
- Kotlin + locked jars (PR6 ktor unit, 40-line lock): 4s.
- WebAssembly (smoke `ex-01-miracle`): 1s.
- Heavier closures, cold observations from the probe doubles (each execution
  recompiles/restores from scratch, so these bound the per-execution cost):
  - Rust sqlx (142 crates, `cargo run --offline`): green doubles inside the
    600s run timeout; cold compile is the long pole, on the order of minutes.
  - Dotnet EF (15 nupkgs, restore + build): ~60s cold; 10s wall warm double
    after the revocation fix (before the fix, blackholed-DNS stalls blew
    600s — see phase-1-probes.md SP3).
  - Elixir ecto (6 hex packages, deps.get + compile): green doubles; cold
    hex-seed copy + compile on the order of a minute.

## Environment image builds (one per new lockfile)

Not instrumented per pair during the probes; every probe env build
completed inside its probe run. Observed bounds: Clojure/JarFetch locks
(1–77 jars) ~30–60s; dotnet 35-package fetch + restore ~1–2 min; elixir
seed + verify ~1 min; rust 142-crate fetch ~1–2 min. All cached by lock
content afterwards — repeat runs pay zero.

## Full runs on this branch

- `examples check --all`: exit 0 (`0 opted-in courses; nothing to run` —
  the honest Phase 0 baseline: coverage grows as Phase 3 courses opt in).
- Toolchain smoke `--all --shard 1/2 + 2/2`: 24 + 20 checks passed, 0 failed
  (includes clojure locked/sorted-map, dotnet-locked, elixir-locked,
  kotlin-locked, rust-locked).
- Probes PR1–PR6 + SP1–SP4: all green doubles (see phase-1-probes.md).

## Projection (230 courses after Phase 3)

Most course units are seconds-scale (hello-world shape). The heavy
closures are a handful of database/backend courses per language (rust sqlx,
dotnet EF, elixir ecto, ktor/flyway): even at 5 min per execution × 2
executions × ~20 heavy units ≈ 200 min, plus hundreds of seconds-scale
units at ~10s × 2 ≈ under an hour — comfortably inside one 300-min shard,
and the existing `--shard K/N` split (ladder rung 2, already practiced for
the smoke suite) gives headroom to spare.

Verdict: **within budget**. No ladder action needed; keep sharding the
examples-check matrix as the corpus grows, and keep heavy-closure courses
spread across shards.
