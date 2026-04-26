# Business Requirements Document

## Problem Statement

`test-and-deploy-organiclever.yml` runs the full test suite twice daily and on every
manual dispatch, then unconditionally force-pushes `main` HEAD to `prod-organiclever-web`
whenever `apps/organiclever-web/` has changed. Vercel auto-deploys on that push.
The result: every green CI run that touches the frontend is a production deployment.

This collapses "tests pass", "code is safe for staging", and "code is safe for
production" into a single automated step. Three failure modes follow:

1. **No human gate before production.** Any code that passes automated tests goes
   live. Coverage gaps — missing edge cases, visual regressions, third-party API
   degradation — reach users with zero friction.

2. **No environment where integrated behavior can be observed before users see it.**
   Staging exists to catch the class of bugs unit and integration tests cannot:
   SSR failures, routing edge cases, device-specific rendering. Without staging,
   those bugs are discovered by users.

3. **Schedule-driven production deploys amplify risk.** CI runs at 6 AM and 6 PM WIB
   regardless of developer activity. A test gap introduced hours earlier silently
   reaches production on the next cron tick.

As feature development accelerates (the `2026-04-25__organiclever-web-app` plan adds
seven new screens, a workout tracker, and analytics), surface area grows and so does
the surface area that could break. The current model does not scale with that complexity.

## Business Goals

| #   | Goal                                | Description                                                                                                                                                                                                                                                                                        |
| --- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Development pipeline**            | Automated CI pushes to `stag-organiclever-web` at 3 AM and 3 PM WIB on every green run via `test-and-deploy-organiclever-web-development.yml`. Staging always reflects latest green code.                                                                                                          |
| 2   | **Scheduled staging verification**  | `test-organiclever-web-staging.yml` hits the real staging URL at 5 AM and 5 PM WIB — 2 hours after development deploy — and on `workflow_dispatch`. Provides a fresh, automated smoke signal.                                                                                                      |
| 3   | **Controlled production promotion** | Production deploy is a manual `workflow_dispatch` on `deploy-organiclever-web-to-production.yml` that (a) runs staging E2E as a gate, (b) on pass, checks out `stag-organiclever-web` and pushes to `prod-organiclever-web`. Production is promoted from staging only, never from `main` directly. |
| 4   | **Documentation accuracy**          | All six `.md` files referencing the old workflow filename are updated so runbooks and governance docs remain correct.                                                                                                                                                                              |

## Stakeholders and Affected Roles

| Role                    | Current friction                                 | After this plan                                                           |
| ----------------------- | ------------------------------------------------ | ------------------------------------------------------------------------- |
| Maintainer as CI author | Owns one monolithic workflow                     | Owns three focused, independently maintainable workflows                  |
| Maintainer as deployer  | Production deploys automatically without consent | Triggers `deploy-organiclever-web-to-production.yml`; E2E gate runs first |
| Maintainer as QA        | No pre-production smoke test mechanism           | Staging E2E runs automatically 2h after development deploy + on dispatch  |

## Success Criteria

| Criterion                                                           | How to verify                                                                                                                                                                                                                    |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Old workflow deleted                                                | `ls .github/workflows/test-and-deploy-organiclever.yml` → "No such file"                                                                                                                                                         |
| Development workflow targets staging, runs at 3 AM/3 PM WIB         | Inspect YAML: cron `0 20 * * *` and `0 8 * * *`; `deploy` job pushes to `stag-organiclever-web`; uses `organiclever-web-development` environment                                                                                 |
| Staging test workflow runs at 5 AM/5 PM WIB and on dispatch         | Inspect YAML: cron `0 22 * * *` and `0 10 * * *` plus `workflow_dispatch`; uses `organiclever-web-staging` environment; reads `WEB_BASE_URL`                                                                                     |
| Production deploy workflow exists, dispatch-only, E2E gate enforced | Inspect YAML: `workflow_dispatch` only; `promote-to-production needs e2e-staging`; `e2e-staging` uses `organiclever-web-staging`; `promote-to-production` uses `organiclever-web-production`; checks out `stag-organiclever-web` |
| No workflow auto-deploys to production                              | `grep -r "prod-organiclever-web" .github/workflows/` matches only `deploy-organiclever-web-to-production.yml`                                                                                                                    |
| `playwright.config.ts` uses `WEB_BASE_URL`                          | `grep "WEB_BASE_URL" apps/organiclever-web-e2e/playwright.config.ts` → match                                                                                                                                                     |
| All six referencing `.md` files updated                             | `grep -r "test-and-deploy-organiclever\.yml" . --include="*.md" --exclude-dir=plans --exclude-dir=generated-reports --exclude-dir=node_modules` → no matches                                                                     |
| Local quality gates pass                                            | `npm run lint:md` exits 0; `npx js-yaml` validates all three new YAML files                                                                                                                                                      |
| Post-push CI green                                                  | All GitHub Actions triggered by the push to `main` pass                                                                                                                                                                          |

## Non-Goals

- **Vercel project configuration** — staging Vercel branch already connected.
- **GitHub Environment creation** — all three environments (`organiclever-web-development`,
  `organiclever-web-staging`, `organiclever-web-production`) already created; `WEB_BASE_URL`
  already set in `organiclever-web-staging`.
- **App code changes beyond `playwright.config.ts`** — `organiclever-web` source untouched.
- **Backend, contract, or spec changes.**
- **C4 architecture diagram updates** — C4 diagrams describe runtime containers and test
  flows, not the deployment pipeline.
- **`ose-infra` or `ose-primer` changes.**

## Business Risks

| Risk                                                               | Likelihood | Impact | Mitigation                                                                                                                                                     |
| ------------------------------------------------------------------ | ---------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E2E gate blocks an urgent production deploy                        | Low        | Medium | Maintainer can bypass by directly pushing: `git push origin stag-organiclever-web:prod-organiclever-web --force`. Documented in delivery.md emergency section. |
| Staging E2E results stale between scheduled runs                   | Low        | Low    | `workflow_dispatch` available on both `test-organiclever-web-staging.yml` and `deploy-organiclever-web-to-production.yml`.                                     |
| Old workflow name references in docs create confusion              | Medium     | Low    | Delivery Phase 2 sweeps all six known referencing files with exact line numbers.                                                                               |
| `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` not yet moved to new env | Low        | High   | Delivery prerequisite: confirm secrets exist in `organiclever-web-development` before running; `be-integration` and `e2e` jobs will fail loudly if absent.     |
| `WEB_BASE_URL` not set in `organiclever-web-staging`               | n/a        | —      | Already done.                                                                                                                                                  |
