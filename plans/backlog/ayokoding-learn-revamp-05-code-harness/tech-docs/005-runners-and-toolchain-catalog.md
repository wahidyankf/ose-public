# Runners and the Toolchain Catalog

Decision 32: anything that runs in a Linux container runs for real, including PostgreSQL and Neo4j.
Cloud, cluster, iOS, and Android code uses `mode: static`, and so does Windows code by the same
reasoning (decision D12). This file defines the catalog, the images, the container invocation, and
the static validators.

## The Catalog

`apps/ayokoding-cli/toolchains/catalog.yaml` lists every toolchain and service. The package
`apps/ayokoding-cli/toolchains` embeds it, together with each derived image's `Dockerfile`,
through `go:embed`, so a built binary carries the exact catalog it was tested with. The binary's
`--version` output names the catalog hash.

```yaml
schema: ayokoding.toolchains/v1
toolchains:
  - id: python
    kind: language
    version: "3.14.8"
    image: docker.io/library/python:3.14.8-slim@sha256:<digest recorded in Phase 3>
    env:
      PYTHONDONTWRITEBYTECODE: "1"
    install:
      lockfiles: [requirements.lock]
      command: [pip, install, --require-hashes, --no-deps, --target, /deps/python, -r, /deps/lock/requirements.lock]
      env:
        PYTHONPATH: /deps/python
  - id: postgres
    kind: service
    version: "18.6"
    image: docker.io/library/postgres:18.6@sha256:<digest recorded in Phase 3>
    env:
      POSTGRES_HOST_AUTH_METHOD: trust
    ready: [pg_isready, -h, 127.0.0.1, -U, postgres]
    readyTimeout: 60s
    connect:
      PGHOST: postgres
      PGUSER: postgres
      PGDATABASE: postgres
```

Field rules:

- `kind` is `language`, `validator`, or `service`.
- `image` is always `<repository>:<tag>@sha256:<digest>`. A reference without a digest is the
  validation finding `ayokoding.catalog.unpinned-image`, and the CLI refuses to load the catalog
  (exit 2).
- `build` names an embedded `Dockerfile` for a derived image (see below).
- `install` is the dependency recipe: the lockfile names it accepts, the install argv, and the
  variables that make `/deps` visible at run time. `link` entries ask the harness to place a symlink
  in the run's working copy, for example `node_modules -> /deps/node_modules`, for runtimes that only
  resolve dependencies next to the code.
- Services carry `ready`, `readyTimeout` (at most 120s), and `connect` variables. They never use
  passwords: PostgreSQL uses `trust` authentication and Neo4j uses `NEO4J_AUTH=none`, because the
  service lives on a network with no route out and is deleted after the unit.

## Catalog Entries

Versions come from upstream sources read on 2026-10-09. Phase 0 re-checks each version, and Phase 3
resolves and records each digest at execution time.

**Version policy.** Each entry takes the newest final release on the day Phase 0 runs, never a beta
or release candidate. These exceptions apply:

| Toolchain or service | Line taken                                                |
| -------------------- | --------------------------------------------------------- |
| Node.js              | The Active LTS line                                       |
| Java                 | The newest LTS                                            |
| .NET                 | The newest LTS                                            |
| Flutter              | The repository's `.fvmrc` pin                             |
| PostgreSQL           | The 18 line, which the courses teach                      |
| Neo4j                | The newest calendar release with Cypher 25 (decision D14) |
| LuaJIT               | The newest commit on `v2.1`                               |

For example, Python 3.15.0 was scheduled for 2026-10-09; if it is final when Phase 0 runs, the
catalog takes 3.15. Phase 0 records each chosen version and its source in the evidence. Because the
policy is fixed here, a newer line needs no user decision; content plans align their courses to the
catalog.

| Id               | Kind      | Version (2026-10-09)                 | Image or source                                                                                                                                                                                               | Source checked                                                                    |
| ---------------- | --------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `python`         | language  | 3.14.8                               | `python:3.14` (official)                                                                                                                                                                                      | <https://www.python.org/downloads/>                                               |
| `go`             | language  | 1.27.2                               | `golang:1.27` (official)                                                                                                                                                                                      | <https://go.dev/dl/?mode=json>                                                    |
| `rust`           | language  | 1.99.0                               | `rust:1.99` (official)                                                                                                                                                                                        | <https://api.github.com/repos/rust-lang/rust/releases/latest>                     |
| `node`           | language  | 24.21.0 (Active LTS)                 | `node:24` (official)                                                                                                                                                                                          | <https://nodejs.org/en/about/previous-releases>                                   |
| `typescript`     | language  | 7.0.2                                | Derived: `node:24` plus TypeScript from a hash-locked npm lockfile                                                                                                                                            | <https://registry.npmjs.org/typescript/latest>                                    |
| `java`           | language  | JDK 25 LTS (Temurin 25.0.4.1+1)      | `eclipse-temurin:25-jdk` (official; the `openjdk` image is deprecated)                                                                                                                                        | <https://hub.docker.com/v2/repositories/library/eclipse-temurin/tags/?name=25>    |
| `kotlin`         | language  | 2.4.21                               | Derived: Temurin 25 plus the Kotlin compiler release zip, SHA256-checked (no official image)                                                                                                                  | <https://api.github.com/repos/JetBrains/kotlin/releases/latest>                   |
| `dotnet`         | language  | SDK 10.0.401 (C# 14, F# 10)          | `mcr.microsoft.com/dotnet/sdk:10.0`                                                                                                                                                                           | <https://builds.dotnet.microsoft.com/dotnet/release-metadata/releases-index.json> |
| `elixir`         | language  | Elixir 1.20.4 on OTP 29.1.1          | `elixir:1.20-otp-29` (official)                                                                                                                                                                               | <https://api.github.com/repos/elixir-lang/elixir/releases/latest>                 |
| `lua`            | language  | 5.5.1                                | Derived: built from the lua.org tarball, SHA256-checked (no official image)                                                                                                                                   | <https://www.lua.org/ftp/>                                                        |
| `luajit`         | language  | v2.1 at commit `c6ffc14`             | Derived: built from that commit (LuaJIT publishes no tarballs)                                                                                                                                                | <https://luajit.org/status.html>                                                  |
| `neovim`         | language  | 0.12.5                               | Derived: release tarball, SHA256-checked; runs `nvim --headless`                                                                                                                                              | <https://api.github.com/repos/neovim/neovim/releases/latest>                      |
| `gcc`            | language  | 16.2                                 | `gcc:16` (official); C and C++                                                                                                                                                                                | <https://gcc.gnu.org/releases.html>                                               |
| `racket`         | language  | 9.3                                  | `racket/racket:9.3` (project image)                                                                                                                                                                           | <https://api.github.com/repos/racket/racket/releases/latest>                      |
| `ocaml`          | language  | 5.5.1                                | `ocaml/opam` image with OCaml 5.5 (project image)                                                                                                                                                             | <https://ocaml.org/releases>                                                      |
| `swift`          | language  | 6.4.0                                | `swift:6.4` (official); Linux-only code runs for real                                                                                                                                                         | <https://www.swift.org/install/linux/>                                            |
| `dart`           | language  | 3.13.5                               | `dart:3.13` (official)                                                                                                                                                                                        | <https://hub.docker.com/v2/repositories/library/dart/tags/>                       |
| `flutter`        | language  | 3.41.5 (the repository `.fvmrc` pin) | Derived: the Flutter SDK at that tag; `flutter test` runs unit and widget tests with no device                                                                                                                | <https://docs.flutter.dev/testing/overview>                                       |
| `shell`          | language  | Debian trixie snapshot               | Derived: `debian` plus bash, coreutils, git, jq, sqlite3 from a pinned `snapshot.debian.org` date                                                                                                             | <https://snapshot.debian.org/>                                                    |
| `powershell`     | language  | 7.x LTS                              | `mcr.microsoft.com/powershell` (cross-platform scripts only)                                                                                                                                                  | <https://mcr.microsoft.com/v2/powershell/tags/list>                               |
| `postgres`       | service   | 18.6                                 | `postgres:18` (official)                                                                                                                                                                                      | <https://www.postgresql.org/support/versioning/>                                  |
| `neo4j`          | service   | 2026.09.0 Community                  | `neo4j:2026.09.0` (official); chosen over 5.26 LTS because the course teaches Cypher 25 (decision D14)                                                                                                        | <https://hub.docker.com/v2/repositories/library/neo4j/tags/>                      |
| `swift-parse`    | validator | 6.4.0                                | `swift:6.4`; `swiftc -parse` (reason `ios`)                                                                                                                                                                   | as `swift`                                                                        |
| `ktlint`         | validator | Release pinned in Phase 3            | Derived: Temurin plus the ktlint release, SHA256-checked; standard rules off, so only parse errors fail (reason `android`)                                                                                    | <https://github.com/pinterest/ktlint/releases>                                    |
| `opentofu`       | validator | Release pinned in Phase 3            | `ghcr.io/opentofu/opentofu`; `tofu init -backend=false` with providers baked from the course's `.terraform.lock.hcl`, then `tofu validate` (reason `cloud`, decision D20)                                     | <https://github.com/opentofu/opentofu/releases>                                   |
| `kubeconform`    | validator | Release pinned in Phase 3            | Derived: kubeconform binary plus offline JSON schemas from a pinned commit (reason `cluster`)                                                                                                                 | <https://github.com/yannh/kubeconform/releases>                                   |
| `windows-static` | validator | Debian trixie snapshot               | Derived: mingw-w64 (`x86_64-w64-mingw32-gcc -fsyntax-only`) for Win32 C, plus PowerShell's parser for `.ps1`; WPF and WinForms projects use `dotnet` with `-p:EnableWindowsTargeting=true` (reason `windows`) | <https://snapshot.debian.org/>                                                    |

Known gaps, which a content plan adds through [Adding a Toolchain](#adding-a-toolchain) when it
needs them:

- Clang/LLVM 23.1.3 (no official image; only if a course needs Clang specifically);
- Groovy/Gremlin (7 files in `graph-databases`);
- an Android compile validator stronger than parsing;
- WinUI 3 XAML compilation, which needs Windows.

## Images

- **Official and project images** are used as they are, by digest.
- **Derived images** are built locally from the embedded `Dockerfile` with
  `ayokoding-cli toolchains build <id>`:
  - every download in a derived `Dockerfile` is checked with `sha256sum -c` against a value written
    in the file;
  - Debian packages come from a fixed `snapshot.debian.org` date;
  - the tag is `ayokoding-toolchain/<id>:<hash>`, where `<hash>` is the SHA-256 of the base digest,
    the `Dockerfile` bytes, and the build arguments.

  Derived images are not published to a registry (decision D13). In CI the buildx GitHub Actions
  cache from `.github/actions/setup-docker-cache` keeps rebuilds cheap.

- **Environment images** add a course's locked dependencies to a toolchain image.
  - The harness builds one per distinct `(toolchain, lockfile)` pair, before any run.
  - The build is the only step with network access.
  - The install argv comes from the catalog; the lockfile is copied to `/deps/lock/`.
  - The tag is `ayokoding-env/<toolchain>:<hash>`, where `<hash>` is the SHA-256 of the toolchain
    image id, the lockfile bytes, and the install argv.
  - A failed environment build is the result finding `ayokoding.examples.env-build-failed`, shown
    with the last 40 lines of the build log.

## Container Invocation

A pure function in `internal/domain/containerplan` turns a unit, a run, and the catalog into argv
lists. Unit tests compare them byte for byte. The adapter in `internal/adapters/containers` only
executes them. The container command is `docker` by default, or the value of
`AYOKODING_CONTAINER_CLI` (for example `podman`, or the fake used by integration tests).

```text
docker run --rm
  --name ayokoding-<run-id>-<n> --label ayokoding.run=<run-id>
  --network none                      # or --network <internal network> when services exist
  --read-only --tmpfs /tmp:rw,nosuid,size=512m
  --cap-drop ALL --security-opt no-new-privileges
  --pids-limit 256 --memory <m> --memory-swap <m> --cpus <c>
  --user <uid>:<gid>
  --env HOME=/tmp/home --env LANG=C.UTF-8 ...   # sorted by name
  --mount type=bind,source=<host temp copy>,target=/work
  --workdir /work/<unit>/<workdir>
  [--interactive]                     # only when stdin is set
  <image> <argv...>
```

Services, for a unit that declares them:

1. `docker network create --internal ayokoding-<run-id>-<unit-hash>`.
2. Start each service detached on that network, with `--network-alias <id>`, a `tmpfs` data
   folder, and the run label.
3. Poll `docker exec <service> <ready argv>` every 500 ms until it succeeds or `readyTimeout`
   elapses. Elapsing is the environment error `ayokoding.env.service-not-ready`, exit 124.
4. Execute the unit's runs on the same network.
5. Remove the containers and the network on every path, including failures and interrupts. On start,
   the harness also sweeps leftovers carrying an `ayokoding.run` label older than 24 hours.

### The Double Run

Each run executes twice. The second time it gets half the CPU quota (`--cpus 2` becomes `1`; `1`
becomes `0.5`), which changes how threads are scheduled. Exit status, standard output, and standard
error (unless `ignore`) must match byte for byte between the two executions; a difference is
`ayokoding.examples.nondeterministic`, shown with the first differing line. Only then is the first
execution compared with the expectation. `--single-run` skips the second execution for local
debugging; CI never passes it.

### Supervisor Statuses

The CLI starts child processes (`docker`, `git`), so it owes the supervisor statuses of the CLI
convention:

| Condition                                       | Status | Error code                                    |
| ----------------------------------------------- | ------ | --------------------------------------------- |
| Container command not found on `PATH`           | 127    | `ayokoding.env.container-cli-not-found`       |
| Container command found but not executable      | 126    | `ayokoding.env.container-cli-not-executable`  |
| `docker version` fails (daemon down or refused) | 125    | `ayokoding.env.container-runtime-unavailable` |
| Pulling a pinned image fails                    | 125    | `ayokoding.env.image-pull-failed`             |
| `git` not found (only `--since` needs it)       | 127    | `ayokoding.env.git-not-found`                 |
| A service never became ready                    | 124    | `ayokoding.env.service-not-ready`             |

An environment status stops the command at once, because no later result could be trusted. A run
that exceeds its own `timeout` is a negative result (exit 1, `ayokoding.examples.run-timeout`), not
124, because the examples were checked and one failed.

## Static Mode

A static unit runs its commands in a validator or language image under the same isolation. The
commands compile, parse, or validate; they never execute the program. Each reason has a default
validator, and `run.yaml` may use any command available in its toolchain image:

| Reason    | Default validator                                                                                               | What it proves                                          |
| --------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `ios`     | `swiftc -parse <files>` in `swift-parse`                                                                        | Syntax; SwiftUI and UIKit exist only on Apple platforms |
| `android` | `ktlint` with standard rules off in `ktlint`                                                                    | Kotlin syntax                                           |
| `cloud`   | `tofu init -backend=false` then `tofu validate` in `opentofu`                                                   | Configuration validity offline                          |
| `cluster` | `kubeconform -strict` with offline schemas in `kubeconform`                                                     | Manifest schema validity                                |
| `windows` | `x86_64-w64-mingw32-gcc -fsyntax-only`, the PowerShell parser, or `dotnet build -p:EnableWindowsTargeting=true` | Compiles or parses                                      |

Flutter unit and widget tests and Linux-only Swift code are **not** static: they run for real.

## Adding a Toolchain

A content plan that needs a toolchain the catalog lacks:

1. Adds the entry and, for a derived image, its `Dockerfile` with SHA256-checked downloads.
2. Adds a fixture unit for it under `apps/ayokoding-cli/tests/testdata/courses/` and an E2E scenario
   row in the toolchain smoke table.
3. Runs `ayokoding-cli toolchains build <id>` and the E2E smoke for that id.

Any change under `apps/ayokoding-cli/toolchains/` puts the pull request's examples check in full
mode (decision 33).
