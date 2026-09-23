---
description: The path pattern for workflow and action files.
when_to_use: Use when creating or locating a workflow file or action.
---

# GitHub Actions Conventions — File Organisation and Composite Actions

## File Organisation

| Artifact                     | Path pattern                                                | Concrete examples (after-state)                                                                                                                   |
| ---------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Composite action             | `.github/actions/{name}/action.yml`                         | `setup-dotnet`, `setup-node`, `setup-rust`                                                                                                        |
| Reusable workflow            | `.github/workflows/_reusable-{purpose}.yml`                 | `_reusable-www-test-local-deploy.yml`, `_reusable-app-test-local-deploy-stag.yml`, `_reusable-app-test-stag.yml`, `_reusable-be-build-deploy.yml` |
| www deploy workflow          | `.github/workflows/{domain}-www-test-local-deploy-prod.yml` | `ose-www-test-local-deploy-prod.yml`, `ayokoding-www-test-local-deploy-prod.yml`, `organiclever-www-test-local-deploy-prod.yml`                   |
| App staging workflow         | `.github/workflows/{domain}-app-test-local-deploy-stag.yml` | `organiclever-app-test-local-deploy-stag.yml`, `ose-app-test-local-deploy-stag.yml`                                                               |
| App staging-gate workflow    | `.github/workflows/{domain}-app-test-stag.yml`              | `organiclever-app-test-stag.yml`, `ose-app-test-stag.yml`                                                                                         |
| Backend build+deploy         | `.github/workflows/{domain}-be-build-deploy-stag.yml`       | `organiclever-be-build-deploy-stag.yml`, `ose-be-build-deploy-stag.yml`                                                                           |
| Cross-cutting quality gate   | `.github/workflows/pr-quality-gate.yml`                     | `pr-quality-gate.yml` (replaces `pr-quality-gate.yml`)                                                                                            |
| Cross-cutting env validation | `.github/workflows/validate-env.yml`                        | `validate-env.yml` (replaces `commons-env-validate.yml`)                                                                                          |

The 16-workflow after-state consists of 4 reusables, 4 www workflows, 2 app local-deploy-stag, 2
app test-stag-deploy-prod, 2 be-build-deploy-stag, and 2 cross-cutting workflows. The stale files
`pr-quality-gate.yml`, `commons-env-validate.yml`, `validate-markdown.yml`,
`test-and-deploy-*.yml`, `test-*-web-staging.yml`, `deploy-*-to-production.yml`,
`publish-images.yml`, and `test-crane-cli-integration.yml` are removed by this plan. Markdown
validation runs as `pre-commit` and `pull-request` registry gates, the latter in
`pr-quality-gate.yml`'s `Repository policy` job — no standalone `markdown-validate.yml` workflow.

The underscore prefix on reusable workflows (`_reusable-*.yml`) visually separates shared
infrastructure from top-level entry-point workflows in the GitHub Actions UI.

## Composite Actions

Each language or tool that requires non-trivial setup lives in its own composite action under
`.github/actions/{name}/action.yml`. A composite action encapsulates:

- Tool version pinning (via Volta, `setup-dotnet`, etc.)
- Dependency caching configuration
- Any post-setup verification steps

When adding a new language to the monorepo, create a corresponding composite action before wiring
the language into any workflow.

**Examples**:

```
.github/actions/setup-dotnet/action.yml
.github/actions/setup-node/action.yml
.github/actions/setup-rust/action.yml
```
