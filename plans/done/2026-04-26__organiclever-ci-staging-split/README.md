# OrganicLever CI — Staging Split

## Overview

Replace the monolithic `test-and-deploy-organiclever.yml` — which couples test-suite
success directly to a production force-push — with three focused workflows:

1. **`test-and-deploy-organiclever-web-development.yml`** — full test suite; on success
   force-pushes to `stag-organiclever-web`. Runs at 3 AM and 3 PM WIB.
2. **`test-organiclever-web-staging.yml`** — Playwright FE E2E tests pointed at the
   staging URL via `WEB_BASE_URL` from the `organiclever-web-staging` GitHub Environment.
   Runs at 5 AM and 5 PM WIB (2 hours after development deploy) and on `workflow_dispatch`.
3. **`deploy-organiclever-web-to-production.yml`** — dispatch-only. Runs staging E2E as a
   gate; on pass, checks out `stag-organiclever-web` and pushes to `prod-organiclever-web`.
   Production is promoted from staging only, never from `main`.

One code change accompanies the workflow split: `apps/organiclever-web-e2e/playwright.config.ts`
renames `process.env.BASE_URL` → `process.env.WEB_BASE_URL`.

## Scope

Single subrepo: `ose-public`. Files changed:

- `.github/workflows/` — delete 1 old workflow, create 3 new ones
- `apps/organiclever-web-e2e/playwright.config.ts` — rename env var
- `.claude/agents/apps-organiclever-web-deployer.md` — rewrite for new deployment model
- `.opencode/agent/apps-organiclever-web-deployer.md` — synced from `.claude/`
- Eight `.md` files — six reference `test-and-deploy-organiclever.yml` by filename;
  two others describe the deployment model in ways that become inaccurate
  (full inventory in [tech-docs.md](./tech-docs.md))

No new Nx projects, no new agents, no conventions, no specs added.

## Navigation

| Document                       | Contents                                                                   |
| ------------------------------ | -------------------------------------------------------------------------- |
| [brd.md](./brd.md)             | Business rationale, risk analysis, success criteria                        |
| [prd.md](./prd.md)             | User stories, Gherkin acceptance criteria, product constraints             |
| [tech-docs.md](./tech-docs.md) | Architecture diagrams, full workflow YAML, design decisions, doc inventory |
| [delivery.md](./delivery.md)   | Step-by-step execution checklist                                           |

## Manual Prerequisites

| Prerequisite                                                                      | Status | Notes                                                                                     |
| --------------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------- |
| Create `stag-organiclever-web` branch                                             | done   | `git push origin HEAD:stag-organiclever-web`                                              |
| Connect Vercel to `stag-organiclever-web`                                         | done   | Staging Vercel deployment already configured                                              |
| Create GitHub Environments (development, staging, production)                     | done   | `organiclever-web-development`, `organiclever-web-staging`, `organiclever-web-production` |
| Set `WEB_BASE_URL` in `organiclever-web-staging`                                  | done   | Vercel staging URL already set                                                            |
| Set `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` in `organiclever-web-development` | todo   | Move from old `"Development - Organic Lever"` env if not already done                     |

## Status

**Done** — completed 2026-04-26. End-to-end verified: WF1
[24955970289](https://github.com/wahidyankf/ose-public/actions/runs/24955970289)
full-pass with deploy step force-pushing to `stag-organiclever-web`; WF2
[24956137638](https://github.com/wahidyankf/ose-public/actions/runs/24956137638)
staging E2E green against the live Vercel staging URL.

## Phases at a Glance

| Phase | Work                                                              | Status |
| ----- | ----------------------------------------------------------------- | ------ |
| 1     | playwright.config.ts rename + delete old + create 3 new workflows | done   |
| 2     | Update eight `.md` files (6 filename refs + 2 model changes)      | done   |
| 3     | Local quality gates (markdown lint, YAML validation)              | done   |
| 4     | Push to `main` + CI verification (incl. Vercel bypass + tag fix)  | done   |
