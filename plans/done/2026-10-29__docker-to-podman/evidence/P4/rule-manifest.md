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

- Statement 2 (explicit provider) and the single-binary rule: `repo-governance/development/workflow/reproducible-environments/containerization-for-complex-environments.md`.
- Statement 1 (rootless): `repo-governance/development/infra/ci-conventions/docker-conventions.md`, bullet "Rootless only", which holds the imperative "Workloads never run with `sudo` or against a rootful engine". The containerization file only describes rootless operation and links there. Corrected in cycle 1 (finding F4); the earlier home named the containerization file for this statement.
- CI and runtime boundaries, including the image-registry rule: `repo-governance/development/infra/ci-conventions/docker-conventions.md`.
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
  Word count 317 against a 750 ceiling after cycle 1 (250 when first written).
- `repo-governance/development/infra/ci-conventions/docker-conventions.md`: the duplicate "Explicit provider"
  rule becomes a link to the canonical rule, plus the fact that `setup-podman` exports the provider in CI.
  Word count 749 against a 750 ceiling after cycle 1 (741 before it). Cycle 1 added the registry bullet and paid for it
  by compressing other text; no ceiling was raised.
- `repo-governance/development/workflow/worktree-and-artifact-cleanup/docker-artifact-cleanup.md`:
  - The leaked-container step no longer removes every named volume that carries a project label. The origin/main
    command did that with no disposability check, which conflicted with "What Is Retained". Now a named volume is
    removed only when this session's own run created it and it holds disposable test data. Otherwise it stays and is
    reported. This narrows the existing self-created-only meaning and does not generalize it.
  - The "What This Gate Never Runs" section now links to the hard safety rules instead of repeating them.
  - Word count 725 against a 750 ceiling after cycle 1 (727 before it). The compression paid for the added sentences. No ceiling was raised.

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
- File names: the `docker-*` file and directory names (for example `docker-conventions.md`,
  `docker-artifact-cleanup.md`, and `docker-monorepo-builds.md`) were kept deliberately to avoid link churn. No file
  was renamed (cycle 1, finding F8).

## Enforcement disposition per rule

- Statement 1, rootless runtime: covered. Preflight `scripts/container-runtime-check` rejects a rootful engine,
  with a Node regression in `scripts/container-runtime-check.test.mjs`. Go regression cases cover the rootless and
  rootful mapping in `apps/ayokoding-cli/internal/adapters/containers/run_env_test.go` and `build_test.go`, and the
  BDD contract in `apps/ayokoding-cli/tests/bdd/podman_contract_test.go`.
- Statement 2, provider selection: covered by caller tests. `scripts/container-runtime-check.test.mjs` requires the
  explicit provider and refuses a competing `docker-compose` (status 2). The backend E2E scripts export the provider
  and run the preflight. `.github/actions/setup-podman/action.yml` asserts the exported provider equals the pinned
  `podman-compose`.
- Statement 2, single-binary rule (run only `podman`; no `docker` CLI, `docker buildx`, Docker daemon, or socket):
  covered by `scripts/no-docker-binary-calls.test.mjs`. It flags an executed `docker` argv, a `docker <subcommand>`
  command line, and a `DOCKER_HOST` or `docker.sock` reference, and it passes `podman`, `--format docker`, and
  `com.docker.compose.*` labels. Both sides are asserted in the suite's own fixtures.
- Image-registry rule (docker-conventions.md, bullet "Image registry"): covered by
  `scripts/container-image-qualified.test.mjs`. It fails a compose `image:` or a Dockerfile `FROM` whose first segment
  is not a registry host, passes `docker.io/library/...`, and exempts a `FROM` naming an earlier stage. It does not
  scan Markdown examples.
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
- Provisional Ubuntu Podman pin: `docs/how-to/setup-development-environment.md` (Step 2) says the pin "is provisional
  until the first CI run proves it", and `.github/actions/setup-podman/action.yml` carries the same note at its pin row.
  Owner: the plan, the same owner as the runtime-proof item below. Status: runtime proof pending. Keep the note until
  the proof lands.
- Runtime proof pending: the `com.docker.compose.*` label keys and the "runtime proof pending" notes in the
  containerization convention and the cleanup module. Remove the notes after the P3 proof. Owner: the plan.
- Statement 3 has no mechanical gate. The judgement disposition is recorded here. Owner: the maintainer, if a
  mechanical check is wanted.

Status update, 2026-10-29 (archival): the provisional Ubuntu Podman pin is proven on a GitHub runner (run 40693498144
and later runs, `evidence/P2/ci.md`), so the "provisional" notes in `setup-development-environment.md` and at the
`setup-podman` pin row are removed. The `com.docker.compose.*` label keys are confirmed in the installed
`podman-compose` 1.6.0 source (`podman_compose.py`, where it sets `com.docker.compose.project` and
`com.docker.compose.project.working_dir` beside the `io.podman.compose.project` label), and the cleanup module states
them.

Status update, 2026-10-29: the items above that say `rules-quality-gate` has not run are superseded by the three
cycles recorded below, with an advisory final verdict of PASS. The emoji finding names
`apps/ayokoding-www/generated/search-data.json`, which is gitignored (`apps/ayokoding-www/.gitignore`), untracked and
outside the branch diff. A shellcheck run now exists: exit 0 in `../P2/local-gates.md` (Gate 3). The "runtime proof
pending" note at `docker-artifact-cleanup.md` line 57 is still in the file; the Compose-label lookup it waits on ran
in the P3 stack proof (`../P3/compose-stacks.md`), so the note can be replaced by a `rules-fixer` edit.

## Rules-quality-gate cycle 1: propagation record

Run by `rules-fixer` under Rules Propagation, on the frozen cycle-1 ledger. This record covers repairs only. The
`rules-quality-gate` itself is still owed to the caller, as the unresolved item above says.

Frozen inputs: HEAD `60a35faf1`. Uncommitted paths at the start, none touched by this run: `.serena/project.yml`,
`plans/in-progress/docker-to-podman/delivery.md`, and the untracked `plans/in-progress/docker-to-podman/evidence/P2/local-gates.md`.
Paths this run wrote: the nine rule and doc files in the ledger, and this manifest. Nothing was staged or committed.

| ID                                | Disposition                    | Status         | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Basis                                                                                                                                                                                                                                                                                                      |
| --------------------------------- | ------------------------------ | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1 (HIGH)                         | fixed                          | resolved       | `dev-artifact-clean-up.md`, Verification: the volume clause now reads "No anonymous volume this session created remains", with a link to Podman-Artifact Cleanup "What Is Retained"; the container and network checks are kept; the long line is split.                                                                                                                                                                                                                                                                                                                                          | The lower workflow is amended to agree with the development-layer rule in `docker-artifact-cleanup.md` and `the-four-artifact-classes.md`.                                                                                                                                                                 |
| F2 (MEDIUM, repaired as directed) | fixed                          | resolved       | `containerization-for-complex-environments.md`: `docker.io/library/` added to the postgres, redis, and node references. `docker-conventions.md`: new bullet "Image registry" under Podman Runtime and CI Boundaries; the template `FROM base-image` placeholders became `registry.example.com/base-image`.                                                                                                                                                                                                                                                                                       | Re-validated: the registry obligation is already stated in the header of `scripts/container-image-qualified.test.mjs`, and the canonical examples show the failing short form. The bullet's wording and placement follow the caller's repair text. Recorded as HIGH on that basis; the owner may overrule. |
| F3 (MEDIUM, repaired as directed) | fixed                          | resolved       | `containerization-for-complex-environments.md`, first paragraph: "Run only the `podman` binary: no `docker` CLI, `docker buildx`, Docker daemon, or Docker socket." `docker-conventions.md`: the "Explicit provider and binary" bullet links to that home. This manifest: both validators are listed under Statement 2 (see Enforcement).                                                                                                                                                                                                                                                        | The rule is already stated in the header of `scripts/no-docker-binary-calls.test.mjs` ("runs the Podman binary only"). The single home is the containerization file; the link runs from docker-conventions.                                                                                                |
| F4 (LOW)                          | fixed in this manifest         | resolved       | Canonical-home line for Statement 1 now names `docker-conventions.md`, "Rootless only". No rule text changed, and no word budget was spent in the containerization file.                                                                                                                                                                                                                                                                                                                                                                                                                         | The imperative "Workloads never run with `sudo` or against a rootful engine" is in `docker-conventions.md`, so the manifest pointed at the wrong home.                                                                                                                                                     |
| F5 (LOW)                          | fixed                          | resolved       | `pass-best-practices.md` (reproducibility) line 54: the "Podman <recorded version>" placeholder now points to the setup-podman action. `docs/how-to/setup-development-environment.md`: macOS paragraph states "The macOS path has no pinned Podman version."; the Ubuntu apt command reads `podman=<podman_pin>` with a pointer to the action; the Version Reference row says "macOS has no pin". `005-phase-2-core-tools.md`: macOS comment says "no pinned Podman version"; the apt line points to the action. `002-tool-inventory.md` row 9 "Pinned by": "Ubuntu `setup-podman`; macOS none". | The package pin's single source is `.github/actions/setup-podman/action.yml` (`podman_pin`). podman-compose 1.6.0 stays in the pipx commands, the success criteria, and inventory row 10.                                                                                                                  |
| F6 (LOW)                          | fixed                          | resolved       | `docker-artifact-cleanup.md`: "Docker-engine resources are out of scope for this gate. It never stops or removes them, including any Docker-engine volumes or exports, which stay until a separately authorized cleanup." The provisional-pin item is added under Unresolved items, owner the plan. The "runtime proof pending" notes are kept.                                                                                                                                                                                                                                                  | The event-specific "predate the Podman migration" wording is removed. The provisional note is in `setup-development-environment.md` and in the setup-podman action.                                                                                                                                        |
| F7 (LOW)                          | fixed (canonical wording only) | resolved       | `containerization-for-complex-environments.md`: "Set `PODMAN_COMPOSE_PROVIDER` to the `podman-compose` executable name or path". `package.json` was not edited.                                                                                                                                                                                                                                                                                                                                                                                                                                  | The bare-name examples in `pass-best-practices.md` (line 95) and `how-it-applies-environment-containers-and-setup-docs.md` (line 87) are valid values of the same variable, so they were left as they are.                                                                                                 |
| F8 (LOW)                          | fixed in this manifest         | resolved       | Superseded section: a "File names" bullet records that the `docker-*` names were kept deliberately to avoid link churn.                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | No file was renamed.                                                                                                                                                                                                                                                                                       |
| F9, F10                           | not repaired                   | not-applicable | Out of scope for this run, per the caller.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | No edit was made for either.                                                                                                                                                                                                                                                                               |

Also changed, to keep the wording tight and not to drop an obligation: docker-conventions "Rootless only" now says "A local
entry point" (the scripts are entry points); "The cache stays local to the job" (the word "build" dropped); "Stack
teardown" and "Publishing" compressed without changing the obligation. The Dockerfile template's decorative stage
headers were simplified, and the template comments otherwise stay as they were. The disproved count is zero: each
finding was confirmed against the current text before repair.

Wider concern, not repaired, new input for a later run: `repo-governance/principles/software-engineering/reproducibility/how-it-applies-environment-containers-and-setup-docs.md`
(the PASS example, lines near 64, 73, and 94) shows `postgres:16.1` and `redis:7.2.4`, the short form the registry rule
forbids. It is a principles-layer example and was not among the cited findings.

Word counts after cycle 1 (whitespace-separated, the word-budget metric): `docker-conventions.md` 749 (fail 750;
was 741); `containerization-for-complex-environments.md` 317 (was 250 when the unit first wrote it); `docker-artifact-cleanup.md`
725 (was 727); `dev-artifact-clean-up.md` 743 (was 728); `002-tool-inventory.md` 724 (was 721); `005-phase-2-core-tools.md` 512;
`pass-best-practices.md` (reproducibility) 297. The `docs/how-to/` file is not in a budget surface.

Gate exit codes, cycle 1, after all repairs (runner `local-tmp/rules-fixer/cycle1-gates.sh`, logs in `local-tmp/rules-fixer/`).
Each code was taken directly, without a pipe:

| Gate                                 | Command                                                                   | Exit    | Output                                                           |
| ------------------------------------ | ------------------------------------------------------------------------- | ------- | ---------------------------------------------------------------- |
| markdownlint                         | `npx --no markdownlint-cli2 "**/*.md"`                                    | 0       | 7880 files, 0 errors                                             |
| md frontmatter                       | `./rhino md frontmatter validate`                                         | 0       | 3576 files, no findings                                          |
| md heading-hierarchy                 | `./rhino md heading-hierarchy validate`                                   | 0       | 3177 files, no findings                                          |
| md internal-link                     | `./rhino md internal-link validate`                                       | 0       | 17258 links, no findings                                         |
| md readme-index                      | `./rhino md readme-index validate`                                        | 0       | 16 directories, no findings                                      |
| word-budget                          | `./rhino governance word-budget validate`                                 | 0       | 3092 files, no findings                                          |
| governance-vendor                    | `./rhino governance vendor validate`                                      | 0       | 2243 files, no findings                                          |
| prettier                             | `./node_modules/.bin/prettier --check` on the nine changed Markdown files | 0       | all files use Prettier code style                                |
| validator: container-image-qualified | `node --test scripts/container-image-qualified.test.mjs`                  | 0       | 4 pass, 0 fail                                                   |
| validator: no-docker-binary-calls    | `node --test scripts/no-docker-binary-calls.test.mjs`                     | 0       | 4 pass, 0 fail                                                   |
| canonical adapters                   | `./rhino harness adapters generate` and `validate`                        | not run | no `agents/` or `.agents/` path changed (zero paths in the diff) |

The first prettier attempt used `npx --no prettier --check`, and npx passed `--check` to npm, so prettier printed the
files instead of checking them. That log was discarded, and the check was re-run with the local binary. A first
sanity run of the hippo wrapper was deferred by capacity (exit 124, not a gate result). A re-run of `bash -c 'exit 3'`
returned 3, which confirms the wrapper keeps the exit code.

## Rules-quality-gate cycle 2: propagation record

Run by `rules-fixer` under Rules Propagation, on the frozen cycle-2 ledger (N1 to N10). The record was amended after the
coordinator decided N5 and N6. It covers the cycle-2 repairs only. The `rules-quality-gate` itself is still owed to the
caller, as the unresolved item above says.

Frozen inputs: HEAD `60a35faf1`, with the uncommitted cycle-1 repairs. Paths this run wrote: nine rule and doc files (the
principles file, the migration guide, `docs/how-to/setup-development-environment.md`, the 005 workflow,
`docker-conventions.md`, `dev-artifact-clean-up.md`, `docker-artifact-cleanup.md`, and the two `docs/explanation` frontend
deployment files), and this manifest. Scratch only: `local-tmp/rules-fixer/cycle2-*`. Not touched: `.serena/project.yml`,
`delivery.md`, and every evidence file except this manifest. Nothing was staged or committed. Serena was not used, because
no semantic work was needed; all edits used the built-in Edit tool.

| ID  | Ledger | Re-validated against current text                                                                                                                                                                                                                                                                                                                   | Disposition                                       | Status                    | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| --- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| N1  | MEDIUM | Confirmed at lines 64, 73, and 94. The registry bullet in `docker-conventions.md` fixes the qualified form. The block is an illustrative PASS example, not a normative statement, so qualifying it changes no obligation.                                                                                                                           | fixed (HIGH)                                      | resolved                  | YAML images now use `docker.io/library/`. Line 94 keeps the example's content with qualified names rather than the ledger's shorter "Exact versions for all services".                                                                                                                                                                                                                                                                                                               |
| N2  | MEDIUM | Confirmed at lines 45 and 52 (`postgres:16.1`, `FROM node:24.13.1-alpine`). The registry bullet fixes the form.                                                                                                                                                                                                                                     | fixed (HIGH)                                      | resolved                  | Both qualified with `docker.io/library/`.                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| N3  | LOW    | The path exists in HEAD (`60a35faf1`) but not on `origin/main`. The remote is `wahidyankf/ose-public`, so the URL names the right repository. A `blob/main` link resolves only after this branch merges.                                                                                                                                            | fixed (HIGH)                                      | resolved, with a caveat   | Full URL in the code comment at `setup-development-environment.md` line 139 and at 005 line 39. Two prose pointers still use the relative path (`setup-development-environment.md` line 135, 005 line 37); the ledger scoped the change to the comments, so they stay.                                                                                                                                                                                                               |
| N4  | LOW    | A constraint, not a defect. `docker-conventions.md` was 749 words before the run.                                                                                                                                                                                                                                                                   | not applicable (constraint honored)               | not-applicable            | The file is at 750 words after the N5 wording, which is the ceiling. Any later edit must trim words first.                                                                                                                                                                                                                                                                                                                                                                           |
| N5  | LOW    | The bullet's subject is the reusable web-test workflow, so CI scope is implied. Its unscoped sentence "No Compose stop includes `-v`" conflicted with `docker-artifact-cleanup.md` ("What Is Retained" allows `-v` for plan-created disposable data) and with `organiclever:dev:reset`, which runs `down -v`. Both documents are development layer. | fixed (coordinator decision; owner item 2 closed) | resolved                  | `docker-conventions.md`: "No CI or E2E Compose stop includes `-v`; no job removes volumes to make a test pass." No reset clause was added to `docker-artifact-cleanup.md`: that doc governs this gate's removals, and the CI/E2E scope no longer reaches a local reset.                                                                                                                                                                                                              |
| N6  | LOW    | The fact is right: `podman compose down` without `-v` keeps anonymous volumes, so a default `down` cannot satisfy the strict wording. The coordinator chose "removed or reported", which is looser than the cycle-1 strict form ("No anonymous volume ... remains").                                                                                | fixed (coordinator decision; owner item 3 closed) | resolved                  | `dev-artifact-clean-up.md` line 77: "Each anonymous volume this session created is removed or reported.", with the `#what-is-retained` link kept. `docker-artifact-cleanup.md` "What Is Retained" gains: "Session-created anonymous volumes are removed by exact id once unused and proven by a before/after snapshot; otherwise they are reported." For the owner's review: reporting is the fallback when the before/after proof is missing, and removal stays the primary action. |
| N7  | LOW    | Confirmed: the pin sentence sat between the macOS description and "Then check for an existing machine".                                                                                                                                                                                                                                             | fixed (HIGH)                                      | resolved                  | The pin sentence now opens the paragraph, and "Then check for an existing machine" follows the install steps. Word count unchanged.                                                                                                                                                                                                                                                                                                                                                  |
| N8  | LOW    | Confirmed: the rule was paraphrased. The exact text at `docker-conventions.md` line 88 is "Workloads never run with `sudo` or against a rootful engine."                                                                                                                                                                                            | fixed in this manifest (HIGH)                     | resolved                  | Quoted exactly at line 29 and in the F4 row.                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| N9  | LOW    | Confirmed: no declared gate runs `test:validators`. It appears only in `package.json`. `.github/scripts/test-hippo-consumer.sh` string-checks that the script starts with `./hippo run` and does not run the validators. "enforces" overstated the check.                                                                                           | fixed (wording); gate wiring is an owner item     | resolved; owner item open | Reworded to "the `container-image-qualified` validator checks compose files and Dockerfiles in `npm run test:validators`". The ledger's wording dropped the scope, so the scope stays. Owner item below.                                                                                                                                                                                                                                                                             |
| N10 | LOW    | Confirmed: the branch's commit `88a20850c` qualified the Dockerfile `FROM` lines in both files, but the compose and CI `image:` lines still used short names.                                                                                                                                                                                       | fixed (HIGH)                                      | resolved                  | Nine short references qualified: fe-nextjs lines 357, 367, 601, and 612; fe-react lines 212, 348, 360, 371, and 581. The GitLab CI `image:` examples are included so each file is internally consistent. Generic TypeScript, README, best-practice, and tutorial examples are unchanged.                                                                                                                                                                                             |

Disposition counts: fixed 9 (N1, N2, N3, N5, N6, N7, N8, N9, N10); not applicable 1 (N4); needs-decision 0; disproved 0.

Owner items after cycle 2:

- Open: wire `test:validators`, or the two registry validators, into a declared gate. Owner: the plan owner. A declaration
  change goes to `swe-developer` as repairer. Status: not-resolved until wired.
- Open: the N3 `blob/main` link resolves only after this branch merges. Owner: the merge.
- Closed in cycle 2 by the coordinator's decisions: the N5 scope question (owner: the `docker-conventions.md` owner) and
  the N6 removal-procedure question (owner: the plan owner). The procedure is now the removal-or-report rule in
  `docker-artifact-cleanup.md`.

Word counts after cycle 2 (whitespace-separated, the word-budget metric): `docker-conventions.md` 750 (was 749; ceiling
750); `dev-artifact-clean-up.md` 746 (was 743); `docker-artifact-cleanup.md` 724 (was 725; ceiling 750); the principles
file 392 and the migration guide 196 (counts unchanged, because only tokens were qualified); `005-phase-2-core-tools.md`
512 (unchanged). The `docs/how-to/` and `docs/explanation/` files are not in a budget surface.

Gate exit codes, cycle 2, after all repairs including the N5 and N6 decisions. Runner
`local-tmp/rules-fixer/cycle2-gates.sh`, logs in `local-tmp/rules-fixer/cycle2-*.log`. Each code was taken directly from the
`rtk ./hippo run --class ephemeral --resource-tier light --disk-path .` run, without a pipe.

| Gate                                 | Command                                                       | Exit | Output                            |
| ------------------------------------ | ------------------------------------------------------------- | ---- | --------------------------------- |
| markdownlint                         | `npx --no markdownlint-cli2 "**/*.md"`                        | 0    | 7881 files, 0 errors              |
| md frontmatter                       | `./rhino md frontmatter validate`                             | 0    | 3577 files, no findings           |
| md heading-hierarchy                 | `./rhino md heading-hierarchy validate`                       | 0    | 3178 files, no findings           |
| md internal-link                     | `./rhino md internal-link validate`                           | 0    | 17258 links, no findings          |
| md readme-index                      | `./rhino md readme-index validate`                            | 0    | 16 directories, no findings       |
| word-budget                          | `./rhino governance word-budget validate`                     | 0    | 3092 files, no findings           |
| governance-vendor                    | `./rhino governance vendor validate`                          | 0    | 2243 files, no findings           |
| prettier                             | `./node_modules/.bin/prettier --check` on the 8 changed files | 0    | all files use Prettier code style |
| validator: container-image-qualified | `node --test scripts/container-image-qualified.test.mjs`      | 0    | 4 pass, 0 fail                    |
| validator: no-docker-binary-calls    | `node --test scripts/no-docker-binary-calls.test.mjs`         | 0    | 4 pass, 0 fail                    |

HIPPO deferred admission several times for capacity (`hippo.limit.capacity-deferred`, which exits 124) while another
session's test run loaded the host. The runner retried only on that logged deferral, up to 40 attempts, and recorded each
one in `local-tmp/rules-fixer/cycle2-admission.txt`. A deferral was never counted as a gate result. In the final pass,
HIPPO shed the markdownlint run under host pressure (`hippo.limit.pressure-shed`, exit 124). The markdownlint gate was
rerun alone, and that rerun exited 0 on its first attempt; the table reports the rerun.

## Rules-quality-gate: final verdict (cycle 3 of 3)

Advisory verdict: **PASS**. No open CRITICAL or HIGH finding and no open in-scope MEDIUM finding after three cycles.

| ID   | Criticality | Disposition                                                                                                                                                                                         |
| ---- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C3-1 | LOW         | Deferred, owner the plan owner: `docker-artifact-cleanup.md` names two anonymous-volume removal paths with different proof standards. Both require proven ownership; unify wording in a later edit. |
| C3-2 | LOW         | Deferred, owner the plan owner: ambiguity whether a cleanup `down -v` of plan-created disposable data counts as an "E2E Compose stop". No spare words in `docker-conventions.md` (750/750).         |
| C3-3 | LOW         | Fixed: `FROM docker.io/library/eclipse-temurin:21-jre-alpine` in `production-code-quality-standards.md`.                                                                                            |
| C3-4 | LOW         | Fixed: `pass-best-practices.md` now says the Ubuntu CI pin is in `setup-podman`, matching the macOS no-pin statement.                                                                               |
| O1   | LOW         | Out of scope: GitLab CI illustration in a generic explanation page.                                                                                                                                 |
| O2   | LOW         | Out of scope: generic tutorial teaching examples.                                                                                                                                                   |

Open owner items carried forward: wire `test:validators` or the two registry validators into a declared gate; the
setup-guide `blob/main` link resolves only after this branch merges; the provisional Ubuntu Podman pin and the runtime
proof for the `com.docker.compose.*` label keys.
