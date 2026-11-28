---
title: "Gate Inventory"
description: "Every check, its surface, scope, command, and the level placement of its tests"
category: reference
tags: [gates, quality, testing, ci]
created: 2026-11-22
---

# Gate Inventory

This table lists every check the repository runs, where it runs, what it covers, and the command that runs it. The
registry in `repo-config.yml` is normative: `./rhino gate list --output text` prints the declared surfaces, and this
page must agree with it. The contract it records is the test and gate contract in
[`repo-governance/development/quality/checks/test-and-gate-contract.md`](../../repo-governance/development/quality/checks/test-and-gate-contract.md).

## Local Surfaces

| Check                         | Surface     | Scope         | Command                                |
| ----------------------------- | ----------- | ------------- | -------------------------------------- |
| `format-staged`               | pre-commit  | changed files | `./scripts/format-staged <staged>`     |
| `commit-message`              | commit-msg  | the message   | `bash scripts/check-commit-message.sh` |
| `public-safety-range`         | pre-push    | the range     | `bash scripts/public-safety/check.sh`  |
| `pr-leak-review` (agent push) | before push | the head      | the `pr-leak-review` workflow          |

## Pull-Request Registry Checks

All of these run on the `pull-request` surface (the `repository-policy` job of `pr-quality-gate.yml`) and are global
unless the scope says otherwise.

| Check                          | Scope         | Command                                             |
| ------------------------------ | ------------- | --------------------------------------------------- |
| `public-safety-tree`           | global        | `bash scripts/public-safety/check.sh`               |
| `public-safety-commit-message` | the range     | `./scripts/public-safety/check-commit-message`      |
| `commit-message`               | the range     | `bash scripts/check-commit-message.sh`              |
| `commit-range-message`         | the range     | `bash scripts/check-commit-range.sh`                |
| `public-safety-range`          | the range     | `bash scripts/public-safety/check.sh`               |
| `remote-dispatch-refusal`      | global        | `bash scripts/check-remote-dispatch-refusal.sh`     |
| `format-staged`                | changed files | `./scripts/format-staged` (verify clean)            |
| `repo-config`                  | global        | `./rhino repo-config validate`                      |
| `harness-adapters`             | global        | `./rhino harness adapters validate` plus hook tests |
| `agent-hooks-worktree-create`  | global        | `bash .claude/hooks/worktree-create.test.sh`        |
| `governance-vendor`            | global        | `./rhino governance vendor validate`                |
| `governance-quality-gates`     | global        | `./rhino governance quality-gates validate`         |
| `env-validate`                 | global        | `./rhino env validate`                              |
| `markdownlint`                 | global        | `markdownlint-cli2 **/*.md`                         |
| `md-mermaid`                   | changed files | `./scripts/validate-mermaid-files`                  |
| `md-mermaid-repository`        | global        | `./rhino md mermaid validate`                       |
| `md-readme-index`              | global        | `./rhino md readme-index validate`                  |
| `md-internal-link`             | global        | `./rhino md internal-link validate`                 |
| `word-budget`                  | global        | `./rhino governance word-budget validate`           |
| `md-heading-hierarchy`         | global        | `./rhino md heading-hierarchy validate`             |
| `md-naming`                    | global        | `./rhino md naming validate`                        |
| `md-frontmatter`               | global        | `./rhino md frontmatter validate`                   |
| `convention-emoji`             | global        | `./rhino convention emoji validate`                 |
| `shellcheck`                   | changed files | `./scripts/lint-shell`                              |
| `hadolint`                     | changed files | `./scripts/lint-dockerfiles`                        |
| `actionlint`                   | changed files | `./scripts/lint-workflows`                          |

## Pull-Request Workflow Jobs

The jobs of `.github/workflows/pr-quality-gate.yml` run under HIPPO. Per-language lanes always run and report
`success`; their steps are conditioned on the affected set. The aggregate job `quality-gate` passes only when every
needed job finished `success`. It is the required check of the ruleset.

| Job                      | Scope             | Command                                                       |
| ------------------------ | ----------------- | ------------------------------------------------------------- |
| `typescript`             | affected projects | `nx affected -t typecheck,lint,test:quick,compat:min-version` |
| `dotnet`                 | affected projects | `nx affected -t typecheck,lint,test:quick,compat:min-version` |
| `flutter`                | affected projects | `nx affected -t typecheck,lint,test:quick`                    |
| `go`                     | affected projects | `nx affected -t typecheck,lint,test:quick,compat:min-version` |
| `python`                 | affected projects | `nx affected -t typecheck lint test:quick`                    |
| `typescript-integration` | affected projects | `nx affected -t test:integration`                             |
| `dotnet-integration`     | affected projects | `nx affected -t test:integration`                             |
| `go-integration`         | affected projects | `nx affected -t test:integration`                             |
| `python-integration`     | affected projects | `nx affected -t test:integration`                             |
| `examples-*`             | course examples   | the AyoKoding examples check                                  |
| `quality-gate`           | aggregate         | requires every job above to be `success`                      |

## Scheduled and Deployment Workflows

| Workflow                         | Scope                   | Runs                                                  |
| -------------------------------- | ----------------------- | ----------------------------------------------------- |
| `non-product-full-quality.yml`   | non-product projects    | complete `test:quick`, `test:integration`, `test:e2e` |
| `*-test-local-deploy-*.yml`      | the `www` and app homes | `test:e2e` against a local deploy or staging          |
| `dependency-vulnerability-audit` | global                  | dependency audit                                      |

## Test Level Placement

| Level       | Where the tests sit                                                                       |
| ----------- | ----------------------------------------------------------------------------------------- |
| unit        | `tests/unit` of an app or library, and the BDD unit adapters; hermetic, no I/O            |
| integration | `tests/integration`, `tests/bdd-integration`, and the `*-e2e` homes run on the machine    |
| e2e         | the `*-e2e` homes against a deployed environment, `libs/*/tests/e2e`, scheduled workflows |

The behaviour corpus under `specs/` is checked by `./rhino behaviour coverage validate` (target
`test:behaviour:coverage`): every scenario has a unit `@scenario` reference and an integration and an e2e reference or
a valid exemption with a reach reason.

## Exempt Layers and Infeasible Network Denial

| Item                           | Reason                                                               |
| ------------------------------ | -------------------------------------------------------------------- |
| e2e of `ayokoding-web-fe-e2e`  | no deployed variant exists; its integration target runs the suite    |
| e2e of `ayokoding-web-be-e2e`  | no deployed variant exists; its test:e2e target runs the suite       |
| e2e of `ferret-cli-e2e`        | a local CLI with no deployed variant; the integration target runs it |
| e2e of `crane-cli`             | runs the real CLI over local files; no deployed environment          |
| network denial in `test:quick` | recorded per project in the hermetic proof until the host allows it  |
