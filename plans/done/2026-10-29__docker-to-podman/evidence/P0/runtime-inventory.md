# P0 Runtime Caller Inventory

## Frozen scan

- Source revision: `71bb3aa5cadc1043e709e6cb13c2e0ffd8f489a7` (`docker-to-podman-base`, created from promoted `origin/main`).
- Required scan: `rtk rg -n -i 'docker|buildx|podman|testcontainers' package.json repo-config.yml apps infra .github scripts repo-governance docs agents .agents/skills README.md AGENTS.md`.
- Expanded spec check: `rtk rg -n -i 'docker|buildx|podman|testcontainers' specs/apps` (the plan declares a spec impact family).
- The required scan returned 5,212 matching lines across 529 paths. The spec scan returned 13 matching lines. This is a path inventory, not a claim that every hit needs migration.
- `apps/ayokoding-www/content/**` and other `apps/*/content/**` contain 4,350 hits in 331 paths; these are excluded lessons/content. Raw matching lines and full path lists are retained only in ignored `local-tmp/plan/docker-to-podman/` files. No generated harness mirror was treated as a canonical source.
- `repo-config.yml` assigns canonical agent and skill ownership to `agents/` and `.agents/skills/`; generated Claude skill route is `.claude/skills/`. The only in-scope canonical skill hit is `apps-organiclever-www-developing-content`; its generated route is not an edit target.

## Exact operational migration candidates

These are the exact existing paths where the frozen scan or the declared file-impact families identify runtime behavior, setup-action/build publication callers, or operational instructions. Whether a Dockerfile/Compose file itself needs a compatibility edit remains conditional on reproduced incompatibility.

### Runtime entry points, runner, and native tests

- `package.json`
- `repo-config.yml`
- `scripts/README.md`
- `apps/ayokoding-cli/CONTRIBUTING.md`
- `apps/ayokoding-cli/README.md`
- `apps/ayokoding-cli/internal/adapters/cli/build_cmd.go`
- `apps/ayokoding-cli/internal/adapters/cli/build_test.go`
- `apps/ayokoding-cli/internal/adapters/containers/build.go`
- `apps/ayokoding-cli/internal/adapters/containers/build_test.go`
- `apps/ayokoding-cli/internal/adapters/containers/run.go`
- `apps/ayokoding-cli/internal/application/application_test.go`
- `apps/ayokoding-cli/internal/application/build.go`
- `apps/ayokoding-cli/internal/application/build_test.go`
- `apps/ayokoding-cli/internal/application/run_test.go`
- `apps/ayokoding-cli/internal/domain/catalog/catalog.go`
- `apps/ayokoding-cli/internal/domain/catalog/catalog_test.go`
- `apps/ayokoding-cli/internal/domain/containerplan/build.go`
- `apps/ayokoding-cli/internal/domain/containerplan/build_test.go`
- `apps/ayokoding-cli/internal/domain/containerplan/run_test.go`
- `apps/ayokoding-cli/internal/domain/containerplan/services_test.go`
- `apps/ayokoding-cli/internal/domain/runspec/runspec_test.go`
- `apps/ayokoding-cli/internal/domain/selection/selection_test.go`
- `apps/ayokoding-cli/tests/bdd/phase6_test.go`
- `apps/ayokoding-cli/tests/bdd/steps_test.go`
- `apps/ayokoding-cli/tests/integration/containers_test.go`
- `apps/ayokoding-cli/toolchains/catalog.yaml`
- `apps/ayokoding-cli/toolchains/toolchains.go`
- `apps/ayokoding-cli/toolchains/flutter/Dockerfile`
- `apps/ayokoding-cli/toolchains/kotlin/Dockerfile`
- `apps/ayokoding-cli/toolchains/ktlint/Dockerfile`
- `apps/ayokoding-cli/toolchains/kubeconform/Dockerfile`
- `apps/ayokoding-cli/toolchains/lua/Dockerfile`
- `apps/ayokoding-cli/toolchains/luajit/Dockerfile`
- `apps/ayokoding-cli/toolchains/neovim/Dockerfile`
- `apps/ayokoding-cli/toolchains/ocaml/Dockerfile`
- `apps/ayokoding-cli/toolchains/shell/Dockerfile`
- `apps/ayokoding-cli/toolchains/typescript/Dockerfile`
- `apps/ayokoding-cli/toolchains/windows-static/Dockerfile`

Keep runner registry/digest fixtures and toolchain-smoke learning fixtures unchanged unless a concrete test contract proves otherwise: `apps/ayokoding-cli/tests/testdata/catalog.yaml`, `apps/ayokoding-cli/tests/testdata/catalog-unpinned.yaml`, `apps/ayokoding-cli/tests/testdata/toolchain-smoke/kubeconform/learning/code/ex-01-hello/deployment.yaml`, and `apps/ayokoding-cli/tests/testdata/toolchain-smoke/kubeconform/learning/lessons/kubeconform.md`.

### Compose stacks, Dockerfiles, and caller code

- Supported public development stacks: `infra/dev/ayokoding-www/docker-compose.yml`, `infra/dev/ose-www/docker-compose.yml`, `infra/dev/organiclever-www/docker-compose.yml`.
- Unsupported legacy scaffolds: `infra/dev/ose-app/README.md`, `infra/dev/ose-app/docker-compose.yml`, `infra/dev/ose-app/docker-compose.ci.yml`, `infra/dev/ose-app/Dockerfile.be.dev`, `infra/dev/ose-app/Dockerfile.fe.dev`, `infra/dev/organiclever-app/README.md`, `infra/dev/organiclever-app/docker-compose.yml`, `infra/dev/organiclever-app/docker-compose.ci.yml`, `infra/dev/organiclever-app/Dockerfile.be.dev`, `infra/dev/organiclever-app/Dockerfile.fe.dev`. Their existing workflow/script references are inventoried, but this plan must not confer supported-stack status on them.
- Backend compose files: `apps/ose-be/docker-compose.e2e.yml`, `apps/ose-be/docker-compose.integration.yml`, `apps/organiclever-be/docker-compose.e2e.yml`, `apps/organiclever-be/docker-compose.integration.yml`.
- Backend Dockerfiles and instructions: `apps/ose-be/Dockerfile`, `apps/ose-be/README.md`, `apps/organiclever-be/Dockerfile`, `apps/organiclever-be/README.md`.
- Backend scripts: `apps/ose-be/scripts/run-e2e.sh`, `apps/ose-be/scripts/run-integration.sh`, `apps/organiclever-be/scripts/run-e2e.sh`, `apps/organiclever-be/scripts/run-integration.sh`.
- Backend E2E callers: `apps/ose-be-e2e/steps/backend-process.ts`, `apps/organiclever-be-e2e/steps/backend-process.ts`.
- Other declared Dockerfile family: `apps/ayokoding-www/Dockerfile`, `apps/ose-www/Dockerfile`, `apps/organiclever-www/Dockerfile`, `apps/ose-app-web/Dockerfile`, `apps/organiclever-app-web/Dockerfile`. Preserve Dockerfile format and make a change only for a reproduced incompatibility.
- Additional in-scope direct references: `apps/ayokoding-www-fe-e2e/tests/e2e/steps/course-paths.steps.ts`, `apps/organiclever-app-web-e2e/playwright.config.ts`.

`package.json` has public-stack start entries for AyoKoding and OSE, plus legacy OrganicLever scaffold start and reset entries. The `_reusable-www-test-local-deploy.yml` caller starts the selected public stack, copies its prerender manifest, conditionally stops it before FE E2E, and tears down its Compose project. The two backend `run-e2e.sh` scripts start the backend E2E Compose services and clean their owned project. Integration shell scripts explicitly run native tests and do not start Compose; `_reusable-app-test-local-deploy-stag.yml` currently invokes each integration Compose file only for `down -v` cleanup. Do not describe those integration stacks as active startup dependencies without new evidence.

### CI, image publication, and action paths

Bounded derived-caller addition, 2026-10-28: `.github/workflows/non-product-full-quality.yml`
already invokes `ayokoding-cli:test:e2e` through its explicit non-product project list. That target
calls `apps/ayokoding-cli/scripts/test-e2e.sh`, builds the CLI, and runs the existing Godog corpus
with the E2E adapter. P1's required native rootless/provider/store scenarios therefore require this
consumer's actual Podman setup/capability edge to be reconciled in P2. This adds one proven caller
path, not another project/target or a claim that the old fake-boundary cases already prove native
operation. Its temporary branch-only Ayo evidence recipe must be retired by restoring reviewed
as-built contents, preserving any real P2 setup changes. The default-branch schedule and ordinary
non-product test scope remain unchanged.

- `.github/actions/README.md`
- `.github/actions/setup-docker-cache/action.yml`
- `.github/workflows/_reusable-app-test-local-deploy-stag.yml`
- `.github/workflows/_reusable-ayokoding-www-examples-check.yml`
- `.github/workflows/_reusable-be-build-deploy.yml`
- `.github/workflows/_reusable-www-test-local-deploy.yml`
- `.github/workflows/ayokoding-www-test-local-deploy-prod.yml`
- `.github/workflows/publish-images.yml`

The frozen callsites include reusable web stack start/inspect/`docker cp`/teardown, Buildx cache setup/rotation, backend image build/push/auth in two publication workflows, and the old-app CI overlay stack. `publish-images.yml` and `_reusable-be-build-deploy.yml` must preserve GHCR names, tags, triggers, and permissions. The old-app CI workflow remains classified as an unsupported scaffold caller.

### Operational documentation, rules, specs, and canonical skill

- `README.md`
- `docs/how-to/add-new-app.md`
- `docs/how-to/setup-development-environment.md`
- `docs/tutorials/getting-started-with-ose-public.md`
- `docs/reference/monorepo-structure.md`
- `docs/reference/sdlc-gate-standard.md`
- `docs/reference/system-architecture/applications.md`
- `docs/reference/system-architecture/ci-cd.md`
- `docs/reference/system-architecture/technology-stack.md`
- `docs/reference/web-sites.md`
- `repo-governance/development/infra/ci-conventions.md`
- `repo-governance/development/infra/ci-conventions/README.md`
- `repo-governance/development/infra/ci-conventions/docker-conventions.md`
- `repo-governance/development/infra/ci-conventions/e2e-test-pairing-rule-and-environment-variable-standard.md`
- `repo-governance/development/infra/ci-conventions/naming-conventions-and-adding-a-new-app-to-ci.md`
- `repo-governance/development/infra/ci-conventions/principles-and-conventions.md`
- `repo-governance/development/infra/docker-monorepo-builds.md`
- `repo-governance/development/infra/docker-monorepo-builds/README.md`
- `repo-governance/development/infra/docker-monorepo-builds/build-context-and-dependency-hoisting.md`
- `repo-governance/development/infra/docker-monorepo-builds/checklists-and-common-pitfalls.md`
- `repo-governance/development/infra/docker-monorepo-builds/validation-references-and-principles.md`
- `repo-governance/development/infra/docker-monorepo-builds/workspace-symlinks-and-direct-injection-pattern.md`
- `repo-governance/development/workflow/reproducible-environments.md`
- `repo-governance/development/workflow/reproducible-environments/README.md`
- `repo-governance/development/workflow/reproducible-environments/containerization-for-complex-environments.md`
- `repo-governance/development/workflow/reproducible-environments/documentation.md`
- `repo-governance/development/workflow/reproducible-environments/migration-guide.md`
- `repo-governance/development/workflow/reproducible-environments/principles-conventions-and-overview.md`
- `repo-governance/development/workflow/reproducible-environments/troubleshooting.md`
- `repo-governance/development/workflow/worktree-and-artifact-cleanup.md`
- `repo-governance/development/workflow/worktree-and-artifact-cleanup/README.md`
- `repo-governance/development/workflow/worktree-and-artifact-cleanup/build-artifact-cleanup.md`
- `repo-governance/development/workflow/worktree-and-artifact-cleanup/docker-artifact-cleanup.md`
- `repo-governance/development/workflow/worktree-and-artifact-cleanup/hard-safety-rules.md`
- `repo-governance/development/workflow/worktree-and-artifact-cleanup/the-four-artifact-classes.md`
- `repo-governance/development/quality/cross-language-lint-strictness.md`
- `repo-governance/development/quality/cross-language-lint-strictness/README.md`
- `repo-governance/development/quality/cross-language-lint-strictness/gated-standards.md`
- `repo-governance/workflows/maintenance/development-environment-setup.md`
- `repo-governance/workflows/maintenance/development-environment-setup/002-tool-inventory.md`
- `repo-governance/workflows/maintenance/development-environment-setup/005-phase-2-core-tools.md`
- `repo-governance/workflows/maintenance/development-environment-setup/013-phase-11-repository-bootstrap.md`
- `repo-governance/workflows/maintenance/development-environment-setup/015-phase-13-verification.md`
- `repo-governance/workflows/maintenance/development-environment-setup/017-minimal-scope-quick-reference.md`
- `repo-governance/workflows/maintenance/development-environment-setup/020-related-documentation.md`
- `repo-governance/workflows/maintenance/development-environment-setup/README.md`
- `.agents/skills/apps-organiclever-www-developing-content/SKILL.md`
- `.agents/skills/apps-organiclever-www-developing-content/reference/comparison-and-development-commands.md`
- `specs/apps/ayokoding/cli/README.md`
- `specs/apps/ayokoding/cli/architecture.md`
- `specs/apps/ayokoding/cli/behaviours/examples/environment-failures.feature`
- `specs/apps/ayokoding/cli/behaviours/toolchains/toolchain-catalog.feature`
- `specs/apps/ose/deployment.md`
- `specs/apps/organiclever/app-web/behaviours/routing/app-routes.feature`
- `specs/apps/organiclever/app-web/behaviours/routing/disabled-routes.feature`

## Mention classifications and exclusions

- **Runtime invocation / provider:** `package.json`, the backend scripts and E2E process files, web CI workflow, backend CI cleanup, and image publication workflows. These are direct callers to reconcile with the rootless Podman/provider contract.
- **Buildx/cache and image registry:** the AyoKoding examples workflow and backend publication workflows contain actual Buildx, Docker auth/build/push operations; GHCR registry naming and tag contracts remain required. Docker Hub/MCR/GHCR strings in Dockerfiles and hadolint configuration are registry or format references, not runtime invocations.
- **Dockerfile/Compose format:** preserve Dockerfile names/syntax and Compose filenames/configuration unless a provider incompatibility is reproduced. `scripts/lint-dockerfiles`, its tests, and hadolint requirements are format checks, not a demand for Docker Engine.
- **Unsupported scaffold:** `infra/dev/ose-app/**`, `infra/dev/organiclever-app/**`, the legacy `package.json` OrganicLever commands, and `_reusable-app-test-local-deploy-stag.yml` scaffold path. Keep their unsupported status explicit; decide whether to retain or retire the references under the approved plan, with no claim of new support.
- **History / generic example:** educational Docker examples, generic containerization patterns, and old decision rationale are not active runtime calls. Keep unchanged unless a narrowly scoped, current repository rule is made false by this plan.
- **Excluded lesson/content:** all `apps/*/content/**`, particularly `apps/ayokoding-www/content/**`; no lesson or learning fixture edits.
- **Registry/test fixture:** CLI catalog testdata and tagged image examples remain fixtures/contracts unless a test change requires corresponding updates.

The `scripts/next-with-port.mjs` Docker mentions describe a generic container-stop signal and Dockerfile metadata; its code does not call a Docker executable. `scripts/lint-dockerfiles`, `scripts/lint-gates.test.mjs`, and `scripts/public-safety/tests/cases/140-cidr-network-prefix.sh` are lint or synthetic fixture references, not runtime callers. Keep those out of runtime edits absent evidence.

## Declared-impact mismatches to resolve before editing

The declared impact list does not currently include these in-scope paths whose content describes repository behavior affected by the runtime switch:

1. `repo-governance/development/infra/README.md` indexes Docker-specific CI/build rules.
2. `repo-governance/development/workflow/README.md`, `repo-governance/development/workflow/native-first-toolchain.md`, and `repo-governance/development/workflow/native-first-toolchain/{README.md,principles-conventions-context-and-decision.md,rationale-package-managers-through-docker-performance.md,rationale-worktrees-and-the-doctor-pattern.md}` include a current decision to use Docker for networked E2E/CI or Docker-specific environment claims. Some passages concern Dev Containers and remain valid; review narrowly rather than blanket rewriting.
3. `repo-governance/conventions/security/secrets-and-env-standards/injection-matrix.md` names GitHub Actions plus `docker-compose` for app integration, and `repo-governance/conventions/security/secrets-and-env-standards/infra-dev-compose-env-no-duplicate-templates.md` names `docker-compose.ci.yml`. Reconcile whether these provider-specific labels must track Podman while preserving Compose env/secret boundaries.
4. `specs/apps/organiclever/app-web/behaviours/routing/app-routes.feature` and `disabled-routes.feature` say their local-fullstack evidence uses the real Docker stack. The file-impact section includes OSE/OrganicLever Markdown but not these `.feature` files.

The coordinator revalidated these passages and resolved their footprint on 2026-10-26, before
caller or rule edits. Whole-repository operational instructions and active specifications are
already authorized by the PRD; the additions below correct the path inventory without changing
that scope, product behavior, or security boundaries:

- Add `repo-governance/development/infra/README.md` for its current runtime overview/index.
- Add `repo-governance/development/workflow/native-first-toolchain.md` and its
  `rationale-worktrees-and-the-doctor-pattern.md` child for current service/E2E/CI runtime
  instructions. Retain historical Dev Container alternatives and performance rationale in the
  other inspected native-first modules; they do not require Docker as the operational runtime.
- Add `repo-governance/conventions/security/secrets-and-env-standards/injection-matrix.md`
  for current provider labels only. Retain `infra-dev-compose-env-no-duplicate-templates.md`
  unchanged: its `docker-compose.ci.yml` reference is a preserved filename, not a provider demand.
- Add the two listed OrganicLever routing feature files for stale verification comments only.
  Preserve scenarios, tags, assertions, and unsupported-scaffold status. Do not replace old
  verification wording with an unproven claim that a supported Podman app stack was exercised.
- Include required parent indexes and the existing scripts index in the annotated impact tree;
  these remain bounded operational propagation, not permission to rewrite their siblings.

`scripts/next-with-port.mjs` has Docker-stop wording but is runtime-generic and does not invoke
Docker; retaining it is supported by the caller scan. No mismatch file has been edited.

## Current-main runner checkpoint and AC-05

A separate read-only source check at the frozen revision compared current main with the historical
plan-10 intent; it did not inspect or copy peer WIP:

- `.github/actions/setup-docker-cache/action.yml:6` uses the Buildx setup action without a local
  driver selection. The reusable examples workflow calls this generic action at line 42. The
  explicit local-driver repair has not landed.
- `.github/workflows/_reusable-ayokoding-www-examples-check.yml:40` proceeds from setup to
  `examples:check`, without shard-specific toolchain prebuilding. The target in
  `apps/ayokoding-www/project.json:240` depends only on the CLI binary build. The checkpoint's
  selected-toolchain prebuild repair has not landed.
- Existing course sharding did land in `c940fc61ef4eb940088d37607bd085ea71e2f3c0` (PR #720):
  `internal/application/check.go:127` applies the shard and its selected courses are executed at
  line 208; `internal/domain/selection/selection.go:99` partitions sorted course slugs.
- Existing local-image run safeguards are present: CLI-relative
  `internal/domain/containerplan/run.go:90` recognizes local namespaces and strips synthetic
  digest suffixes; `internal/application/run_execute.go:160` avoids explicit registry pulls for
  harness-local images. Run-only normalization does not prove build resolution:
  `internal/domain/containerplan/build.go:109` still writes raw catalog image references into
  an environment Dockerfile's `FROM`, including synthetic recipe-digest suffixes on local refs.

AC-05 must therefore prove the entire derived-toolchain build, lockfile-environment build, and
execution chain in one Podman store, with no registry fetch of harness-local bases. Preserve
content-derived identity and select prebuilt recipes from the already-sharded course slice; do not
widen builds to the full catalog. The named runner paths above are relative to
`apps/ayokoding-cli/` unless another path is explicit.

## Readiness

The inventory is frozen and identifies direct candidates before caller changes. The coordinator
resolved the declared-impact mismatches above. Integration Compose files are unused startup
scaffolds with cleanup-only legacy callers; preserve that classification while migrating owned
cleanup and never claim native Integration runs as container proof. Supported runtime paths are
the three public-site Compose files and actual backend E2E stacks. The two legacy app scaffolds
remain unsupported. Dockerfile/Compose syntax, registry names, and lesson content are not blanket
migration targets.
