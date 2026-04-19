# Adopt wahidyankf-web into ose-public

**Status**: In Progress
**Created**: 2026-04-19
**Scope**: `ose-public` only — new `apps/wahidyankf-web/`, new `apps/wahidyankf-web-e2e/`, new `specs/apps/wahidyankf/`, new production branch `prod-wahidyankf-web`, new deployer agent, new CI workflow, docs updates. `ose-infra` and parent repo untouched.

## Overview

Adopt the standalone personal-portfolio app at
[`wahidyankf/oss / apps-standalone/wahidyankf-web`](https://github.com/wahidyankf/oss/tree/main/apps-standalone/wahidyankf-web)
into this monorepo as `apps/wahidyankf-web/`, alongside `apps/ayokoding-web/`,
`apps/oseplatform-web/`, and `apps/organiclever-fe/`.

The source app is Next.js 14 + React 18 + Tailwind 3 + Vitest 0.31 + Playwright +
Google Analytics / GTM. We port the source and **simultaneously upgrade every
dependency to the latest stable version verified as of 2026-04-19** — pinning
Next.js `16.1.6`, React `^19.0.0`, Tailwind `^4.0.0`, Vitest `^4.0.0`,
Playwright `^1.52.0`, TypeScript `^5.6.0` to match sibling app pins exactly
(see `tech-docs.md` Dependency Upgrade Matrix for the authoritative version
list).
We also retrofit the app to our repository conventions: Nx project config,
oxlint + jsx-a11y, `@amiceli/vitest-cucumber` Gherkin unit tests, a sibling
Playwright-BDD E2E runner, `rhino-cli` coverage validation, `spec-coverage`
enforcement, and Vercel deployment via a production branch.

## Context and Motivation

- `wahidyankf-web` is the maintainer's personal portfolio / CV / projects site.
  Folding it into `ose-public` consolidates the maintainer's public web
  surfaces under one monorepo so quality gates, deploy pipelines, and AI-agent
  content pipelines apply uniformly.
- **Future home for a personal journal.** Post-adoption, the site becomes the
  natural container for a regularly-updated personal journal (short notes,
  engineering reflections, project updates). The journal itself is out of
  scope for this plan, but the adoption sets up the Next.js 16 app, quality
  gates, and deploy pipeline that a later journal plan will build on. Scoping
  the journal separately keeps this plan focused on infrastructure parity
  rather than a content initiative.
- **Marketing and branding for the `ose-public` project.** `ose-public` is
  currently a one-maintainer project. Hosting the maintainer's public
  portfolio inside the same monorepo gives the project a credible public
  face, aligns the portfolio's engineering standards with the monorepo's, and
  lets the portfolio's visitors see the underlying repository structure as a
  proof-of-work signal for the broader platform.
- **Reusable template for other portfolio builders.** Once adopted,
  `apps/wahidyankf-web/` serves as a reference implementation of a
  production-grade personal portfolio on Next.js 16 + React 19 + Tailwind 4 +
  Vitest 4, complete with Playwright-BDD E2E, axe-core accessibility checks,
  coverage gate via `rhino-cli`, oxlint jsx-a11y, Gherkin specs, and a
  Vercel production-branch deploy pipeline. Other users adopting this repo
  as a template can fork the app as a starting point.
- Adoption is also a non-trivial exercise of our "add a new app" workflow on
  a real external codebase — flushes out gaps in
  `docs/how-to/add-new-app.md`, the tag-convention vocabulary
  (`domain:wahidyankf` must be added), the `spec-coverage` project roster,
  and CI runner scheduling.
- The upstream app lags our repo on every major dependency. Rather than
  adopt-then-upgrade in two passes, we upgrade inside the adoption so the
  first commit that lands the app on `main` is already on the repo's current
  tech baseline.

## Stack Parity Requirement

This plan's testing and quality-gate stack MUST match the other three
Next.js apps (`apps/ayokoding-web/`, `apps/oseplatform-web/`,
`apps/organiclever-fe/`). No bespoke test tooling. Concrete alignment:

| Tool                                                    | Shared version                                                        | Rationale                                                                                                                                                                                                                              |
| ------------------------------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `next`                                                  | `16.1.6`                                                              | All three Next.js apps pin this exact version.                                                                                                                                                                                         |
| `react` / `react-dom`                                   | `^19.0.0` (align to ayokoding/oseplatform caret); `^19.1.0` tolerated |                                                                                                                                                                                                                                        |
| `vitest`                                                | `^4.0.0`                                                              | Matches `ayokoding-web` and `oseplatform-web` (both `^4.0.0`). `organiclever-fe` is at `^4.1.0`; we align to the two content-platform siblings as stated in the stack-parity rule.                                                     |
| `@vitejs/plugin-react`                                  | `^4.0.0`                                                              | Matches ayokoding-web and oseplatform-web.                                                                                                                                                                                             |
| `jsdom`                                                 | `^26.0.0`                                                             | Matches ayokoding-web and oseplatform-web.                                                                                                                                                                                             |
| `vite-tsconfig-paths`                                   | `^5.0.0`                                                              | Matches ayokoding-web and oseplatform-web.                                                                                                                                                                                             |
| `@amiceli/vitest-cucumber`                              | `^6.3.0`                                                              | Matches ayokoding-web and oseplatform-web.                                                                                                                                                                                             |
| `@testing-library/jest-dom`                             | `^6.0.0`                                                              | Matches `ayokoding-web` and `oseplatform-web`.                                                                                                                                                                                         |
| `@testing-library/react`                                | `^16.0.0`                                                             | Matches `ayokoding-web` and `oseplatform-web`.                                                                                                                                                                                         |
| `@vitest/coverage-v8`                                   | `^4.0.0`                                                              | Shared.                                                                                                                                                                                                                                |
| `tailwindcss`                                           | `^4.0.0`                                                              | Matches ayokoding-web and oseplatform-web.                                                                                                                                                                                             |
| `@tailwindcss/postcss`                                  | `^4.0.0`                                                              | Matches ayokoding-web and oseplatform-web.                                                                                                                                                                                             |
| `@types/node`                                           | `^22.0.0`                                                             | Matches `ayokoding-web` and `oseplatform-web` (both `^22.0.0`). `organiclever-fe` uses `^22` (semantically equivalent; we align to the content-platform siblings' explicit string).                                                    |
| `@playwright/test` (E2E runner)                         | `^1.52.0`                                                             | Matches `organiclever-fe-e2e` (the E2E model sibling). Note: this is the E2E-runner pin; the adopted app's own `@playwright/test` pin (`^1.50.0`) matches `oseplatform-web`'s value. The P2 parity check reads the app-level row only. |
| `playwright-bdd`                                        | `^8.4.2`                                                              | Matches `organiclever-fe-e2e`.                                                                                                                                                                                                         |
| oxlint + jsx-a11y plugin                                | latest via `npx oxlint@latest --jsx-a11y-plugin`                      | Identical invocation across all four apps.                                                                                                                                                                                             |
| Coverage threshold (`rhino-cli test-coverage validate`) | `80`                                                                  | wahidyankf-web is a pure-FE site with no API/auth mock layer, so it aligns to ayokoding-web and oseplatform-web's `≥80%` floor (not organiclever-fe's `70%` which exists because organiclever-fe mocks API/auth layers by design).     |
| Pre-push gate                                           | `nx affected -t typecheck lint test:quick spec-coverage`              | Identical across all apps.                                                                                                                                                                                                             |
| Coverage validator                                      | `rhino-cli test-coverage validate`                                    | Same CLI, same threshold semantics.                                                                                                                                                                                                    |
| Spec-coverage validator                                 | `rhino-cli spec-coverage validate --shared-steps`                     | Same CLI, same flags.                                                                                                                                                                                                                  |
| Markdown linting                                        | `npm run lint:md`                                                     | Workspace-root command, shared.                                                                                                                                                                                                        |

## Scope

**In scope**:

- `apps/wahidyankf-web/` — new Next.js 16 app (port of upstream)
- `apps/wahidyankf-web-e2e/` — new Playwright-BDD E2E runner
- `specs/apps/wahidyankf/fe/gherkin/` — Gherkin acceptance specs
- `.github/workflows/test-and-deploy-wahidyankf-web.yml` — new CI workflow
- `.claude/agents/apps-wahidyankf-web-deployer.md` — new deployer agent (+
  `.opencode/agent/` mirror via `npm run sync:claude-to-opencode`)
- New production branch `prod-wahidyankf-web` for Vercel deploy
- Tag-vocabulary extension: add `domain:wahidyankf` to
  `governance/development/infra/nx-targets.md` controlled vocabulary
- `docs/`, `apps/README.md`, top-level `CLAUDE.md` and `README.md` updates
  that list the new app and its commands

**Out of scope**:

- `ose-infra` and parent `ose-projects` repos (untouched)
- Any changes to `apps/ayokoding-*`, `apps/oseplatform-*`,
  `apps/organiclever-*` runtime code
- A production domain binding on Vercel (happens outside this repo; plan
  leaves it as a post-merge manual step documented in delivery)
- Content migration beyond what is in the upstream `src/` at
  adoption time (future content updates are separate plans)

## Approach Summary

Eight phases, each ending with a single Conventional-Commits commit **and a
push to `origin`** so progress lands on `main` incrementally under Trunk-Based
Development:

1. **P0 Prep & Gaps** — confirm domain, port, license, vocab extensions.
2. **P1 Scaffold & Port Source** — land skeleton + ported `src/` on the
   repo's current baseline Next 16 / React 19 / Tailwind 4 / Vitest 4 shape.
3. **P2 Upgrade Dependencies** — bump every runtime/dev dep to the latest
   stable version verified during P0 research; run codemods and fix
   breakages.
4. **P3 Unit Tests + Gherkin** — port upstream `.test.tsx` files into
   Vitest 4 + `@amiceli/vitest-cucumber`; add `specs/apps/wahidyankf/fe/`
   feature files; meet **80%** line-coverage threshold (matching
   `ayokoding-web` / `oseplatform-web`).
5. **P4 E2E Runner** — create `apps/wahidyankf-web-e2e/` with `playwright-bdd`
   including smoke + axe-core accessibility features.
6. **P5 Quality Gates** — wire `spec-coverage`, `rhino-cli test-coverage
validate`, oxlint jsx-a11y, Nx inputs; make `nx affected -t typecheck lint
test:quick spec-coverage` green.
7. **P6 Deployment Wiring** — create `prod-wahidyankf-web` branch, `vercel.json`,
   deployer agent, reusable-workflow invocation; extend the tag vocabulary.
8. **P7 Docs & Close-out** — update top-level docs, `apps/README.md`,
   governance cross-refs; run full local quality gate; Playwright MCP visual
   spot-check; archive plan.

The `tech-docs.md` section "Phase Commit Map" names the exact commit title +
files-touched-per-phase so the plan-execution workflow can drive each phase
without guessing boundaries.

## Plan Documents

| Document                                     | Purpose                                                                                                                                                                                                                                                                                                                                                                                        |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`brd.md`](./brd.md)                         | Business Requirements Document — business goal, impact, maintainer and AI-agent roles that consume the app, gut-based success metrics (all explicitly labelled), business-scope non-goals and risks.                                                                                                                                                                                           |
| [`prd.md`](./prd.md)                         | Product Requirements Document — personas, user stories, functional requirements (R1-R15, including responsive + theme + baseline-fidelity requirements), Gherkin acceptance criteria, product scope, UX risks.                                                                                                                                                                                 |
| [`tech-docs.md`](./tech-docs.md)             | File-by-file port map, dependency upgrade matrix (source → target versions aligned to `ayokoding-web` / `oseplatform-web` sibling pins as of 2026-04-19), Nx target configuration, test strategy, live-site baseline reference + P7 Playwright-MCP sanity-check procedure, CI/Vercel wiring, rollout risks, rollback.                                                                          |
| [`delivery.md`](./delivery.md)               | Phase-by-phase checklist of one-action-per-checkbox steps. Every phase ends in an explicit "commit with message X" + push-to-worktree-branch pair so the single draft PR against `main` accumulates every phase commit. Also carries the baseline-comparison checkpoints (P2/P3/P4/P7), Nx-affected registration checks, and the no-live-URL verification rule.                                |
| [`baseline/README.md`](./baseline/README.md) | Live-site baseline reference — 17 PNG screenshots (three viewports × two themes × three routes + one search-filter capture), three YAML accessibility snapshots, and a behavioural-notes document. Captured 2026-04-19 from `https://www.wahidyankf.com/`. Every post-port visual check in `delivery.md` diffs the local adopted app against this folder — NEVER against a refetched live URL. |

> **Note**: Phase P0 creates a temporary `prep-notes.md` file in this directory to record prep research (upstream SHA, license, port number audit, sibling version pins). This file is ephemeral — it is deleted in P7 as part of plan close-out and does not appear in the Plan Documents table above.

## Worktree and Branch Handling

Per the parent repo's Subrepo Worktree Workflow (Scope A), this plan runs
inside a `ose-public` worktree. The current session is already inside
`ose-public/.claude/worktrees/cached-brewing-cocoa/`, which satisfies the
worktree requirement. Execution rules:

- **Branch**: all per-phase commits land on `worktree-cached-brewing-cocoa`
  (the existing worktree branch).
- **Single draft PR**: a single draft PR against `origin/main` is opened
  once during Preconditions and stays open through P0-P7. Every phase
  push updates the same PR — no phase opens a new PR.
- **PR status transitions**: PR remains draft during P0-P5 while quality
  gates are wired in. After P5's `nx affected -t typecheck lint test:quick
spec-coverage` passes cleanly, the PR moves from draft to
  "ready for review".
- **Merge**: the PR merges to `main` before P6 creates the
  `prod-wahidyankf-web` production branch. P6 is the only phase that
  touches `main`-adjacent refs (to push the merged SHA onto the
  production branch); **no phase commits directly to `main`**. (Note:
  P6 also creates deployment infrastructure files — vercel.json,
  Dockerfile, deployer agent, CI workflow — committed to the worktree
  branch before the PR merges; the "main-adjacent" qualifier refers
  only to the production-branch creation step.)
- **P7**: runs the close-out doc commit on either the still-open PR (if
  merge happens only at P7 close-out) or a fresh short-lived doc commit
  if the PR merged immediately after P5. User's choice; `delivery.md`
  covers both paths.

## Baseline Reference (Captured 2026-04-19)

Before the port begins, the live production site at
<https://www.wahidyankf.com/> was captured using Playwright MCP into
`./baseline/` — 17 PNG screenshots at three viewports (desktop 1440 × 900,
tablet 768 × 1024, mobile 375 × 812) × two themes (dark, light) × three
routes (`/`, `/cv`, `/personal-projects`), plus one desktop-dark
`/?search=TypeScript` capture and three accessibility-tree YAML snapshots.
See [`baseline/README.md`](./baseline/README.md) for the full index,
observed behaviour, and comparison procedure.

**The baseline is the authoritative visual reference the adopted app
must match**, verified locally via `nx dev wahidyankf-web` on
`http://localhost:3201/`. Because the Vercel binding for
`www.wahidyankf.com` stays pointed at the upstream `wahidyankf/oss`
build during AND after this plan (the user swaps the binding manually
post-merge), every post-port visual check compares the baseline folder
to the local dev server — NEVER to a refetched live URL.

## References

- Upstream source: <https://github.com/wahidyankf/oss/tree/main/apps-standalone/wahidyankf-web>
- Sibling apps: [`apps/ayokoding-web/`](../../../apps/ayokoding-web/README.md),
  [`apps/oseplatform-web/`](../../../apps/oseplatform-web/README.md),
  [`apps/organiclever-fe/`](../../../apps/organiclever-fe/README.md)
- [How to Add a New App](../../../docs/how-to/add-new-app.md)
- [Nx Target Standards](../../../governance/development/infra/nx-targets.md)
- [Three-Level Testing Standard](../../../governance/development/quality/three-level-testing-standard.md)
- [Plans Organization Convention](../../../governance/conventions/structure/plans.md)
- [Trunk Based Development](../../../governance/development/workflow/trunk-based-development.md)
- [Repository Governance Architecture](../../../governance/repository-governance-architecture.md)
