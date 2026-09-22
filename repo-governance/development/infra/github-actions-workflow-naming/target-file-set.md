---
description: The canonical 17-workflow-file set established by the standardize-github-actions-pipeline-naming plan, organized by tier.
when_to_use: Use when checking whether a workflow filename already exists in the canonical set, or when adding a new filename to it.
---

# Target File Set

The 17 workflow files that the `standardize-github-actions-pipeline-naming` plan establishes as the
canonical set, organized by tier:

## Reusable workflows (`_reusable-` prefix)

| Filename                                   | Purpose                                                                                                |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| `_reusable-www-test-local-deploy.yml`      | Shared job graph for www-tier: lint → unit → specs-coverage → integration → e2e → deploy (prod branch) |
| `_reusable-app-test-local-deploy-stag.yml` | Shared job graph for app-tier local test + dual-branch staging deploy (web + be)                       |
| `_reusable-app-test-stag.yml`              | Shared staging e2e job: runs fe-e2e against deployed staging URL; stops on pass                        |
| `_reusable-be-build-deploy.yml`            | Shared GHCR build+push job for non-Vercel backends; inputs: `be-project`, `image-name`, `environment`  |

## www tier — callers of `_reusable-www-test-local-deploy.yml`

| Filename                                      | Domain             | Deploys to              |
| --------------------------------------------- | ------------------ | ----------------------- |
| `ose-www-test-local-deploy-prod.yml`          | `ose-www`          | `prod-ose-www`          |
| `ayokoding-www-test-local-deploy-prod.yml`    | `ayokoding-www`    | `prod-ayokoding-www`    |
| `organiclever-www-test-local-deploy-prod.yml` | `organiclever-www` | `prod-organiclever-www` |

## app tier — callers of `_reusable-app-test-local-deploy-stag.yml` / `_reusable-app-test-stag.yml`

| Filename                                      | Domain             | Force-pushes                                         |
| --------------------------------------------- | ------------------ | ---------------------------------------------------- |
| `organiclever-app-test-local-deploy-stag.yml` | `organiclever-app` | `stag-organiclever-app-web` + `stag-organiclever-be` |
| `organiclever-app-test-stag.yml`              | `organiclever-app` | (stops on pass — prod CD deferred)                   |
| `ose-app-test-local-deploy-stag.yml`          | `ose-app`          | `stag-ose-app-web` + `stag-ose-be`                   |
| `ose-app-test-stag.yml`                       | `ose-app`          | (stops on pass — prod CD deferred)                   |

## Backend build-deploy (triggered on push to `stag-*-be`)

| Filename                                | Trigger branch         | Reusable called                 |
| --------------------------------------- | ---------------------- | ------------------------------- |
| `organiclever-be-build-deploy-stag.yml` | `stag-organiclever-be` | `_reusable-be-build-deploy.yml` |
| `ose-be-build-deploy-stag.yml`          | `stag-ose-be`          | `_reusable-be-build-deploy.yml` |

## Library deploy workflows

| Filename                       | Domain   | Purpose                                                                                |
| ------------------------------ | -------- | -------------------------------------------------------------------------------------- |
| `web-ui-build-deploy-prod.yml` | `web-ui` | Daily/on-demand: build Storybook and force-push `prod-web-ui` only when inputs changed |

## Cross-cutting workflows

| Filename                             | Domain       | Purpose                                                                        |
| ------------------------------------ | ------------ | ------------------------------------------------------------------------------ |
| `dependency-vulnerability-audit.yml` | `dependency` | Scheduled dependency-vulnerability audit, outside registry gate surfaces       |
| `pr-quality-gate.yml`                | `pr`         | PR gate: typecheck, lint, and test:quick, which owns Unit plus static coverage |
| `validate-env.yml`                   | `validate`   | `.env.example` contract + `env-injection:` manifest check                      |

## Added after the establishing plan

The set above is the one that plan established. A workflow added later is recorded here before it
merges, so the table stays the lookup for whether a filename already exists. This entry is
**unenforced by decision**: the README-completeness gate checks annotated indexes under the
documentation trees, not this table, and no check reads `.github/workflows/` against it.

| Filename                 | Domain       | Purpose                                                                       |
| ------------------------ | ------------ | ----------------------------------------------------------------------------- |
| `ferret-cli-release.yml` | `ferret-cli` | Tag-triggered: build the zipapp and publish the GitHub release with checksums |

Workflows predating this section that the set above omits are a separate backlog item; adding one
here is not a licence to backfill them in an unrelated change.
