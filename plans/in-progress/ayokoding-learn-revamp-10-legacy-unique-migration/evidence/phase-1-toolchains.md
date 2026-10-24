# Phase 1 Toolchains — Plan 10 (absorbed plan-09 foundation + AC-1..AC-5)

## Foundation (plan 09's toolchain slice, absorbed per user decision)

Plan 09 is unmerged, so its `clojure` entry and `java` install recipe do not
exist on `origin/main` (Phase 0 contracts). Built here first per plan 09's own
specs (`tech-docs/004-code-harness-and-determinism.md`, `delivery.md` AC-2.1/2.2).

Deviations from plan 09's letter (same intent, forced by the as-built CLI):

- No `missing-install-recipe` finding exists in the merged CLI (validate only
  checks the lockfile path), so the java RED is the runtime exit-mismatch, not
  a validate finding. Same TDD function: fails before, passes after.
- A toolchain build's context holds only its Dockerfile, so no recipe can COPY
  a sibling file (all existing recipes are self-contained). `JarFetch.java` is
  checked in once under `toolchains/java/`; every Dockerfile regenerates it
  with a base64 fetcher line (heredocs break the repo's hadolint gate, which
  has no heredoc support; the pipe-free `echo > tmp && base64 -d` form also
  satisfies DL4006), and the byte-identity arch unit decodes every fetcher
  line back to the source byte for byte. New images run as the default user
  (no `USER ubuntu`: DL3066 info).
- The environment planner rendered `FROM <derived>@sha256:<content-hash>`,
  which the local daemon cannot resolve (no RepoDigest), forcing a registry
  pull that cannot succeed. `EnvironmentDockerfile` now resolves harness-local
  refs through the existing `RunRef` (bare content-hash tag); official pins
  are untouched. First install recipe on a derived image; proven by the
  java-locked run below. New unit `TestEnvironmentDockerfile_stripsLocalDigest`.
- New `internal/domain/lockfile` package: the lock-agreement unit both plans
  share (two-field grammar now; AC-1 extends it to the three-field form).
- `nx run ayokoding-cli:build` reads stale cache after toolchain-tree edits;
  foundation builds use `--skip-nx-cache`.

### RED outputs (saved)

- `examples validate --course clojure`: `ayokoding.runspec.unknown-toolchain:
toolchain "clojure" is not a language or validator in the catalog`.
- `examples run --course java-locked`: `ayokoding.examples.exit-mismatch:
run "main" differs: expected exit 0, actual 1` ($JARS unset, no recipe).

### GREEN (all exit 0)

- `toolchains build java` → `ayokoding-toolchain/java:edf26202…`;
  `toolchains build clojure` → `ayokoding-toolchain/clojure:bc662af9…`
  (tags replicate `DerivedTag`; kotlin cross-check byte-exact; build output
  tags match the catalog pins).
- `examples validate --course clojure --course java-locked`: exit 0.
- `examples run --course clojure / java-locked`: passed, two executions agree.
- `examples check --all` over toolchain-smoke: 29 of 29 applicable covered
  (after fixing a sync anchor finding in the new java-locked lesson).
- `ayokoding-cli:test:quick`: 9 targets green (lint incl. 0 issues on the new
  `lockfile` package, the planner fix, and the arch test).
- Jar hashes recorded 2026-10-20 from repo.maven.apache.org: clojure 1.12.6
  `21b578db…`, spec.alpha 0.5.238 `94cd99b6…`, core.specs.alpha 0.4.74
  `eb73ac08…`; smoke lock: gson 2.13.1 `94855942…`, slf4j-api 2.0.17
  `7b751d95…`; AC-2 lock: test.check 1.1.3 `8b0637b1…`.

## AC-1 — JarFetch repository field (commit e4599a4, joint with AC-2)

- RED: lock-agreement unit rejects three-field lines (no `Repository` field);
  `examples run --course java-repos` fails in env build (JarFetch exit 1 on
  the `clojars` line; Central 404s migratus as the plan requires).
- GREEN: `JarFetch.java` parses the optional third field (`central` default,
  `clojars`), rejects any other name naming the line, SHA-256 unchanged; Go
  `lockfile.ParseLine` mirrors the grammar (`Repository`, default central,
  `ErrBadRepository`). New smoke course `java-repos` (gson Central +
  migratus 1.6.8 `2bb23f04…` Clojars) passes, two executions agree.
- Negatives (scratch copies, discarded): changed hash → `JarFetch: hash
mismatch for lock line: …`; `elsewhere` → `JarFetch: unknown repository
(want 'central' or 'clojars'): …`; unit never starts in either.
- REFACTOR: recipe note on the catalog `install` block; `CLI-TEST` green.

## AC-2 — clojure install recipe (commit e4599a4, joint with AC-1)

- RED: `examples run --course clojure` fails on the new locked unit
  (`nondeterministic` from the missing test.check jar — same TDD function).
- GREEN: `toolchains/clojure/JarFetch.java` byte-identical copy;
  Dockerfile regenerates it (base64 fetcher, byte-identity unit decodes);
  wrapper classpath = 3 core jars + sorted `$JARS` explicit entries;
  catalog `install` block (`JARS=/deps/clojure`).
  Image `ayokoding-toolchain/clojure:7c9b9f0d…`.
- Fixed during GREEN: seed arity (`generate` takes size then seed —
  `(gen/vector … 1 3) 10 42` → `sample: [2]` deterministic); lesson fences
  regenerated from sources (hand-typed backslashes drift; generator keeps
  them exact).
- Runs are `--network none` by construction (`containerplan/run.go`
  defaults empty network to none); classpath order pinned in expected
  stdout (core jars first, locked jars sorted).

## AC-3 — kotlin install recipe (commit 03e0e70)

- RED: new smoke course `kotlin-locked` (gson 2.13.1 `94855942…`) fails —
  no recipe, `$JARS` unset (kotlinc fails with run-specific jansi temp
  paths, same TDD function).
- Root causes fixed during GREEN (all proven end to end):
  - kotlin image runs as `ubuntu`: pre-create `/deps/lock /deps/kotlin`
    owned by ubuntu in the recipe (as root, before `USER ubuntu`).
  - build contexts were written 0600: `COPY` preserves the mode into the
    image, so a non-root runtime cannot read the lock
    (`AccessDeniedException`). Product fix in `adapters/containers`
    `writeFiles` → 0644 with comment (contexts hold recipes and lock
    coordinates, never secrets); no test pinned the old mode.
  - kotlinc and the `kotlin` runner do not resolve a bare `$JARS/*`
    wildcard (warning + `ClassNotFoundException` though the jar is
    present — proven with `javap`, which resolves it fine). The smoke
    expands `$JARS` to explicit sorted entries in shell first
    (`ls | sort | sed | paste -sd:`); every entry still comes from
    `$JARS`, and the expectation (`stderr: ignore`, dotnet precedent)
    covers kotlinc's per-run jansi note.
- GREEN: `toolchains/kotlin/JarFetch.java` byte-identical copy;
  `install` block (`JARS=/deps/kotlin`); image
  `ayokoding-toolchain/kotlin:97e1de2a…`; `kotlin-locked` passes, two
  executions agree; CLI quick 9/9; smoke 31/31 over two shards (full
  `check --all` sheds under host memory pressure; shards are the same
  command with `--shard 1/2`, `2/2`).
- The joint AC-1/AC-2 commit message covers AC-1's files; the pending
  `toolchain_files_test.go` rework (strings.Cut + base64 suffix) rode
  with this commit.

## AC-5 — install-recipe decisions (Phase 0 inventory: none of the three has one)

- `rust`: `recipe missing` (catalog entry has no `install` block).
- `dotnet`: `recipe missing` (catalog entry has no `install` block).
- `elixir`: `recipe missing` (catalog entry has no `install` block).

## AC-5 — rust install recipe

- RED: new smoke course `rust-locked` (itoa 1.0.15 `4a5f13b8…`) fails —
  no recipe, cargo cannot resolve itoa offline (exit 101, network blocked).
- Design (all proven empirically before writing): `toolchains/rust/fetch.py`
  (stdlib only) parses `Cargo.lock`, downloads each `.crate` from
  `crates.io/api/v1/.../download` (the `/api/v1` path: the static host
  403s it), verifies SHA-256 against the lock, extracts to
  `/deps/rust/<name>-<version>/` with a hashed `.cargo-checksum.json`;
  the unit builds with `--offline --quiet --config` source replacement
  (no image config file) and a default target dir (`/tmp` is noexec in
  run containers; each execution gets a fresh working copy so the repo
  stays clean and `Cargo.lock` is never rewritten).
- GREEN: `install` block (`[python3, /opt/tools/fetch.py,
/deps/lock/Cargo.lock, /deps/rust]`); image
  `ayokoding-toolchain/rust:5bb4098b…`; `rust-locked` passes, two
  executions agree; CLI quick green; smoke 33/33 over two shards.
- REFACTOR: new arch unit `TestFetcherBlocksMatchSources` pins every
  `toolchains/<id>/fetch.py` byte for byte into its Dockerfile fetcher
  line (per-directory pairing; the JarFetch decoder skips the
  fetcher-specific staging name). Dockerfile usage probe (`exit 2`)
  mirrors JarFetch.

## Drive-by fix — flutter smoke (pre-existing, found verifying AC-5)

- `flutter` went red for every UID once its image aged past the
  version-check stamp: two compounding causes, both root-caused with
  exact-flag container replays. (1) The harness `HOME=/tmp/home`
  override hides the image's user-level git exception, so git calls in
  `/opt/flutter` die with dubious-ownership for all users. (2) The
  `flutter_version_check.stamp` rewrite crashes on the read-only root
  once stale, a time bomb the six symlinked sibling stamps avoided.
- Fix: system git exception (`git config --system --add safe.directory`)
  plus the stamp in the `/tmp` symlink loop. The offline version check
  still notes its read-only fetch failure to stderr on stale-stamp days,
  so the unit takes `stderr: ignore` (exit status is the check signal,
  same rationale as dotnet/kotlin). New image
  `ayokoding-toolchain/flutter:b5318977…`; `flutter` passes, two
  executions agree.

## AC-5 — dotnet install recipe (commit ba450c1; recipe pin in 3d45a47)

- RED: new smoke course `dotnet-locked` (Newtonsoft.Json 13.0.3) fails —
  no recipe, restore must reach the network (exit 1).
- Pivots, all proven empirically: NuGet `contentHash` values are NOT
  nupkg checksums (direct SHA-512 differs), so only NuGet itself can
  check them — the recipe rebuilds the locked project in /tmp and
  restores it `--locked-mode` (NU1403 on tampered entries, proven), then
  stages the nupkgs to /deps/dotnet. No Dockerfile: the base SDK image
  already carries everything. Units restore `--locked-mode` through the
  committed NuGet.Config (defaults cleared, offline by construction);
  the `dotnet restore --source` flag misparses against /deps paths
  (bare `RestoreSources=` MSBuild property), hence the config file.
- GREEN: `dotnet-locked` passes (`answer: 42`), two executions agree;
  CLI quick green; smoke 35/35 over two shards.

## AC-5 — elixir install recipe

- RED: new smoke course `elixir-locked` (thoas 1.2.1) fails — no hex,
  no rebar3, empty cache (exit 1).
- Design (all proven empirically): `toolchains/elixir/fetch.py` parses
  `mix.lock` hex entries, seeds a scratch project whose `mix deps.get`
  populates fixed HEX_HOME/MIX_HOME, then verifies every tarball
  SHA-256 against the lock's own checksum (matches: thoas tarball
  `e38697ed…`). The recipe pins hex 2.5.3 (`local.hex --force 2.5.3`);
  rebar3 follows upstream stable. Run-side subtleties, both root-caused
  with exact-flag replays: hex persists the registry on every
  resolution (read-only image layer refuses), so the unit copies the
  Hex seed to a fresh home; rebar3 must execute from the image (/tmp
  refuses execution), so MIX_HOME stays in the image. `mix run
--no-compile` after redirected get+compile keeps stdout clean.
- GREEN: `install` block (shell composes local.hex/local.rebar/fetch.py;
  `HEX_OFFLINE=1`); image `ayokoding-toolchain/elixir:12856e7c…`;
  `elixir-locked` passes, two executions agree.
