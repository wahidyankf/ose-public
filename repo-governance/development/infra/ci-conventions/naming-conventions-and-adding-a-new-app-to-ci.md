---
description: App/workflow filename grammar and the new-app checklist.
when_to_use: Use when naming or onboarding a new app.
---

# Naming Conventions and Adding a New App to CI

## Naming Conventions

Workflow filenames follow the domain-first `{domain}-{action-chain}` grammar. The `{action-chain}`
encodes ordered execution phases left-to-right (e.g., `test-local-deploy-stag`). See
[GitHub Actions Workflow Naming Convention](../github-actions-workflow-naming.md) for the complete
grammar, allowed tokens, and the rule that the workflow `name:` field must mirror the filename.

| Entity                    | Pattern                                                                                      | Example                                       |
| ------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------- |
| Backend app               | `{domain}-be` or `{domain}-be-{lang}-{framework}`                                            | `organiclever-be`                             |
| Frontend app              | `{domain}-app-web`                                                                           | `organiclever-app-web`                        |
| www site app              | `{domain}-www`                                                                               | `organiclever-www`                            |
| Infra dev directory       | `infra/dev/{app-name}/`                                                                      | `infra/dev/organiclever-be/`                  |
| Specs directory           | See [Specs Directory Structure](../../../conventions/structure/specs-directory-structure.md) | `specs/apps/organiclever/be/behaviours/`      |
| Reusable workflow         | `_reusable-{purpose}.yml`                                                                    | `_reusable-app-test-local-deploy-stag.yml`    |
| www deploy workflow       | `{domain}-www-test-local-deploy-prod.yml`                                                    | `organiclever-www-test-local-deploy-prod.yml` |
| App staging workflow      | `{domain}-app-test-local-deploy-stag.yml`                                                    | `organiclever-app-test-local-deploy-stag.yml` |
| App staging-gate workflow | `{domain}-app-test-stag.yml`                                                                 | `organiclever-app-test-stag.yml`              |
| BE build+deploy workflow  | `{domain}-be-build-deploy-stag.yml`                                                          | `organiclever-be-build-deploy-stag.yml`       |
| Cross-cutting workflow    | `{group}-{action-chain}.yml`                                                                 | `pr-quality-gate.yml`, `validate-env.yml`     |
| Composite action          | `.github/actions/{name}/action.yml`                                                          | `.github/actions/setup-rust/action.yml`       |

## Adding a New App to CI

Follow this checklist in order when adding a new app variant to the monorepo. Each step that creates or changes code or
declarative configuration is made by `swe-developer`, per [SWE Delegation](../../agents/swe-delegation.md); step 10
changes Markdown only.

1. Create the app in `apps/{name}/` with a `project.json` that declares all mandatory Nx targets
   for its project type (see [Nx Target Standards](../nx-targets.md) for the required target set).
2. Add Nx tags to `project.json` using the four-dimension scheme: `type:`, `platform:`, `lang:`,
   `domain:`.
3. Create `infra/dev/{name}/` containing `docker-compose.yml`, `docker-compose.ci.yml`, and
   `.env.example`.
4. Write Dockerfiles (`Dockerfile` for production, `Dockerfile.integration` if the integration
   tests run in a container).
5. Create the specs directory following the
   [Specs Directory Structure Convention](../../../conventions/structure/specs-directory-structure.md)
   and add at least one `.feature` file.
6. Wire Gherkin consumption in unit tests using the appropriate BDD runner for the language (godog,
   Cucumber, SpecFlow, etc.).
7. Create a per-variant test workflow at `.github/workflows/test-{name}.yml` calling the
   appropriate reusable workflow(s).
8. If the app uses a new language, create a composite action at
   `.github/actions/setup-{lang}/action.yml` before wiring it into any workflow.
9. Add language detection to the PR quality gate workflow so `nx affected` picks up the new
   project type.
10. Update the coverage section of `CLAUDE.md` with the new app's threshold and validate command.
