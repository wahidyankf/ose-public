# P4 rule manifest: repository-local rules propagation

This record covers the "Repository-local rules propagation" items of Phase 4. The rules-fixer agent wrote
it under the rules-propagation workflow. The changes are uncommitted; the caller delivers them.

## Frozen inputs

- Base: `origin/main`. Branch: `docker-to-podman-base`. P0 source revision: `71bb3aa5cadc1043e709e6cb13c2e0ffd8f489a7`.
- Rule scope: `repo-governance/`, `docs/`, `AGENTS.md`, `CLAUDE.md`, `agents/`, `.agents/skills/`,
  `repo-config.yml`, `scripts/`, and `.github/`. Ose-public only; no other repository gains an obligation.
- Changed Markdown in rule scope against `origin/main`: 61 files (scratch list, not tracked).
- Authority: `tech-docs.md` decisions D1 to D7, `prd.md` AC-01 to AC-10, `brd.md`, and the P0 runtime inventory.

## Three falsifiable statements

- Statement 1, rootless runtime. Operational container tasks use rootless Podman.
  Followed: the preflight passes on a rootless engine and each workload starts.
  Violated: a rootful connection is accepted, or a workload starts without the rootless check.
- Statement 2, explicit provider. Compose callers explicitly use `podman-compose`.
  Followed: `PODMAN_COMPOSE_PROVIDER` names the `podman-compose` executable before any `podman compose` call.
  Violated: no provider is set, or an installed Docker Compose is selected.
- Statement 3, owned cleanup. Cleanup removes only positively owned disposable artifacts and keeps shared or persistent data.
  Followed: only stacks and containers this session started are removed, and named data volumes stay.
  Violated: a shared stack, a named dev-data volume, or a machine-wide prune is removed.

## Canonical homes

- Statements 1 and 2: `repo-governance/development/workflow/reproducible-environments/containerization-for-complex-environments.md`.
- CI and runtime boundaries: `repo-governance/development/infra/ci-conventions/docker-conventions.md`.
- Build mechanics: `repo-governance/development/infra/docker-monorepo-builds.md` and its children (Podman build contract).
- Statement 3: `repo-governance/development/workflow/worktree-and-artifact-cleanup/docker-artifact-cleanup.md`,
  with `hard-safety-rules.md` as the rule-level source.

## Changes made in this unit

- `repo-governance/conventions/structure/command-line-interface/009-tiers-here.md`: the runtime named for
  `ayokoding-cli` changes from `docker` to `podman`, with `AYOKODING_CONTAINER_CLI` noted as the override.
  The CLI default is `podman` in `apps/ayokoding-cli`.
- `repo-governance/development/workflow/README.md`: the native-first index entry now reads "not Terraform or
  Docker Dev Containers". The old wording excluded Docker in general, which conflicts with the Podman runtime.
- `repo-governance/development/pattern/database-audit-trail/principles-and-conventions.md`: "Dockerised test
  databases" becomes "container-based test databases".
- `repo-governance/development/workflow/reproducible-environments/migration-guide.md`: the `.gitignore` comment
  "Docker volumes" becomes "Container volume data". The ignored patterns `.docker/` and `docker-volumes/` stay.
- `repo-governance/development/workflow/reproducible-environments/containerization-for-complex-environments.md`:
  adds a short "Boundaries and Cleanup" section with links to the CI conventions and the cleanup module.
  Word count 250 against a 750 ceiling.
- `repo-governance/development/infra/ci-conventions/docker-conventions.md`: the duplicate "Explicit provider"
  rule becomes a link to the canonical rule, plus the fact that `setup-podman` exports the provider in CI.
  Word count 741 against a 750 ceiling.
- `repo-governance/development/workflow/worktree-and-artifact-cleanup/docker-artifact-cleanup.md`:
  - The leaked-container step no longer removes every named volume that carries a project label. The origin/main
    command did that with no disposability check, which conflicted with "What Is Retained". Now a named volume is
    removed only when this session's own run created it and it holds disposable test data. Otherwise it stays and is
    reported. This narrows the existing self-created-only meaning and does not generalize it.
  - The "What This Gate Never Runs" section now links to the hard safety rules instead of repeating them.
  - Word count 727 against a 750 ceiling. The compression paid for the added sentences. No ceiling was raised.

## Superseded Docker requirements and replacement homes

- Docker Compose as the local service provider (`docker-compose up`): replaced by the "Podman Compose for Local
  Development" section of the containerization convention (statement 2).
- Docker Engine or Docker Desktop and the `docker` group as prerequisites: replaced by
  `docs/how-to/setup-development-environment.md` (Step 2) and
  `repo-governance/workflows/maintenance/development-environment-setup/005-phase-2-core-tools.md` (2.2), which
  require rootless Podman and `podman-compose` 1.6.0.
- Docker in the development-environment tool inventory: replaced by the `podman` and `podman-compose` rows in
  `002-tool-inventory.md`.
- `docker` as the `ayokoding-cli` container command: replaced by `podman` in the tier record (fixed in this unit).
- Buildx builds and BuildKit cache: replaced by native `podman build --layers --format docker`, with a job-local
  cache only (`docker-conventions.md`, "Native builds with a job-local cache").
- Docker login, build, and push for image publication: replaced by `podman login --password-stdin`,
  `podman build`, and `podman push` (`docker-conventions.md`, "Publishing").
- `setup-docker-cache` action and `stop-docker-before-fe-e2e` input: replaced by the `setup-podman` action and
  `stop-containers-before-fe-e2e` (`docker-conventions.md`, "Shared setup" and "Stack teardown").
- Docker cleanup commands (`docker rm -f -v`, label-based volume removal, `docker desktop stop`, `docker system prune`):
  replaced by the Podman equivalents in `docker-artifact-cleanup.md`. Prunes stay prohibited.
- Secrets injection matrix naming `docker-compose` as the local provider: replaced by `podman compose`
  (`secrets-and-env-standards/injection-matrix.md`).
- Docker-specific monorepo build wording: replaced by Podman wording across the `docker-monorepo-builds` family.
- Docker-hosted database and broker wording in the how-to and tutorial docs: replaced by containerized wording that
  names rootless Podman.
- Kept, not superseded: Dockerfile syntax, `.dockerignore`, `docker.io` and GHCR image names, `docker-compose*.yml`
  filenames, `com.docker.compose.*` label keys that `podman-compose` writes (to be confirmed in P3), hadolint gates,
  dated and historical rationale (`native-first-toolchain/rationale-package-managers-through-docker-performance.md`,
  `docs/explanation/lint-safety-parity-decisions.md`), and generic educational content.

## Enforcement disposition per rule

- Statement 1, rootless runtime: covered. Preflight `scripts/container-runtime-check` rejects a rootful engine,
  with a Node regression in `scripts/container-runtime-check.test.mjs`. Go regression cases cover the rootless and
  rootful mapping in `apps/ayokoding-cli/internal/adapters/containers/run_env_test.go` and `build_test.go`, and the
  BDD contract in `apps/ayokoding-cli/tests/bdd/podman_contract_test.go`.
- Statement 2, provider selection: covered by caller tests. `scripts/container-runtime-check.test.mjs` requires the
  explicit provider and refuses a competing `docker-compose` (status 2). The backend E2E scripts export the provider
  and run the preflight. `.github/actions/setup-podman/action.yml` asserts the exported provider equals the pinned
  `podman-compose`.
- Native tool existence (`podman`, `podman-compose`): covered by doctor, through the `repo-config.yml` toolchain
  entries at lines 1120 and 1121 (`required: true`). No Docker entry exists.
- Native build format: covered by Go regression. The argv assertions are in
  `apps/ayokoding-cli/internal/domain/containerplan/build_test.go` and `apps/ayokoding-cli/internal/adapters/containers/build_test.go`.
- Dockerfile format: covered by the existing hadolint gate (`scripts/lint-dockerfiles`, `scripts/lint-gates.test.mjs`).
- Statement 3, owned cleanup: unenforced by decision. The ownership check depends on judgement, so the existing
  self-created-only disposition stays. The cleanup evidence lives in `evidence/P3/recovery.md`, and the AI verifier
  described in `worktree-and-artifact-cleanup.md` covers it. No text search is claimed to prove runtime behaviour.

## Generated paths

- None recorded. `./rhino harness adapters generate` did not run, because HIPPO stopped it at the disk floor
  (see the first unresolved item). No generated path differs from its source in this unit. Re-run the generate step
  after the disk is freed; record every changed generated path and land it with its source.

## Gate exit codes

- No declared gate has an exit code yet. Both HIPPO attempts stopped with `hippo.limit.storage-blocked`
  (exit 124): the regeneration (transactional, standard) and the `./rhino --version` probe (ephemeral, light).
  No gate could run, so no exit code is claimed.
- Prepared runner: `local-tmp/rules-fixer/p4-gates.sh` (scratch, not tracked). It runs each declared Markdown,
  frontmatter, heading, internal-link, readme-index, naming, Mermaid, word-budget, vendor, quality-gates, emoji,
  repo-config, env, and harness check, then `npx --no markdownlint-cli2 "**/*.md"`, Prettier on the 62 changed
  Markdown paths, `git diff --check`, and actionlint, shellcheck, and hadolint on any changed workflow, shell, or
  Dockerfile path. It prints one `GATE <id> EXIT <code>` line per gate.

## Unresolved items

- Compute blocked by HIPPO storage. The root filesystem is at 99% (3.4G free of 177G). HIPPO's disk floor stopped
  the regeneration and the version probe. The largest consumers, read-only: rootless Podman storage about 25G,
  `~/.cache` about 7.9G, `~/.npm` about 4.0G, `~/.volta` about 2.8G, `~/.nuget` about 2.3G. This unit did not delete
  anything, because the storage belongs to the maintainer and to other sessions, and a machine-wide prune is not
  an agent step. Owner: the maintainer. Then re-run, in order:
  1. `./hippo run --class transactional --resource-tier standard --disk-path . -- ./rhino harness adapters generate`
  2. `./hippo run --class ephemeral --resource-tier light --disk-path . -- ./rhino harness adapters validate`
  3. `./hippo run --class ephemeral --resource-tier light --disk-path . -- bash local-tmp/rules-fixer/p4-gates.sh`
     Record the generated paths, the gate exit codes, and any repair they show in this manifest.
- `rules-quality-gate` has not run. This agent never starts a gate, so the caller must run it on this frozen change.
  Owner: the caller. Status: not-resolved until it runs.
- Operational Docker residue outside the rule surfaces. This unit does not edit it. Owners and required changes:
  - `apps/ayokoding-www/Dockerfile` line 2: comment "Invoked via: docker compose". Change to `podman compose`
    with the explicit provider. Owner: `swe-developer`.
  - `apps/organiclever-be/Dockerfile` and `apps/ose-be/Dockerfile` line 2: comment that shows `docker build`.
    Change to `podman build --layers --format docker`. Owner: `swe-developer`.
  - `specs/apps/ose/deployment.md` lines 7, 15, and 22: "Docker Compose" and a `docker compose` command for the
    unsupported `ose-app` scaffold. Use Podman wording and keep the unsupported status. Owner: docs or specs.
  - `specs/apps/organiclever/app-web/behaviours/routing/app-routes.feature` line 58 and
    `disabled-routes.feature` line 21: "real Docker stack" verification comments. Needs a decision, because no
    replacement claim is proven. Owner: specs.
  - `scripts/next-with-port.mjs` lines 138 and 147: "docker stop" in code comments. Optional wording change.
    Owner: `swe-developer`.
  - `apps/ayokoding-www/Dockerfile` lines 50 and 51: "docker-compose flow" comment. Optional. Owner: `swe-developer`.
- Runtime proof pending: the `com.docker.compose.*` label keys and the "runtime proof pending" notes in the
  containerization convention and the cleanup module. Remove the notes after the P3 proof. Owner: the plan.
- Statement 3 has no mechanical gate. The judgement disposition is recorded here. Owner: the maintainer, if a
  mechanical check is wanted.
