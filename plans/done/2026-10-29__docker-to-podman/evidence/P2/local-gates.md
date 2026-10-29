# docker-to-podman P2 Local Gates Evidence

## Scope

- Head SHA: `60a35faf1425001c5444239444f1404c61ff84b4` (branch `docker-to-podman-base`).
- Base: `origin/main` at `925a1c6104f4536b5ba4a0179c81edb019b93a63`. All changed-file lists come from
  `/usr/bin/git diff --name-only origin/main...HEAD`.
- Diff size: 396 changed paths (189 added, 206 modified, 1 deleted: `.github/actions/setup-docker-cache/action.yml`),
  15,281 insertions, 1,495 deletions. 395 paths remain after dropping the deleted one.
- Working tree during the run: `.serena/project.yml` and `plans/in-progress/docker-to-podman/delivery.md` were already
  modified and uncommitted; they were not touched. Nothing was staged or committed.
- Compute ran under `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- <cmd>` (HIPPO v0.13.0).
  Every run was admitted; no 124 or 125 exit occurred. `TMPDIR=<short-tmp>`. Node v24.16.0, npm 11.11.0.

| Gate                                 | Exit | Result                                         |
| ------------------------------------ | ---- | ---------------------------------------------- |
| 1. `npm run test:validators`         | 0    | 197 tests, 197 pass, 0 fail                    |
| 2. actionlint (workflows)            | 0    | 6 changed files, 0 errors; all 24 files, clean |
| 2b. composite action `action.yml`    | 0    | 1 changed file parses and passes shape checks  |
| 3. shellcheck                        | 0    | 5 scripts (4 `.sh`, 1 extensionless), clean    |
| 4. YAML parse                        | 0    | 16 changed YAML files, 0 errors                |
| 5. `npx prettier --check`            | 0    | 227 paths passed to prettier, 12 ignored       |
| 5b. prettier on this evidence file   | 0    | See the Gate 5 section                         |
| 6. `git diff --check origin/main...` | 0    | No whitespace errors                           |

## Gate 1: validators

- Command: `npm run test:validators`, run as `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm run test:validators`.
- The script runs `node --test` over 12 files: `scripts/behaviour-coverage.test.mjs`,
  `caller-runtime-contract.test.mjs`, `container-healthcheck-loopback.test.mjs`, `container-image-qualified.test.mjs`,
  `container-runtime-check.test.mjs`, `dockerfile-workspace-deps.test.mjs`, `format-staged.test.mjs`,
  `lint-gates.test.mjs`, `no-docker-binary-calls.test.mjs`, `setup-podman-contract.test.mjs`,
  `workflow-container-lookup.test.mjs`, `workflow-language-lanes.test.mjs`.
- Tool: Node v24.16.0 built-in test runner.
- Exit code: 0.
- Key output: `tests 197`, `suites 0`, `pass 197`, `fail 0`, `cancelled 0`, `skipped 0`, `todo 0`, duration 5.5 s.

## Gate 2: actionlint

The repo's `actionlint` gate (`repo-config.yml`, id `actionlint`) runs `./scripts/lint-workflows`. That wrapper lints the
whole workflow set whenever a changed path is under `.github/workflows/*.yml`, `.github/workflows/*.yaml`, or
`.github/actions/*`. actionlint also runs the `shellcheck` on PATH over every workflow `run:` block.

- Tool: actionlint 1.7.12 (go1.26.1, a user-local binary); shellcheck 0.11.0 on PATH. The `pyflakes` rule
  is disabled because `pyflakes` is not installed; this affects only embedded Python `run:` blocks.
- Changed workflows (6):
  - `.github/workflows/_reusable-app-test-local-deploy-stag.yml`
  - `.github/workflows/_reusable-ayokoding-www-examples-check.yml`
  - `.github/workflows/_reusable-be-build-deploy.yml`
  - `.github/workflows/_reusable-www-test-local-deploy.yml`
  - `.github/workflows/ayokoding-www-test-local-deploy-prod.yml`
  - `.github/workflows/publish-images.yml`
- Command A: `actionlint -verbose <the 6 files>`. Exit code 0. Output: `Linting 6 files`, `Found 0 errors in 6 files`.
- Command B (the repo gate wrapper): `./scripts/lint-workflows <all 395 changed non-deleted paths>`. It triggered and
  linted every file in `.github/workflows/*.yml` (24 files). Exit code 0, no output.
- `.github/actions/README.md` is a changed path under `.github/actions/` and only triggers the wrapper.
- Deleted path `.github/actions/setup-docker-cache/action.yml`: no reference to `setup-docker-cache` remains outside
  `plans/` (searched the whole tree except `node_modules`, `.git`, `local-tmp`, `plans`).

### Composite action

- Changed composite action (1): `.github/actions/setup-podman/action.yml`.
- actionlint does not lint `action.yml` files, and the repo's wrapper does not either; it only uses their presence to
  trigger the workflow lint. The repo has no other composite-action linter.
- Coverage used instead: the Gate 4 YAML parse (OK) and a shape check with the `yaml` package: `name` and `description`
  present, `runs.using` is `composite`, 4 steps, each with `run` plus `shell` or with `uses`. Result OK, exit code 0.
- The `setup-podman` contract is also pinned by `scripts/setup-podman-contract.test.mjs`, which passes in Gate 1.
- The `run:` shell embedded in the composite action was not run through shellcheck, because the repo does not do that.

## Gate 3: shellcheck

The repo's `shellcheck` gate runs `./scripts/lint-shell` (shellcheck at `--severity=warning`, `.shellcheckrc` with
`shell=bash` and `external-sources=true`). The wrapper takes every `*.sh` and `*.bash` path plus extensionless files with
a shell shebang.

- Tool: shellcheck 0.11.0 (`/usr/bin/shellcheck`).
- Files (5):
  - `apps/organiclever-be/scripts/run-e2e.sh`
  - `apps/organiclever-be/scripts/run-integration.sh`
  - `apps/ose-be/scripts/run-e2e.sh`
  - `apps/ose-be/scripts/run-integration.sh`
  - `scripts/container-runtime-check` (extensionless, `#!/usr/bin/env bash`, picked up by the wrapper)
- Command A (repo wrapper over all 395 changed non-deleted paths): `./scripts/lint-shell <paths>`. Exit code 0, no output.
- Command B (stricter than the repo threshold, default severity, includes style and info):
  `shellcheck -- <the 4 .sh files>`, and `shellcheck -- scripts/container-runtime-check`. Both exit code 0, no output.
- Embedded workflow `run:` shell is covered by Gate 2, because actionlint invokes shellcheck.
- Extra, not requested: the repo's `hadolint` gate (`./scripts/lint-dockerfiles`, hadolint 2.12.0) over the 11 changed
  Dockerfiles exited 0. It printed 4 info-level findings (`DL3059` in `apps/ayokoding-www/Dockerfile` and
  `apps/ose-www/Dockerfile`; `DL3015` in `infra/dev/organiclever-app/Dockerfile.be.dev` and
  `infra/dev/ose-app/Dockerfile.be.dev`), which are below the repo's `warning` failure threshold.

## Gate 4: YAML parse

- Parser: Node `yaml` 2.9.0 (`parseAllDocuments` with `strict: true`, `uniqueKeys: true`, checking errors and warnings)
  and `js-yaml` 4.1.1 (`loadAll`). Both must accept each file. `yamllint` is not installed.
- Command: `node local-tmp/claude/yamlcheck.mjs <list of changed .yml/.yaml>`.
- Files (16): `.github/actions/setup-podman/action.yml`, the 6 changed workflows listed in Gate 2,
  `apps/organiclever-be/docker-compose.e2e.yml`, `apps/organiclever-be/docker-compose.integration.yml`,
  `apps/ose-be/docker-compose.e2e.yml`, `apps/ose-be/docker-compose.integration.yml`,
  `infra/dev/ayokoding-www/docker-compose.yml`, `infra/dev/organiclever-www/docker-compose.yml`,
  `infra/dev/ose-app/docker-compose.yml`, `infra/dev/ose-www/docker-compose.yml`, `repo-config.yml`.
- Exit code: 0. Output: `files=16 failed=0`; each file parsed as 1 document with no errors or warnings.
- This is a syntax check, not a Compose schema check.

## Gate 5: prettier

- Tool: prettier 3.8.1 with the root `.prettierrc` (printWidth 120, proseWrap preserve) and `.prettierignore`.
- Command: `npx prettier --check <paths>`.
- Paths: every changed, non-deleted path ending in `.md`, `.yml`, `.yaml`, `.json`, `.ts`, `.tsx`, or `.mjs`: 227 paths
  (137 md, 16 yml, 31 json, 23 ts, 11 tsx, 9 mjs).
- Exit code: 0. Output: `All matched files use Prettier code style!`.
- Ignored by `.prettierignore` (12, all generated harness catalogs and provenance files, so prettier skips them):
  `.agents/agents/{catalog,provenance}.json`, `.claude/agents/{catalog,provenance}.json`,
  `.claude/skills/{catalog,provenance}.json`, `.codex/agents/{catalog,provenance}.json`,
  `.commandcode/agents/{catalog,provenance}.json`, `.opencode/agents/{catalog,provenance}.json`.
- `plans/in-progress/docker-to-podman/delivery.md` is in the list and has uncommitted edits. The check read the working
  tree copy. The committed copy at HEAD also passes (`git show HEAD:<path> | npx prettier --stdin-filepath <path> --check`,
  exit 0).
- This evidence file: `npx prettier --check plans/in-progress/docker-to-podman/evidence/P2/local-gates.md`, exit code 0
  after formatting.

## Gate 6: whitespace

- Command: `/usr/bin/git diff --check origin/main...HEAD`.
- Exit code: 0, no output.

## Notes

- The pre-push enforcement entry point declared by the repo is `.husky/pre-push`, which runs
  `./rhino gate run --surface pre-push`. The `shellcheck`, `hadolint`, and `actionlint` gates in `repo-config.yml` run on
  the pre-commit and pull-request surfaces. Rhino itself was not run for this evidence; each gate's wrapper was run
  directly.
- Scratch scripts and path lists are in `local-tmp/claude/` (ignored, not committed).
