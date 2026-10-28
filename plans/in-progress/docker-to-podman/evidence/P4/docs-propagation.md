# P4 docs propagation and architecture reconciliation

This file records the Phase 4 passes "Run `docs-propagation` on the frozen as-built change" and "Reconcile C4/runtime
architecture descriptions". It complements [docs-manifest.md](./docs-manifest.md), which records the docs-fixer pass
(findings F1 to F8 applied, D1 to D3 left for an owner). Rule surfaces under `repo-governance/` are classified in
[rule-manifest.md](./rule-manifest.md), not here.

Date: 2026-10-29. Head: `60a35faf1`, plus the staged but uncommitted docs and rule edits listed by `git status`. This pass
read and classified only; it edited no file under `docs/`, `specs/`, `apps/*/README.md`, `libs/*/README.md` or `infra/`.

## 1. Scan

Command, run at the worktree root:

```text
rg -i -n 'docker' docs specs apps/*/README.md libs/*/README.md infra \
  --glob '!apps/ayokoding-www/content/**' --glob '!plans/done/**'
```

Result: 111 matching lines in 29 files. Every line was classified. Classes: **Dockerfile syntax** (a `dockerfile:`
Compose key, a `FROM` line or a fenced `dockerfile` block), **registry** (`docker.io/library/...` references),
**filename** (`docker-compose*.yml`, `Dockerfile*`, `.dockerignore`, `hadolint`), **negation** (a sentence that says
Docker is not used), **historical** (a dated decision record), **generic** (educational or style-guide content with
Docker as its subject), and **STALE** (an instruction that tells a reader to use the Docker daemon, CLI or Compose for
this repository).

## 2. Classification

| Files (hits)                                                                                                                                          | Class                       | Disposition                                                                                                                                                                                                                                              |
| ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/ose-be/README.md` (2), `apps/organiclever-be/README.md` (2), `apps/ose-app-web/README.md` (2)                                                   | filename                    | Each hit is a `docker-compose*.yml` path inside a `podman compose -f ... up` or `down` command. The commands already run Podman. Keep                                                                                                                    |
| `infra/dev/ayokoding-www`, `ose-www`, `organiclever-www`, `ose-app`, `organiclever-app` Compose files (9 across 5 files)                              | Dockerfile syntax, registry | `dockerfile:` build keys and `docker.io/library/...` image names. The registry form is required for rootless Podman. Keep                                                                                                                                |
| `infra/dev/ose-app` and `infra/dev/organiclever-app` `Dockerfile.*.dev` (4 files, 1 each)                                                             | registry                    | `FROM docker.io/library/...`. Keep                                                                                                                                                                                                                       |
| `specs/apps/ose/deployment.md` (2)                                                                                                                    | filename, registry          | The command is `podman compose -f infra/dev/ose-app/docker-compose.yml up --build -d` with `PODMAN_COMPOSE_PROVIDER` exported; the image table names `docker.io/library/node`. Already migrated (F2 to F4). Keep                                         |
| `specs/apps/ayokoding/cli/architecture.md` (2)                                                                                                        | filename                    | Both hits say the binary "embeds the toolchain catalog and Dockerfiles". The runtime node reads "Podman CLI, rootless engine". Keep                                                                                                                      |
| `specs/apps/ayokoding/cli/behaviours/toolchains/rootless-runtime.feature` (3), `toolchain-catalog.feature` (1)                                        | negation, filename          | The scenario "An installed Docker Compose cannot override the selected provider" asserts that Docker Compose is not used. A Dockerfile byte change is the other hit. Keep                                                                                |
| `docs/how-to/setup-development-environment.md` (2)                                                                                                    | negation, filename          | Line 120 says "so Docker Compose is not used". Line 438 is a `podman compose -f infra/dev/<other-stack>/docker-compose.yml down` command. Keep                                                                                                           |
| `docs/how-to/add-new-app.md` (1)                                                                                                                      | filename                    | Names the app's `Dockerfile` `CMD`. Keep                                                                                                                                                                                                                 |
| `docs/reference/monorepo-structure.md` (5)                                                                                                            | filename                    | Tree comments for `docker-compose.yml`, `Dockerfile` and `.dockerignore`. The wording already says "run with Podman Compose" and "Container build context exclusions". Keep                                                                              |
| `docs/reference/sdlc-gate-standard.md` (5)                                                                                                            | filename                    | The `hadolint` gate and `scripts/lint-dockerfiles`. Keep                                                                                                                                                                                                 |
| `docs/reference/system-architecture/applications.md` (3)                                                                                              | filename, negation          | "Production Dockerfile" (2) and the C4 sentence that a "container" is "not a Docker container". Terminology, not a runtime instruction. Keep                                                                                                             |
| `docs/explanation/lint-safety-parity-decisions.md` (8)                                                                                                | historical, filename        | A dated (2026-06-12) decision record about the hadolint gate. The `docker build` mention is the record's rationale for ignoring pinning rules. Keep                                                                                                      |
| `docs/explanation/software-engineering/platform-web/tools/fe-nextjs/README.md` (7), `deployment.md` (28)                                              | generic, registry           | Next.js self-hosting guide: Dockerfile and Compose examples, a GitLab CI `docker:dind` job and a `docker-compose` rollback recipe for a sample `ose-platform` service. Image names already carry `docker.io/library/`. Generic educational content. Keep |
| `docs/explanation/software-engineering/platform-web/tools/fe-react/README.md` (4), `build-deployment.md` (12)                                         | generic, registry           | React deployment guide: Dockerfile and Compose examples with qualified image names. Keep                                                                                                                                                                 |
| `docs/explanation/software-engineering/programming-languages/typescript/README.md` (4), `best-practices.md` (3), `f-sharp/build-configuration.md` (2) | generic                     | Style-guide examples that use a Dockerfile or `docker-compose.yml` to illustrate reproducibility and multi-stage builds. No repository instruction. Keep                                                                                                 |

**STALE operational instructions found: 0.** The earlier passes (the docs-fixer pass F1 to F8, and the branch's own
edits to the READMEs, setup guide, `ci-cd.md`, `web-sites.md` and `specs/apps/ose/deployment.md`) already replaced
every Docker daemon, CLI and Compose instruction in these paths. No edit was needed in this pass, so the word-budget,
link and Prettier gates below have no new docs delta to judge.

Why the generic Next.js rollback recipe stays (`fe-nextjs/deployment.md` lines 881 to 888, `docker-compose down` and
`docker tag`): it is part of a framework deployment guide whose subject is Docker as a deployment target, with a
placeholder service name and registry. It tells a reader nothing about running this repository. The branch edited this
file only to qualify image registries. Rewriting a generic guide to Podman would change its subject.

### Supplementary scan (outside the command above)

A second search over the other operational surfaces named by the plan (`README.md`, `scripts/`, `.github/`, `agents/`,
`.agents/`, `repo-governance/`, `repo-config.yml`, `package.json`) found only filenames, registry names, negations,
rationale and the Podman-named cleanup and setup modules recorded in [rule-manifest.md](./rule-manifest.md). In
`.github/` the only `docker` tokens are the `--format docker` image format on the three `podman build` lines, the
`com.docker.compose.*` label keys, the `docker-compose*.yml` file names and one `.dockerignore` path. No `docker`, `buildx` or Docker login
instruction remains.

## 3. Observations left for an owner (not repaired)

- **D1 to D3** from [docs-manifest.md](./docs-manifest.md) remain owner-pending: the historical verification comment,
  the `apps/ayokoding-cli/README.md` line 21 and `internal/domain/finding/finding.go` line 114 wording "daemon
  unavailable" (the README and the emitted string must change together), and the unlocated F# build-config wording.
  The README exit-status line still reads "The container runtime refused: daemon unavailable or pull failed." Podman
  has no daemon, so this is a wording nit, not a Docker instruction.
- `docs/reference/system-architecture/technology-stack.md` line 35 lists "NUnit / xUnit + Testcontainers" for the F#
  services. A search of `apps/`, `libs/`, `scripts/` and `.github/` finds no use of Testcontainers outside a Go test
  name. This is an older factual claim, not a Docker instruction, and the migration did not introduce it. Owner:
  the documentation owner.

## 4. Safe affected examples: executed or not run

The plan asks for every safe affected example to run through its declared entry point, and for publishing, shared and
secret-bearing commands to be recorded as not run. This pass ran nothing (it is read-and-edit only). The table maps
each affected example to the earlier run that covers it, or states why none exists.

| Example                                                                                                                            | Status          | Evidence or reason                                                                                                                              |
| ---------------------------------------------------------------------------------------------------------------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `scripts/container-runtime-check --compose` and the explicit provider                                                              | executed        | `../P1/preflight.md` (focused 9 of 9), `../P3/ubuntu-platform.md`, `../P3/macos-platform.md`                                                    |
| `podman compose -f apps/{ose-be,organiclever-be}/docker-compose.e2e.yml up` and `down` (backend READMEs)                           | executed        | `../P3/manual/backends.md`: config exit 0, manual stack up and down, existing E2E targets 5 of 5 and 12 of 12                                   |
| Public-site stacks `ose-www`, `organiclever-www` (`dev:ose-www`, `dev:organiclever` entry points)                                  | executed        | `../P3/compose-stacks.md`, `../P3/manual/ose-www.md`, `../P3/manual/organiclever-www.md`                                                        |
| `dev:ayokoding-www` stack                                                                                                          | not run locally | Local disk floor; the stack was proven in CI run 40693498144. See `../P2/local-stacks.md`                                                       |
| `podman compose -f infra/dev/ose-app/docker-compose.yml up --build` (`apps/ose-app-web/README.md`, `specs/apps/ose/deployment.md`) | not run         | Unsupported legacy scaffold. The plan keeps these at syntax and caller proof only; no `config` run is recorded                                  |
| Setup guide installs (`sudo apt-get install podman=...`, `pipx install podman-compose==1.6.0`, macOS package)                      | not run here    | They change the host and are covered by the P0 installation runs (`../P0/provider-install.md`, `../P0/macos-provider-install.md`)               |
| Publishing, GHCR login and push commands                                                                                           | not run         | Publishing and credential-bearing. Only the fake-registry trace exists (`../P2/publishing.md`); real publication waits for the post-merge audit |
| Generic educational examples (Next.js, React, TypeScript, F# guides)                                                               | not run         | Not repository instructions; they are illustrative and use sample services                                                                      |

## 5. C4 and runtime architecture reconciliation

| Surface                                                                | Runtime wording                                                                                                       | Status                                                                  |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `specs/apps/ayokoding/cli/architecture.md` (context diagram)           | "starts containers through the rootless Podman CLI"; node "Podman CLI, rootless engine" (was "Docker CLI and daemon") | Updated by this branch. Matches the code and `rootless-runtime.feature` |
| `specs/apps/ayokoding/cli/architecture.md` (container diagram)         | "temporary working copies, toolchain images, environment images, run containers, and service containers"              | No runtime brand; unchanged and correct                                 |
| `specs/apps/ayokoding/cli/README.md`                                   | "e2e: the built binary and real rootless Podman"                                                                      | Updated by this branch                                                  |
| `docs/reference/system-architecture/ci-cd.md` step 4                   | "Start the full Podman Compose stack, including PostgreSQL, for E2E proof through public boundaries"                  | Updated by this branch                                                  |
| `docs/reference/system-architecture/applications.md`                   | The ayokoding-cli entry says "course code examples in pinned containers"; the C4 Level 2 diagram has no runtime node  | No delta. "not a Docker container" is C4 terminology                    |
| `docs/reference/web-sites.md`, `docs/reference/monorepo-structure.md`  | `podman run` container example; "Local development Compose files per service (run with Podman Compose)"               | Updated by this branch                                                  |
| `specs/apps/ose/be/architecture.md`, `organiclever/be/architecture.md` | PostgreSQL 17 and NATS appear as dependencies, with no engine or orchestrator node                                    | No delta                                                                |
| Other `specs/apps/*/architecture.md` (www, app-web, ferret, crane)     | No container-engine or Compose node                                                                                   | No delta                                                                |

No-delta dispositions, each from the branch diff against `origin/main` (see also
[scope-dispositions](../P3/scope-dispositions.md)):

- **HTTP, tRPC and schema contracts:** no contract, router, OpenAPI or migration file changed. No delta.
- **UI design:** no design source changed. The prerequisite Mermaid and sidebar repair has its own specifications and
  UI gate records. No design-document delta.
- **Application topology and public APIs:** unchanged; only the runtime nodes and external-tool labels above changed,
  and only where they existed.
- **Phoenix resumption instructions:** read, not edited. `plans/in-progress/ayokoding-app-web/README.md` keeps
  `Depends-on: [docker-to-podman]` and says remaining work "waits for the Podman migration and explicit resumption"
  (lines 4 to 6, 24 and 51), and its `delivery.md` input line requires the "completed Podman predecessor" (line 101).
  Phoenix's feature scope is unchanged. Archival removes the satisfied live prerequisite from its declaration and
  keeps the historical dependency, per the Plan Archival item.

## 6. Gate results for this pass

Run directly at the worktree root on 2026-10-29. No docs or specs file was edited, so these re-confirm the tree rather
than a docs delta.

| Gate                                      | Exit | Result                            |
| ----------------------------------------- | ---- | --------------------------------- |
| `./rhino md internal-link validate`       | 0    | checked 17,286 links, no findings |
| `./rhino governance word-budget validate` | 0    | checked 3,092 files, no findings  |

The final-tree repeat of all gates stays under Local Quality Gates in `delivery.md`.

## 7. Status

The scan and C4 reconciliation are complete for the frozen head. The only residuals are the owner-pending items in
section 3, and a final-tree recheck if later commits touch docs, specs, READMEs or `infra/`.
