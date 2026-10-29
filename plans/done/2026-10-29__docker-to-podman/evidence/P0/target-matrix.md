# P0 Frozen Project and Target Matrix

- Source revision: `71bb3aa5cadc1043e709e6cb13c2e0ffd8f489a7`.
- Plan source: `plans/done/2026-10-29__docker-to-podman/tech-docs.md`, “Affected project target matrix” and “Current stack command packet”.
- Project files read: the 13 project files named by the plan matrix, the directly named legacy web/E2E project files, and the two `specs/apps/{ose,organiclever}/be/contracts/project.json` files named by workflow inputs.
- Matrix targets are executed individually from repository root via the HIPPO command in `delivery.md` action 8, using transactional/standard admission for the shared-output bundle/codegen targets. Cache is disabled using the installed Nx-supported mechanism, without replacing or skipping a target.
- Initial plan matrix: 78 existing project-target identities. Direct workflow caller expansion adds 28 more real project targets and one optional OrganicLever WWW integration caller observation, for 106 runnable identities plus 1 N/A observation (107 audited rows). The AyoKoding and OSE integration caller invocations duplicate base rows; OrganicLever WWW has no integration target and its run-many call is an expected no-op under the workflow's optional-integration contract. Its conventionally named backend E2E project is also absent, so the guarded coverage/E2E branches are skipped and add no target row.

## Plan-declared rows

The following exact target sets are read from each corresponding `apps/<project>/project.json` and match the plan's bounded matrix. Each comma-separated target is one independent row/command.

| Project                   | Targets                                                                                                             |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `ayokoding-cli`           | `build`, `lint`, `typecheck`, `test:quick`, `test:unit`, `test:integration`, `test:e2e`, `test:coverage:behaviour`  |
| `ayokoding-www`           | `build`, `lint`, `typecheck`, `test:quick`, `test:unit`, `test:integration`, `test:coverage:behaviour`              |
| `ayokoding-www-be-e2e`    | `lint`, `typecheck`, `test:quick`, `test:e2e`, `test:coverage:behaviour`                                            |
| `ayokoding-www-fe-e2e`    | `lint`, `typecheck`, `test:quick`, `test:e2e`, `test:coverage:behaviour`                                            |
| `ose-www`                 | `build`, `lint`, `typecheck`, `test:quick`, `test:unit`, `test:integration`, `build:e2e`, `test:coverage:behaviour` |
| `ose-www-be-e2e`          | `lint`, `typecheck`, `test:quick`, `test:e2e`, `test:coverage:behaviour`                                            |
| `ose-www-fe-e2e`          | `lint`, `typecheck`, `test:quick`, `test:e2e`, `test:coverage:behaviour`                                            |
| `organiclever-www`        | `build`, `lint`, `typecheck`, `test:quick`, `test:unit`, `test:coverage:behaviour`                                  |
| `organiclever-www-fe-e2e` | `lint`, `typecheck`, `test:quick`, `test:e2e`, `test:coverage:behaviour`                                            |
| `ose-be`                  | `build`, `lint`, `typecheck`, `test:quick`, `test:unit`, `test:integration`, `test:coverage:behaviour`              |
| `ose-be-e2e`              | `lint`, `typecheck`, `test:quick`, `test:e2e`, `test:coverage:behaviour`                                            |
| `organiclever-be`         | `build`, `lint`, `typecheck`, `test:quick`, `test:unit`, `test:integration`, `test:coverage:behaviour`              |
| `organiclever-be-e2e`     | `lint`, `typecheck`, `test:quick`, `test:e2e`, `test:coverage:behaviour`                                            |

The union is 78 rows. Target declarations are present in all listed project files.

## Proven workflow caller expansions

These extra rows are direct commands in the named workflows, not inferred from project-name similarity.

### Public website reusable workflow

`.github/workflows/_reusable-www-test-local-deploy.yml:56,59,61,71,106,111` directly runs the application `test:coverage`, conditionally runs backend E2E `test:coverage` when its project exists, runs frontend E2E `test:coverage`, runs app `test:integration` through a one-project `run-many`, and executes backend/frontend E2E targets. The concrete names are supplied by `.github/workflows/{ayokoding-www,ose-www,organiclever-www}-test-local-deploy-prod.yml:20`.

| Caller input       | Existing direct target rows added                                                                                                           |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `ayokoding-www`    | `ayokoding-www:test:coverage`, `ayokoding-www:test:integration`, `ayokoding-www-be-e2e:test:coverage`, `ayokoding-www-fe-e2e:test:coverage` |
| `ose-www`          | `ose-www:test:coverage`, `ose-www:test:integration`, `ose-www-be-e2e:test:coverage`, `ose-www-fe-e2e:test:coverage`                         |
| `organiclever-www` | `organiclever-www:test:coverage`, `organiclever-www:test:integration` (optional caller; no target), `organiclever-www-fe-e2e:test:coverage` |

Each AyoKoding and OSE caller adds three previously undeclared target identities; their integration calls are already represented in the base matrix. OrganicLever adds two runnable targets and one expected N/A caller observation because its project has no integration target. The workflow checks `nx show project "$be_project"` and conditionally runs backend E2E coverage and E2E only when that project exists. OrganicLever has no `organiclever-www-be-e2e` project, so those two guarded branches are skipped by the current workflow; they are not runnable target rows or a repository-grounding blocker.

### Legacy application staging workflow

`.github/workflows/_reusable-app-test-local-deploy-stag.yml:53-56,66-67,76,90,109-111,149,162` directly calls BE/web `test:coverage`, BE/web `test:quick`, web `lint`, BE Integration, contract `bundle`, BE/web `codegen`, and BE/FE E2E `test:e2e`. Inputs are supplied by `.github/workflows/{ose-app,organiclever-app}-test-local-deploy-stag.yml:24-27`. The stack packet's legacy web E2E targets are also confirmed at reusable lines 162; the BE E2E target is line 149.

| Caller input                                  | Existing direct target rows added                                                                                                                                                                                                                                                                                                                     |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ose-app-test-local-deploy-stag.yml`          | `ose-be:test:coverage`, `ose-app-web:lint`, `ose-app-web:test:quick`, `ose-app-web:test:coverage`, `ose-be-e2e:test:coverage`, `ose-app-web-e2e:test:coverage`, `ose-contracts:bundle`, `ose-be:codegen`, `ose-app-web:codegen`, `ose-app-web-e2e:test:e2e`                                                                                           |
| `organiclever-app-test-local-deploy-stag.yml` | `organiclever-be:test:coverage`, `organiclever-app-web:lint`, `organiclever-app-web:test:quick`, `organiclever-app-web:test:coverage`, `organiclever-be-e2e:test:coverage`, `organiclever-app-web-e2e:test:coverage`, `organiclever-contracts:bundle`, `organiclever-be:codegen`, `organiclever-app-web:codegen`, `organiclever-app-web-e2e:test:e2e` |

All 20 rows exist in their referenced project files. Contracts targets are declared under `specs/apps/{ose,organiclever}/be/contracts/project.json`. The web scaffolds remain unsupported; these rows cover existing workflow regression callers only, not supported-stack proof. `test:quick` intentionally remains a single direct target rather than an inferred expansion into its configured child targets.

## Execution boundaries

The public website workflow builds `be_project="${app-name}-be-e2e"`, but guards both backend E2E coverage and execution with `nx show project`. Its OrganicLever caller supplies `app-name: organiclever-www`; because `apps/organiclever-www-be-e2e/project.json` is absent, those workflow steps are skipped. This is an explicit conditional, not a missing active target, so no blocker or substitute row is recorded. The plan's stack packet names `organiclever-www-fe-e2e:test:e2e`, which is present.

The matrix was frozen before baseline execution; results and receipts are in `baseline-targets.md`. Browser-backed runtime rows remain blocked where the pinned Playwright release has no Chromium download for this host OS. Container-backed backend E2E targets were run only after the Docker ownership/volume/port inventory and use the current Docker engine as the historical baseline; this does not prove the future Podman rootless path. Existing public-site fixture E2E targets are not assumed to prove traffic reached a running Compose stack; the plan's stack packet preserves that distinction.
