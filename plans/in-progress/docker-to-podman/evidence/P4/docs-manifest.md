# P4 docs manifest: Docker-to-Podman documentation audit fixes

This record covers the docs-fixer pass over the read-only documentation audit. The changes are uncommitted; the caller
delivers them. No commit, stage, push, or image build was performed, and `.serena/project.yml` was not touched.

## Frozen inputs

- Worktree: `worktrees/docker-to-podman`. Branch: `docker-to-podman-base`. Base: `origin/main`.
- Findings: F1-F8 applied, D1-D3 left for an owner, KEEP classes not changed. Each applied finding was re-read against
  the current text before editing.
- Pin source: `.github/actions/setup-podman/action.yml` lines 13-15, `ubuntu/resolute/amd64` selects
  `podman_pin="5.7.0+ds2-3build1"`, labelled "Provisional CI row". The first runtime CI run must prove it.

## Findings applied (path:line, before to after)

| ID  | Path                                                                                                          | Before (HEAD)                                                                                                  | After                                                                                                                                 |
| --- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| F1  | `docs/how-to/setup-development-environment.md` 133-135, 138                                                   | Prose cites "the Podman package version recorded for your Ubuntu release"; command `podman=<recorded-version>` | Prose cites the reviewed `ubuntu/resolute/amd64` pin in `.github/actions/setup-podman/action.yml`; command `podman=5.7.0+ds2-3build1` |
| F1  | `docs/how-to/setup-development-environment.md` 465                                                            | "Podman: the package version recorded per platform (Step 2)"                                                   | "Podman: the reviewed package pin in `.github/actions/setup-podman/action.yml` (Step 2)"                                              |
| F1  | `repo-governance/workflows/maintenance/development-environment-setup/005-phase-2-core-tools.md` 36-39         | Comment cites "recorded" pins; command `podman=<recorded-version>` at 39                                       | Comment cites the reviewed pin and says other releases have no pin; command `podman=5.7.0+ds2-3build1` at 39                          |
| F2  | `specs/apps/ose/deployment.md` 7                                                                              | `\| Docker Compose \|`                                                                                         | `\| Podman Compose (`podman-compose`1.6.0) \|`, table re-padded                                                                       |
| F3  | `specs/apps/ose/deployment.md` 15-16                                                                          | `docker compose -f ... up --build -d`                                                                          | `export PODMAN_COMPOSE_PROVIDER=podman-compose` (15), `podman compose -f ... up --build -d` (16)                                      |
| F4  | `specs/apps/ose/deployment.md` 22 (23 after F3 insert)                                                        | `## Docker images`                                                                                             | `## Container images`                                                                                                                 |
| F5  | `docs/explanation/software-engineering/development/test-driven-development-tdd/three-tier-testing.md` 121     | "real PostgreSQL via Docker for backend REST API E2E"                                                          | "real PostgreSQL via rootless Podman Compose for backend REST API E2E"                                                                |
| F6  | `docs/explanation/software-engineering/architecture/hexagonal-architecture/testing-standards.md` 51           | "without Docker"                                                                                               | "without containers"                                                                                                                  |
| F7  | same file, 125                                                                                                | `// In-memory implementation ... (no Docker)`                                                                  | `// In-memory implementation ... (no containers)`                                                                                     |
| F8  | `docs/explanation/software-engineering/architecture/hexagonal-architecture/composition-root-standards.md` 224 | Table cell "Docker or remote environment"                                                                      | "Rootless Podman or remote environment" (re-padded within the existing column width)                                                  |

Post-edit verification: each edit landed; the target text was read back from `git diff`. A formatter hook re-padded the
setup guide's Version Source table (lines 458-465) and the deployment table in F2. The content is unchanged beyond padding.
The 005 file is 504 words (was 497) against a target of 650 and a warn of 750 in `repo-config.yml`.

## Findings left for an owner (MEDIUM or out of scope)

- **D1**: The historical verification comment stays until the E2E is rerun. Changing it now would claim a verification
  that has not been repeated. The location was not re-identified in this pass.
- **D2**: `apps/ayokoding-cli/README.md` line 21 and `apps/ayokoding-cli/internal/domain/finding/finding.go` line 114
  both say "daemon unavailable". Changing the README alone would desynchronize it from the emitted string. This needs a
  coordinated code change and a README update in one unit.
- **D3**: The F# build-config wording was not found in this worktree by a search of `*.fsproj`, `*.fsx`, `*.fs`,
  `*.props`, `*.targets`, and `*.sln` files. The owner must locate it before the change can be assessed.

## KEEP classes (carried from the audit, not re-derived)

The audit's scope is not recorded in the repository, so the 92 hits below are the audit's count. The current tree
contains far more "docker" mentions under a broad scope, so the total was not reproduced.

- 46 generic technology guides (Docker as a subject)
- 17 Dockerfile, `.dockerignore`, and hadolint names
- 6 `docker-compose*.yml` filenames
- 4 intentional negations
- 8 historical decision records
- 11 other

Total: 92.

## Gate exit codes

| Gate                                      | Scope                | Exit                         |
| ----------------------------------------- | -------------------- | ---------------------------- |
| `npx prettier --check`                    | the six edited files | 0 (baseline 0)               |
| `npx markdownlint-cli2`                   | the six edited files | 0 (0 errors; baseline 0)     |
| `./rhino governance word-budget validate` | all surfaces         | 0 (3092 files, no findings)  |
| `./rhino md internal-link validate`       | all Markdown         | 0 (17213 links, no findings) |
| `git diff --check`                        | working tree         | 0                            |

Every command ran through `./hippo run --class ephemeral --resource-tier light --disk-path .` with `TMPDIR` set to
`local-tmp/docs-fixer/`.
