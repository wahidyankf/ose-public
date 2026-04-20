# Business Requirements Document (BRD)

**Plan**: OrganicLever FE — Local-First Mode
**Date**: 2026-04-16 (migrated to BRD/PRD layout 2026-04-18)

> **Scope note**: Solo-maintainer repo operated with AI agents. Code review is the approval gate; no sponsor or stakeholder sign-off ceremonies. BRD content focuses on intent, impact, affected roles, and success metrics.

## Business Goal

Ship a live `www.organiclever.com` landing site while the F#/Giraffe backend (`organiclever-be`) is still offline, and prove the Vercel deploy pipeline end-to-end on a real FE-only surface. The BRD/PRD split preserves the existing backend code as dormant library code so a future rewire is a routes-only change, not a rebuild.

## Business Impact

### Pain Points Addressed

| Pain Point                                      | Current State                                                                                                    | Impact                                                                                |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| No live landing site for OrganicLever brand     | `organiclever-fe` root redirects to `/login` or `/profile` based on cookie; `/profile` hits BE; BE not deployed. | Vercel deploy blocked on BE; no public-facing surface exists.                         |
| Deploy pipeline unverified against real surface | `test-and-deploy-organiclever.yml` workflow exists but has never deployed a running FE to Vercel.                | No confidence the pipeline works end-to-end when BE finally comes online.             |
| BE readiness opaque to ops                      | No way to observe whether `organiclever-be` is reachable from Vercel without logging into infrastructure.        | Debugging BE rollout later will require infra access instead of a public status page. |
| Dead code in repo                               | `src/proxy.ts` exports a `proxy` function but is never imported and is not wired as Next.js middleware.          | Reader confusion; false impression of route-protection logic that does not execute.   |

### Expected Benefits

These are reasoned structural benefits. No baseline measurements exist; numeric targets are not claimed.

- **Live landing site for brand work**: `www.organiclever.com` becomes reachable with a minimal "coming soon" card that can grow without plan revisions. Brand/marketing work is unblocked.
- **Deploy pipeline validated**: a successful Vercel promote from `prod-organiclever-web` confirms the workflow and env-var wiring are correct before the BE starts depending on them.
- **Graceful BE-readiness signal**: `/system/status/be` gives ops a predictable public endpoint to watch once the BE deploys, with explicit UP/DOWN/timeout/not-configured states that never blank the page.
- **Zero rework for rewire**: The Effect TS service layer (`src/services/`) and layer implementations (`src/layers/`) are preserved as dormant library code. Route Handlers (`src/app/api/auth/`) are deleted. When the BE ships, re-enabling routes is an additive change, not a rebuild.

## Affected Roles

> **Note**: The full Personas table (including public-facing and external-consumer personas) is the canonical source in [`prd.md`](./prd.md#personas). The table below lists roles from the business perspective — how they interact with this plan's business artifacts — not a duplicate of the product persona table.

There is no human sign-off gate. The relevant roles are the maintainer wearing different hats and the agents that consume plan files:

| Role                                                | Primary file(s)                                      | How they consume it                                                |
| --------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------ |
| Maintainer (author, intent mode)                    | `brd.md`                                             | Captures why local-first now, which benefits justify the detour.   |
| Maintainer (author, product-spec mode)              | `prd.md`                                             | Writes R1-R7 + Gherkin acceptance criteria.                        |
| Maintainer (author, engineering mode)               | `tech-docs.md`, `delivery.md`                        | Records route-tree changes, status-page implementation, checklist. |
| Maintainer (reviewer at PR / cold re-read)          | `README.md` → targeted file                          | Navigates to the concern relevant to the current review.           |
| Ops (same maintainer, different hat)                | `/system/status/be` at runtime (not the plan itself) | Watches BE readiness in production once BE deploys.                |
| `plan-maker` / `plan-checker` / `plan-fixer` agents | All five plan files                                  | Produce, validate, and remediate per content-placement rules.      |
| plan-execution workflow (calling context)           | `delivery.md`                                        | Drives per-item execution; may read BRD/PRD for ambiguous items.   |
| `plan-execution-checker` agent                      | `prd.md` + `delivery.md`                             | Validates completed work against Gherkin in `prd.md`.              |

## Success Metrics

Business-level success criteria (product-level criteria live in [prd.md](./prd.md)):

1. **Landing site reachable at `www.organiclever.com`** after `prod-organiclever-web` promote — verifiable by `curl -sS https://www.organiclever.com/` returning HTTP 200 with the landing-page heading in the body.
2. **Vercel build succeeds with `ORGANICLEVER_BE_URL` unset** — verifiable by inspecting the Vercel build log for the promote commit.
3. **`/system/status/be` renders "Not configured"** when env unset and HTTP 200, never 5xx — verifiable by `curl -sS https://www.organiclever.com/system/status/be`.
4. **Disabled routes return 404** — verifiable by `curl` against `/login`, `/profile`, `/api/auth/google`, `/api/auth/refresh`, `/api/auth/me` (all 404).
5. **No Vercel function-log errors** for `/` and `/system/status/be` in the first hour after promote — verifiable from Vercel's log viewer.
6. **BE code preserved**: `src/services/auth-service.ts`, `src/layers/backend-client-live.ts`, `src/services/backend-client.ts`, `src/services/errors.ts` still present with passing unit tests — verifiable by `ls` + `nx run organiclever-fe:test:unit`.

## Non-Goals (Business)

- **Not deploying `organiclever-be`** in this plan. BE work is deferred.
- **Not completing the brand/marketing copy** for the landing page — the MVP "coming soon" card is sufficient; content grows post-plan without plan revision.
- **Not introducing any human sign-off gate**.
- **Not building auth, profile, or any BFF-dependent feature** — all routes that depend on BE are removed from the built surface.
- **Not authoring a migration/rewire plan** for when BE comes online — that is a separate future plan.

## Risks and Mitigations

| Risk                                                                   | Likelihood | Mitigation                                                                                                                                                                                                                                                          |
| ---------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dormant BE client code silently breaks during a dependency bump        | Medium     | Unit tests for `auth-service`, `backend-client`, `backend-client-live`, `errors` stay green in `test:unit`; enforced in CI.                                                                                                                                         |
| `/system/status/be` throws an uncaught exception and reaches 5xx       | Low        | Fetch is wrapped in try/catch at the page level; all failure modes render 200 with a labelled error state.                                                                                                                                                          |
| Vercel deploys a stale build with prior routes still live              | Low        | `test-and-deploy-organiclever.yml` gates the Vercel promote on all prior CI jobs passing. The workflow must be triggered manually via `workflow_dispatch` after pushing to `main` (it does not fire automatically on push). This plan does not modify the workflow. |
| Future maintainer re-enables `src/proxy.ts` thinking it was middleware | Medium     | File is removed outright, not renamed or preserved — rewire must author a new `middleware.ts` in its own plan.                                                                                                                                                      |
| Landing page MVP text is misinterpreted as committed brand voice       | Low        | README's Out-of-Scope explicitly flags the landing copy as minimum viable, expandable without plan revision.                                                                                                                                                        |
