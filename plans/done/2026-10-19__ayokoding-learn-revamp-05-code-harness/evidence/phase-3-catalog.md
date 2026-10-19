# Phase 3 Catalog — Evidence (Agent A)

Worktree `worktrees/ayokoding-learn-revamp-05-code-harness/`, branch
`ayokoding-learn-revamp-05-code-harness`. All paths below are
worktree-root-relative. Every digest was resolved on 2026-10-18 through
`rtk ./hippo run --class ephemeral --disk-path . -- docker buildx
imagetools inspect <image:tag> --format '{{json .Manifest.Digest}}'`,
which records the multi-architecture index digest. Go commands run as
`rtk ./hippo run ... --cwd apps/ayokoding-cli -- go test ...`; direct
`go` is refused by repository policy in this worktree.

## AC-3.1 — Digests pinned

`rtk git grep -n PENDING -- apps/ayokoding-cli/toolchains` prints
nothing. `toolchains list` (see below) exits 0 with one line per id.

### Official and project images

| id          | version             | pinned image                                                                                               |
| ----------- | ------------------- | ---------------------------------------------------------------------------------------------------------- |
| python      | 3.15.0              | `python:3.15@sha256:e748956ccf3f50c9555f236753bbcd5f430d3937e665d3bd6922dd0e6e591a24`                      |
| go          | 1.27.2              | `golang:1.27@sha256:820153096fda4de6ac1b7194d12e416b7dd8f4e9a33d17e0345b111b945162d8`                      |
| rust        | 1.99.1              | `rust:1.99@sha256:e259494b14672950a909b4c54527e19d29cae6ebf980672114c8bb85e5594e4a`                        |
| node        | 24.22.0             | `node:24@sha256:14078204b6bb268c107ceff6d3c43f45a888105e5c2b18b14c32b3409d93a1b0`                          |
| java        | 25.0.4.1+1          | `eclipse-temurin:25-jdk@sha256:2d5d5e9b533342a565907c84f47a2ec298c40cde7b13a3ca85d4950fa456a641`           |
| dotnet      | 10.0.402            | `dotnet/sdk:10.0@sha256:0d99ebf1ccad15037b5c98c9fe8979d6b8dbac23812feae2277a0b277b5c5ffa`                  |
| elixir      | 1.20.4 (OTP 29.1.2) | `elixir:1.20-otp-29@sha256:8241e27b8915d197eb8df4783f14490de9c9c335d03bd8a5d5613005cb2d7fc2`               |
| gcc         | 16.2                | `gcc:16@sha256:17043c23ec2ad97fc3beca18da77275d26be5db5cd70ea0a5d73200e21a8e999`                           |
| racket      | 9.3                 | `racket/racket:9.3@sha256:9e175f049faa155ca5137dcb6d56799a7511072495271c56d4778e0639e6e3af`                |
| ocaml       | 5.5.1               | `ocaml/opam:debian-13-ocaml-5.5@sha256:339d51104ae5e460c3fa42439ad2745bd9a42c9fd027d4f5fedd7361dc904584`   |
| swift       | 6.4.1               | `swift:6.4@sha256:6fbd5978b56a5a9ff05a48f8f678079fc45be496ecda15b4e74e8944fab857be`                        |
| dart        | 3.13.5              | `dart:3.13@sha256:8604cbd137b6d67c24f49b916f2aa9b67d71b539576e0178bf161d831c9e344f`                        |
| powershell  | 7.4 LTS             | `powershell:7.4-ubuntu-22.04@sha256:62300a213a9293916333df2b014cd3a8f22fb0b0b65f2bb446aaf436bcf8c868`      |
| postgres    | 18.6                | `postgres:18@sha256:74935e72241653ca55e0414067e6d8763aceb8a810eb51b452253ec3dcfc4336`                      |
| neo4j       | 2026.09.0 Community | `neo4j:2026.09.0@sha256:d6269a020149934597c8c3df926d080a612796dbbb48861ca9d5b1109cabf0d8`                  |
| swift-parse | 6.4.1               | same image as `swift`                                                                                      |
| opentofu    | 1.13.1              | `ghcr.io/opentofu/opentofu:1.13.1@sha256:1df996fca13806a20d5a3d3ad54acdcf76bcb1aa4ac30b5ba169b9e4cecdbcc8` |

Sources are the Phase 0 version table; digests re-resolved here on
2026-10-18. Floating tags (`:24`, `:18`) are frozen by the digest.

Tag corrections against Phase 2 (both inside the owned
`toolchains/catalog.yaml`):

- `ocaml/opam:5.5` does not exist; the Linux OCaml 5.5 image is
  `ocaml/opam:debian-13-ocaml-5.5` (tag list read from Docker Hub).
- `powershell:7.6` does not exist: 7.6 has preview tags only on MCR,
  and the `lts` list tag still resolves to 7.2.19. The catalog takes
  the 7.4 LTS line (`7.4-ubuntu-22.04`) per the "7.x LTS" policy;
  the version field changes `7.6.7` to `7.4 LTS`.

Architecture notes (verified with `imagetools inspect` media types):

- `racket/racket:9.3` and `powershell:7.4-ubuntu-22.04` are single
  amd64 manifests, not indexes. They run under emulation on arm64
  (verified: an amd64 `cat /etc/os-release` runs on this host) and
  natively on amd64 CI.
- Every other entry above resolves to a multi-arch index or list.

### Derived images (content-hash tags)

Tag and digest are both the `catalog.DerivedTag` hash over the base
digest, the Dockerfile bytes, and the build arguments (no registry
digest exists for locally built images; decision D13). Any recipe byte
moves the tag; `TestCatalogDerivedTagsMatchRecipes` enforces it.

| id             | tag (= digest)                                                     |
| -------------- | ------------------------------------------------------------------ |
| typescript     | `b7c9c03f556ecef1da8571cb3ddceb9697254b8d4b0a473b73672eb4821bdd14` |
| kotlin         | `812eaeff10297e717fd044f54eac1525dbe72932f95b9816274ab343969b0b1e` |
| lua            | `3b2f3dc54d52710af0d9961a36317b2cfa88c1738bc7869ae1dad19e6283e7b0` |
| luajit         | `071b09ec4233e8724109a95572118460ee156fd33fcbe0e10b6185328bef10d4` |
| neovim         | `0ebf17227a338bf2246967ffa9fd43153979bd29e967f7fda6c3fc0cc04c812a` |
| flutter        | `9d48cad1e11da367d65c9d373d1791f550ce5c7980235636a678b037478e1ecc` |
| shell          | `a9e969bb659a65d9a2a74d75d42a324c58f62bbac87927a43981426bbf52b57a` |
| ktlint         | `8b7611ee4960c516abda5bd72290caff76ec9bd256f9fb8429909f4c533d0dee` |
| kubeconform    | `945b3d03cd56e93e524515b058b189f231adbf62ded8de4dd94f12d483201416` |
| windows-static | `f92e8b786d3f1edb47402da464b9a52f76c461ab26d3619b85fa265c5b707fa5` |

Full references read
`ayokoding-toolchain/<id>:<hash>@sha256:<hash>`.

`toolchains list` acceptance (`CLI-BUILD`, then the binary through the
hippo wrapper): exit 0, 27 lines, each with kind, version, and pinned
image. Output saved in the turn transcript.

## AC-3.2 — Build argv and `toolchains build`

New packages (all owned paths):

- `internal/domain/containerplan/build.go`: pure planning. `Settings`
  (`ContainerCLI`, default `docker`; `CacheDir` for
  `AYOKODING_BUILDX_CACHE`), `Invocation{Binary, Args}` (the name the
  exhaustruct pattern expects), `Build{Tag, Invoke, Files,
ContextDir}`, `Derived` (exact `buildx build --load` argv plus
  `--cache-from type=local,src=<dir>` and `--cache-to
type=local,dest=<dir>-new,mode=max` when the cache dir is set),
  `Environment`/`EnvironmentDockerfile` (lockfile to `/deps/lock/`,
  install argv as JSON `RUN`, sorted `ENV`), `EnvironmentTag`
  (`ayokoding-env/<toolchain>:<hash>`), `Inspect` (`image inspect`).
- `internal/adapters/containers/build.go`: executes plans with a
  context through an injectable `Exec` (default `os/exec`,
  architecture rule `exec-scope` already allows this package;
  gosec G204/G304 already excluded repo-wide). Failures return
  `ayokoding.examples.env-build-failed` with the last 40 log lines.
  The code is a package literal: the finding registration and the
  `toolchains build [ID]...` wiring live outside this agent's file
  set and are handed to the root (see Handoffs).

RED (`GO-TEST ./internal/domain/containerplan/...` against compiling
stubs): every row fails on assertion, e.g.
`unpinned base "docker.io/library/node:24" planned without an error`.
GREEN: 12/12 pass with `-race`. Adapter RED then GREEN the same way
(6/6, stub exec, `t.TempDir` context parent per codebase precedent).

REFACTOR: `CLI-QUICK` lint is green after fixing 7 findings in the new
files (gofumpt alignment, `SplitSeq`, preallocated argv, `settings`
receiver names, static stub errors, `errors.As`). No new exclusion.

## AC-3.3 — Derived images

One `toolchains/<id>/Dockerfile` per id. Every download is checked
with `sha256sum -c` against a literal (no pipes: checksum file then
check). Debian packages come from `snapshot.debian.org` at
`20261017T204620Z` (trixie, trixie-updates, trixie-security all
probed 200); Ubuntu packages for `windows-static` come from
`snapshot.ubuntu.com` at `20261017T000000Z`. Every image ends on a
non-root user (`node`, `ubuntu`, or a created `harness`); kubeconform
is `scratch` (no user database; the harness `--user` applies at run).

Download pins:

| download                           | SHA-256                                                                                                   |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- |
| typescript-7.0.2.tgz (npm)         | `da2513f4...e59371c08` (full hash in Dockerfile)                                                          |
| kotlin-compiler-2.4.21.zip         | `7cc140e7...01c33e75cd`                                                                                   |
| lua-5.5.1.tar.gz                   | `1c4b4068...4373dce`                                                                                      |
| LuaJIT-2a8e017.tar.gz              | `54705d4b...be7144`                                                                                       |
| nvim-linux-x86_64.tar.gz           | `474430d5...811d87`                                                                                       |
| nvim-linux-arm64.tar.gz            | `8f1f64a0...c815`                                                                                         |
| flutter_linux_3.41.5-stable.tar.xz | `18901d45...bac7f4fdb` (published in releases_linux.json)                                                 |
| ktlint 1.8.0                       | `a3fd6202...3706d75`                                                                                      |
| kubeconform-linux-amd64.tar.gz     | `9bc2bffb...f5a92` (matches published CHECKSUMS)                                                          |
| kubeconform-linux-arm64.tar.gz     | `1f53fc8e...4ed87` (matches published CHECKSUMS)                                                          |
| k8s schemas                        | commit `93153a1458e24e93f386c50f9980d584fcba574b`, sparse checkout of `v1.34.12-standalone` and `-strict` |

`scripts/lint-dockerfiles` over all ten: exit 0 (only info-level
DL3066/SC2016 remain, below the warning threshold).

Builds (`docker buildx build --load --tag
ayokoding-toolchain/<id>:<hash>` with the tags above): exit 0 for
every id; tags recorded in the table.

Fixes at the Dockerfile, never by loosening a pin:

- In-container TLS to `snapshot.debian.org` fails certificate
  verification, so apt sources use `http://` (integrity still comes
  from the signed InRelease). Same preemptively for Ubuntu snapshots.
- `debian:trixie-slim` and Temurin ship no `curl`: Debian recipes
  install it from the snapshot; Temurin recipes fetch through a
  Debian fetcher stage and `COPY --from`.
- `jar xf` drops the executable bit: explicit `chmod +x` on the
  kotlinc launchers.
- `kubeconform version` validates a file called `version`; the probe
  is `kubeconform -v`.
- The Flutter `<commit-hash>` URL path 404s for 3.41.5; the
  `releases/stable/linux/` path serves the published bytes (hash
  verified at build).
- The Flutter SDK archive is x64-only and cannot execute in an arm64
  container (`qemu-x86_64` misses the x64 loader), so the
  `flutter --version` warm-up runs only on `x86_64`; other
  architectures still build exit 0 with identical recipe bytes.
  amd64 execution (CI) is native; arm64 execution needs an
  `--platform linux/amd64` image, which Phase 5 may choose.
- ktlint reports `standard:filename` on `main.kt`; the fixture file
  is `Main.kt`, silent with exit 0 (verified in the built image).
- kubeconform needs `{{ .ResourceKind }}{{ .KindSuffix }}.json`
  (read from its registry source), an explicit `-kubernetes-version
1.34.12`, and both `-standalone` trees; verified exit 0 offline.

## AC-3.4 — Toolchain smoke fixtures

`tests/testdata/toolchain-smoke/<id>/`: 27 opted-in courses, one per
catalog id, each with `learning/code/ex-01-hello/` (run.yaml, code,
expected files) and a `learning/lessons/<id>.md` in the canonical
anchor shape (standalone `**path**` anchor, fenced file bytes,
`**Output**` anchor, fenced expectation). A `/tmp` probe checks all
52 anchored fences byte-equal their files: 52 checked, 0 failures.

Course highlights: compiled languages use build+run pairs; `dotnet`
runs the built dll; `flutter` is a `kind: check` `flutter test` with
`stdout: ignore`; services query for real (`select 1` over a minimal
stdlib PostgreSQL wire client; `RETURN 1 AS one` over the Neo4j HTTP
API); both scripts were run against live pinned containers and print
exactly `1`. Validators are static with notes: `swiftc -parse`
(ios), `ktlint` (android), `tofu init -backend=false` + `tofu
validate` (cloud, provider-free so offline-safe), `kubeconform
-strict` with the baked schemas (cluster), mingw `-fsyntax-only`
plus a PowerShell parser error count printing `0` (windows).

Acceptance: `examples validate --content
apps/ayokoding-cli/tests/testdata/toolchain-smoke` exits 0 (binary
rebuilt after the pin; discovery proven with `--course python` exit 0
and `--course nope` exit 2).

## Phase 3 Gate

- [x] No `PENDING` digest; `toolchains list` exits 0.
- [x] Every derived image builds (ten tags above, exit 0 each).
- [x] `CLI-QUICK` lint/typecheck/unit green except one out-of-set
      Phase-2 test (see Handoffs); every in-set package passes with
      `-race`, architecture tests pass, `CLI-INTEGRATION`
      `tests/integration` passes (signals). The 8 failing BDD scenarios
      are agent B's unimplemented Phase-4 sync scenarios, failing
      identically with and without this phase's changes.

## Handoffs (out-of-set changes, for the root)

This agent's file set ends at the adapter boundary. Two follow-ups
need files outside it:

1. Phase-2 test update (`internal/adapters/cli/validate_test.go`,
   `TestValidateAndList/unpinned_embedded_catalog_refuses_*`): the
   embedded catalog is now pinned by design, so the refusal rows fail
   (`status=0, want 2`). They should assert the pinned catalog loads
   (the refusal path stays covered by the `catalog` domain tests and
   `tests/testdata/catalog-unpinned.yaml`).
2. `toolchains build [ID]...` wiring (`internal/adapters/cli/`,
   plus registering `ayokoding.examples.env-build-failed` in
   `internal/domain/finding/`): call
   `containers.Builder{}.BuildDerived` per selected derived entry
   (Dockerfile bytes from `toolchains.Files()` at `entry.Build`),
   print `id tag` per build, map the coded error through the existing
   renderer. Suggested adapter note: strip the `@sha256:` suffix when
   running a locally built `ayokoding-toolchain/` reference, since a
   `--load` image carries no registry digest.

## Notes for Phase 5

- The postgres/neo4j scripts read `PGHOST`/`PGPORT`/`PGUSER`/
  `PGDATABASE` and `NEO4J_HOST`/`NEO4J_PORT`, defaulting to the
  catalog service alias; they print exactly `1`.
- `racket` and `powershell` images are amd64-only (emulated locally).
  The Flutter SDK archive is x64-only with the same consequence; its
  image warm-up is `x86_64`-conditional for the same reason.
- `swiftc -parse`, `ktlint`, `tofu`, and `kubeconform` silence was
  verified where runnable; the smoke expectations encode it.
