# Product Requirements Document

## Product Overview

This plan splits the existing monolithic `test-and-deploy-organiclever.yml` CI workflow
into three focused workflows: a development pipeline that auto-deploys to staging, a
scheduled staging smoke-test, and a gated production-promotion workflow. It also renames
the Playwright E2E env var from `BASE_URL` to `WEB_BASE_URL` for clarity, and updates
eight documentation files that reference the old workflow filename or describe the
now-inaccurate deployment model.

## Personas

**Maintainer as CI author** — owns `.github/workflows/`. Needs three independently
correct, independently triggerable workflow files with clear names. Zero automated
workflows must touch `prod-organiclever-web`.

**Maintainer as deployer** — promotes to production deliberately after staging is
verified. Triggers `deploy-organiclever-web-to-production.yml` via `workflow_dispatch`;
the workflow runs the E2E gate first and only pushes on pass. Source is always
`stag-organiclever-web`, never `main` directly.

**Maintainer as QA** — staging E2E runs automatically 2 hours after each development
deploy (5 AM / 5 PM WIB). Also triggerable on demand via `workflow_dispatch` before a
production promotion. Reads `WEB_BASE_URL` from `organiclever-web-staging` GitHub
Environment — no YAML edit required to change the target URL.

## User Stories

**US-1 — Development pipeline workflow**
As the CI author I want a scheduled and dispatchable workflow that runs the full
OrganicLever test suite (spec-coverage, fe-lint, be-integration, fe-integration, e2e)
and on success force-pushes to `stag-organiclever-web` at 3 AM and 3 PM WIB, so that
the staging environment always reflects the latest green code from `main`.

**US-2 — Scheduled staging E2E**
As the QA maintainer I want a workflow that runs `organiclever-web-e2e:test:e2e`
against the real staging URL at 5 AM and 5 PM WIB — and on `workflow_dispatch` — so
that staging is automatically smoke-tested 2 hours after each development deploy, and
I can also trigger it manually before a production promotion.

**US-3 — Gated production deploy**
As the deployer I want a dispatch-only workflow that first runs the Playwright FE E2E
suite against staging as a blocking gate and, only if it passes, checks out
`stag-organiclever-web` and pushes it to `prod-organiclever-web`, so that production
is always promoted from a staging-verified commit.

**US-4 — No automated production deploy**
As the deployer I want no automated workflow pushing to `prod-organiclever-web`, so
that every production change is a deliberate, traceable human action.

**US-5 — Unambiguous staging URL env var**
As the CI author I want the staging URL environment variable named `WEB_BASE_URL` so that
its scope is unambiguous across the polyglot workspace and clearly distinct from any
backend `BASE_URL`.

**US-6 — Documentation stays accurate**
As the CI author I want all `.md` files that reference `test-and-deploy-organiclever.yml`
updated to the new workflow names, so that runbooks and governance docs remain correct.

## Acceptance Criteria

```gherkin
Feature: OrganicLever CI Staging Split

  Scenario: Old workflow deleted
    Given .github/workflows/test-and-deploy-organiclever.yml exists
    When the plan delivery checklist is fully executed
    Then .github/workflows/test-and-deploy-organiclever.yml does not exist

  Scenario: Development workflow replaces the old one
    Given no development workflow exists
    When the plan delivery checklist is fully executed
    Then .github/workflows/test-and-deploy-organiclever-web-development.yml exists
    And the file is syntactically valid YAML
    And its name field is "Test and Deploy - OrganicLever Web Development"
    And it triggers on cron "0 20 * * *" (3 AM WIB) and "0 8 * * *" (3 PM WIB)
    And it triggers on workflow_dispatch
    And it contains jobs: spec-coverage, fe-lint, be-integration, fe-integration,
        e2e, detect-changes, deploy
    And be-integration and e2e jobs use environment organiclever-web-development
    And the deploy job condition is needs.detect-changes.outputs.has-changes == 'true'
    And the deploy job pushes HEAD to stag-organiclever-web
    And the e2e job FE step sets WEB_BASE_URL to http://localhost:3200
    And no step in any job pushes to prod-organiclever-web

  Scenario: Staging test workflow runs on schedule and dispatch
    Given no staging test workflow exists
    When the plan delivery checklist is fully executed
    Then .github/workflows/test-organiclever-web-staging.yml exists
    And the file is syntactically valid YAML
    And its name field is "Test - OrganicLever Web Staging"
    And it triggers on cron "0 22 * * *" (5 AM WIB) and "0 10 * * *" (5 PM WIB)
    And it triggers on workflow_dispatch
    And it has one job named e2e-staging
    And that job uses environment organiclever-web-staging
    And that job sets WEB_BASE_URL from vars.WEB_BASE_URL
    And that job runs npx nx run organiclever-web-e2e:test:e2e
    And that job uploads a Playwright report artifact
    And no step pushes to any branch

  Scenario: Production deploy workflow gates on staging E2E
    Given no production deploy workflow exists
    When the plan delivery checklist is fully executed
    Then .github/workflows/deploy-organiclever-web-to-production.yml exists
    And the file is syntactically valid YAML
    And its name field is "Deploy - OrganicLever Web to Production"
    And it triggers on workflow_dispatch only
    And it has two jobs: e2e-staging and promote-to-production
    And promote-to-production needs e2e-staging
    And e2e-staging uses environment organiclever-web-staging
    And e2e-staging sets WEB_BASE_URL from vars.WEB_BASE_URL
    And promote-to-production uses environment organiclever-web-production
    And promote-to-production checks out ref stag-organiclever-web
    And promote-to-production pushes HEAD to prod-organiclever-web

  Scenario: No automated production deploy
    Given no automated prod deploy exists at plan start
    When the plan delivery checklist is fully executed
    Then grep -r "prod-organiclever-web" .github/workflows/ matches only
        deploy-organiclever-web-to-production.yml

  Scenario: playwright.config.ts uses WEB_BASE_URL
    Given playwright.config.ts reads process.env.BASE_URL
    When the plan delivery checklist Phase 1 is complete
    Then apps/organiclever-web-e2e/playwright.config.ts reads
        process.env.WEB_BASE_URL || "http://localhost:3200"

  Scenario: All referencing documentation updated
    Given eight .md files contain inaccurate references to the old deployment model
    When the plan delivery Phase 2 is complete
    Then grep -r "test-and-deploy-organiclever\.yml" . --include="*.md"
        --exclude-dir=plans --exclude-dir=generated-reports
        --exclude-dir=node_modules returns no matches
    And docs/reference/system-architecture/applications.md reflects both
        stag-organiclever-web and prod-organiclever-web Vercel deployments
    And governance/development/workflow/trunk-based-development.md lists
        stag-organiclever-web as an environment branch and notes
        prod-organiclever-web is dispatch-only
```

## Product Constraints

**Environment gates are mandatory on all staging-facing workflows.** Both
`test-organiclever-web-staging.yml` and `deploy-organiclever-web-to-production.yml`
must use `environment: organiclever-web-staging`. If the environment is missing or
`WEB_BASE_URL` is unset, both workflows fail loudly — never silently fall back to
localhost.

**`organiclever-web-production` environment on `promote-to-production` job.** Allows
GitHub to enforce protection rules (required reviewers, deployment branch rules) on
the production push step.

**`WEB_BASE_URL` is a variable, not a secret.** Staging URLs are not sensitive. Use
`${{ vars.WEB_BASE_URL }}` throughout.

**Production source is always `stag-organiclever-web`, never `main`.** The
`promote-to-production` job checks out `ref: stag-organiclever-web` explicitly.

**`detect-changes` gate preserved in the development workflow.** No push to
`stag-organiclever-web` when `apps/organiclever-web/` is unchanged — avoids Vercel
no-op builds.

**`environment: organiclever-web-development` on `be-integration` and `e2e` jobs.**
Those jobs run against `localhost` and require `GOOGLE_CLIENT_ID` and
`GOOGLE_CLIENT_SECRET` from that environment.

**No codegen or Go toolchain in staging-facing E2E workflows.** Neither
`test-organiclever-web-staging.yml` nor `deploy-organiclever-web-to-production.yml`
need `setup-golang` or codegen — they run Playwright against an already-deployed URL.

## Product Risks

| Risk                                         | Description                                                                                                                                                                                                                                                                                                                               |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| False production-safety signal               | The staging E2E gate in `deploy-organiclever-web-to-production.yml` runs against the staging URL at dispatch time. If staging state diverges from what was last verified (e.g., a new development deploy lands between the manual trigger and the gate run), the gate result may not reflect the code the deployer intended to promote.   |
| Operator confusion between dispatch commands | Two workflows accept `workflow_dispatch`: `test-organiclever-web-staging.yml` (smoke test only) and `deploy-organiclever-web-to-production.yml` (E2E gate + push to prod). A deployer who runs the wrong one gets a test result but no production deploy, with no error message. Agent and runbook descriptions must be unambiguous.      |
| `WEB_BASE_URL` unset silently failing        | If `WEB_BASE_URL` is absent from `organiclever-web-staging`, Playwright will use `undefined` as the base URL and every test will fail with a URL parse error rather than a clear "env var missing" message. Environment gate enforcement (product constraint) mitigates this, but only if the environment is correctly linked to the job. |

## Out of Scope

- Creating `stag-organiclever-web` branch — done
- Connecting Vercel to `stag-organiclever-web` — done
- Creating GitHub Environments — done (`organiclever-web-development`,
  `organiclever-web-staging`, `organiclever-web-production`)
- Setting `WEB_BASE_URL` in `organiclever-web-staging` — done
- Automated production deploy on a schedule
- Changes to `organiclever-web` app source
- `specs/apps/organiclever/` — C4 diagrams describe runtime containers and test flows,
  not the deployment pipeline; no update needed
- `ose-infra`, `ose-primer` changes
