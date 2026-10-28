# P4 rule manifest: repository-local rules propagation

This record covers the "Repository-local rules propagation" items of Phase 4. The rules-fixer agent wrote
it under the rules-propagation workflow. The rule changes landed in earlier commits on this branch. The gate logs below are untracked scratch files.

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

`./rhino harness adapters generate` ran. Commit `deb477dac` ("regenerate mirrors for podman canonicals") landed
the output. It changed 16 files:

- `catalog.json` and `provenance.json` under each of six harness directories: `.agents/agents`, `.claude/agents`,
  `.claude/skills`, `.codex/agents`, `.commandcode/agents`, and `.opencode/agents`. That is 12 files.
- Four files under `.agents/skills/`: `apps-organiclever-www-developing-content/SKILL.md`,
  `apps-organiclever-www-developing-content/reference/comparison-and-development-commands.md`,
  `plan-creating-project-plans/reference/operational-readiness.md`, and
  `plan-verifying-execution/reference/worktree-verification-freshness-cleanup-and-cap.md`.

The commit message says skill mirrors are symlinks to the canonical files, so the mirrors change only in digests and
catalogs, and that `./rhino harness adapters validate` is clean. A later run of that command printed the same result
(see the gate table).

## Gate results

A scratch runner, `local-tmp/rules-fixer/p4-gates.sh` (not tracked), ran each gate against the frozen change and
wrote one log per gate. The runner printed a `GATE <id> EXIT <code>` line for each gate, but that stdout was not
kept. The logs hold no exit code. The table therefore states the outcome text of each log only, and claims no exit
code.

| Gate                                                           | Outcome in the log                                                                                                                                                                               |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `./rhino harness adapters validate`                            | "canonical adapter validation is clean"                                                                                                                                                          |
| Declared harness adapters check (validate plus hook tests)     | Validation clean. Native public policy transport 86 passed, 0 failed. All fixture and policy adapter cases pass                                                                                  |
| `./rhino repo-config validate`                                 | Checked 1 configuration file, no findings                                                                                                                                                        |
| `./rhino env validate`                                         | Checked 4 declared files, no findings                                                                                                                                                            |
| `./rhino md frontmatter validate`                              | Checked 3556 files, no findings                                                                                                                                                                  |
| `./rhino md heading-hierarchy validate`                        | Checked 3157 files, no findings                                                                                                                                                                  |
| `./rhino md internal-link validate`                            | Checked 17213 links, no findings                                                                                                                                                                 |
| `./rhino md readme-index validate`                             | Checked 16 directories, no findings                                                                                                                                                              |
| `./rhino md naming validate`                                   | Checked 5847 files, no findings                                                                                                                                                                  |
| `./rhino md mermaid validate`                                  | Checked 4339 diagrams, no findings                                                                                                                                                               |
| `./rhino governance word-budget validate`                      | Checked 3092 files, no findings                                                                                                                                                                  |
| `./rhino governance vendor validate`                           | Checked 2243 files, no findings                                                                                                                                                                  |
| `./rhino governance quality-gates validate`                    | Checked 228 files, no findings                                                                                                                                                                   |
| `./rhino convention emoji validate`                            | Checked 8777 files, 1 finding: an emoji code point (U+1F3AF) in `apps/ayokoding-www/generated/search-data.json`. That file is generated site data outside this unit's changes. Not resolved here |
| `npx --no markdownlint-cli2 "**/*.md"`                         | Linted 7860 files, 0 errors                                                                                                                                                                      |
| Prettier check on the changed Markdown paths                   | All matched files use Prettier code style                                                                                                                                                        |
| `git diff --check` against `origin/main`                       | Empty log                                                                                                                                                                                        |
| `./scripts/lint-workflows` (actionlint) on changed workflows   | Empty log                                                                                                                                                                                        |
| `./scripts/lint-dockerfiles` (hadolint) on changed Dockerfiles | Two `DL3059 info` notes (consecutive `RUN` lines) in `apps/ayokoding-www/Dockerfile:40` and `apps/ose-www/Dockerfile:25`. Info level only                                                        |
| `./scripts/lint-shell` (shellcheck) on changed shell paths     | No log exists. The runner has no recorded outcome for it                                                                                                                                         |

Notes:

- An empty log means the tool printed nothing. It does not record an exit code.
- The emoji finding names a generated file that this unit did not edit. Whether it predates this change was not
  checked. The caller or maintainer decides whether to fix it or to exempt generated data.
- The Dockerfile notes are info level, and this unit does not edit either Dockerfile.

## Unresolved items

- Earlier compute block, now cleared. An earlier attempt to regenerate and to run the version probe stopped with
  `hippo.limit.storage-blocked` (exit 124) at HIPPO's disk floor. Generation and the gates later ran, as recorded
  above. This unit deleted nothing to clear it.
- `rules-quality-gate` has not run. The gates above are deterministic checks, not that workflow. This agent never
  starts a gate, so the caller must run it on this frozen change. Owner: the caller. Status: not-resolved until it runs.
- One emoji finding from the deterministic gate (see the gate table). Owner: the maintainer.
- Operational Docker residue outside the rule surfaces. The first scan listed six places. A recheck of the listed
  lines in the current tree shows each now names Podman or neutral container wording: the three Dockerfile comments,
  the `specs/apps/ose/deployment.md` lines, the two `@local-fullstack` feature comments, and the two comments in
  `scripts/next-with-port.mjs`. This was a read of those lines only, not a new repository-wide scan.
- Runtime proof pending: the `com.docker.compose.*` label keys and the "runtime proof pending" notes in the
  containerization convention and the cleanup module. Remove the notes after the P3 proof. Owner: the plan.
- Statement 3 has no mechanical gate. The judgement disposition is recorded here. Owner: the maintainer, if a
  mechanical check is wanted.
