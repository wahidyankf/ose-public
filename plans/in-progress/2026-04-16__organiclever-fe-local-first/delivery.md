# Delivery — OrganicLever FE Local-First Mode

See [`README.md`](./README.md) for overview, [`brd.md`](./brd.md) for business intent, [`prd.md`](./prd.md) for R1–R7 and Gherkin acceptance criteria, and [`tech-docs.md`](./tech-docs.md) for architecture and implementation details.

## Phase 0 — Environment Setup

- [ ] Install dependencies from repo root: `npm install`
- [ ] Converge polyglot toolchain: `npm run doctor -- --fix`
- [ ] Verify dev server starts: `nx dev organiclever-fe`
- [ ] Set `ORGANICLEVER_BE_URL` in local `.env.local` if needed for development
- [ ] Confirm existing tests pass before making changes: `nx run organiclever-fe:test:quick`

## Phase 1 — Routes and Middleware

- [ ] Delete `apps/organiclever-fe/src/app/login/`
- [ ] Delete `apps/organiclever-fe/src/app/profile/`
- [ ] Delete `apps/organiclever-fe/src/app/api/auth/`
- [ ] Delete `apps/organiclever-fe/src/proxy.ts`
- [ ] Delete `apps/organiclever-fe/src/components/profile-card.tsx` if unreferenced after route removals
- [ ] Delete `apps/organiclever-fe/src/components/profile-card.stories.tsx` when deleting `profile-card.tsx`
- [ ] Rewrite `apps/organiclever-fe/src/app/page.tsx` as a static landing server component

## Phase 2 — Diagnostic Page

- [ ] Create `apps/organiclever-fe/src/app/system/status/be/page.tsx` with `force-dynamic` export
- [ ] Implement `probeBackend()` helper returning `unset | up | down` variants
- [ ] Wire `AbortSignal.timeout(3000)` into the `fetch` call
- [ ] Render UP view (URL, latency, body)
- [ ] Render DOWN view (URL, reason)
- [ ] Render Not-Configured view
- [ ] Verify no `throw` path reaches the page boundary

## Phase 3 — Dormant Code Guardrails

- [ ] Confirm `src/services/` and `src/layers/` compile standalone
- [ ] Run `nx run organiclever-fe:lint` and note any unused-export warnings from services/layers
- [ ] If lint reports unused exports, add `src/services/index.ts` re-exporting `AuthService`, `BackendClient`, `NetworkError`
- [ ] Re-run `nx run organiclever-fe:lint` — must pass with zero errors
- [ ] Run `nx run organiclever-fe:typecheck`

## Phase 4 — Specs and Tests

- [ ] Delete `specs/apps/organiclever/fe/gherkin/authentication/google-login.feature`
- [ ] Delete `specs/apps/organiclever/fe/gherkin/authentication/profile.feature`
- [ ] Delete `specs/apps/organiclever/fe/gherkin/authentication/route-protection.feature`
- [ ] Delete `apps/organiclever-fe/test/unit/steps/authentication/google-login.steps.tsx`
- [ ] Delete `apps/organiclever-fe/test/unit/steps/authentication/profile.steps.tsx`
- [ ] Delete `apps/organiclever-fe/test/unit/steps/authentication/route-protection.steps.tsx`
- [ ] Delete `apps/organiclever-fe-e2e/steps/google-login.steps.ts`
- [ ] Delete `apps/organiclever-fe-e2e/steps/profile.steps.ts`
- [ ] Delete `apps/organiclever-fe-e2e/steps/route-protection.steps.ts`
- [ ] Add `specs/apps/organiclever/fe/gherkin/system/system-status-be.feature` covering the four `/system/status/be` scenarios
- [ ] Add unit step file `apps/organiclever-fe/test/unit/steps/system/system-status-be.steps.tsx`
- [ ] Add `specs/apps/organiclever/fe/gherkin/landing/landing.feature` covering the "Root renders landing without BE" scenario
- [ ] Add unit step file `apps/organiclever-fe/test/unit/steps/landing/landing.steps.tsx`
- [ ] Add e2e step file `apps/organiclever-fe-e2e/steps/landing.steps.ts`
- [ ] Add `specs/apps/organiclever/fe/gherkin/routing/disabled-routes.feature` covering the "Disabled routes return 404" Scenario Outline
- [ ] Add unit step file `apps/organiclever-fe/test/unit/steps/routing/disabled-routes.steps.tsx`
- [ ] Add e2e step file `apps/organiclever-fe-e2e/steps/disabled-routes.steps.ts`
- [ ] Add MSW handler for `/health` (UP and failure variants)
- [ ] Add `apps/organiclever-fe-e2e/steps/system-status-be.steps.ts` (playwright-bdd step definitions)
- [ ] Run `nx run organiclever-fe:test:quick` — command must exit 0 (includes ≥70% coverage gate)
- [ ] Run `nx run organiclever-fe:test:integration`
- [ ] Run `nx run organiclever-fe:spec-coverage`
- [ ] Run `nx run organiclever-fe-e2e:test:e2e` (against local docker-compose)

## Phase 5 — Documentation

- [ ] Rewrite Architecture section in `apps/organiclever-fe/README.md` for local-first mode
- [ ] Document `/system/status/be` failure modes and env var in the README
- [ ] Note dormant BE integration code in the README
- [ ] Update `CLAUDE.md` organiclever-fe description if it mentions BFF
- [ ] Update `docs/reference/system-architecture/applications.md` organiclever-fe section
- [ ] Grep `docs/` and `governance/` for BFF / `/api/auth` references and update or remove

## Local Quality Gates (Before Push)

- [ ] Run affected typecheck: `nx affected -t typecheck`
- [ ] Run affected linting: `nx affected -t lint`
- [ ] Run affected quick tests: `nx affected -t test:quick`
- [ ] Run affected spec coverage: `nx affected -t spec-coverage`
- [ ] Fix ALL failures found — including preexisting issues not caused by your changes
- [ ] Verify all checks pass before pushing

> **Important**: Fix ALL failures found during quality gates, not just those caused by your
> changes. This follows the root cause orientation principle — proactively fix preexisting
> errors encountered during work.

## Commit Guidelines

- [ ] Commit changes thematically — group related changes into logically cohesive commits
- [ ] Follow Conventional Commits format: `<type>(<scope>): <description>`
- [ ] Split different domains/concerns into separate commits (e.g., routes in one commit, tests in another, docs in another)
- [ ] Do NOT bundle unrelated fixes into a single commit

## Manual UI Verification (Playwright MCP — Local)

- [ ] Start dev server: `nx dev organiclever-fe`
- [ ] Navigate to landing page via `browser_navigate http://localhost:3200/`
- [ ] Inspect landing page via `browser_snapshot` — verify heading renders, no redirect occurs
- [ ] Check for JS errors via `browser_console_messages` — must be zero errors
- [ ] Navigate to status page: `browser_navigate http://localhost:3200/system/status/be`
- [ ] Verify "Not configured" renders via `browser_snapshot`
- [ ] Check for JS errors via `browser_console_messages` — must be zero errors
- [ ] Take screenshots via `browser_take_screenshot` for visual record
- [ ] Verify no unexpected network requests via `browser_network_requests` — when `ORGANICLEVER_BE_URL` is unset, `/system/status/be` must make zero outbound fetch calls
- [ ] Verify `/login` returns 404: `browser_navigate http://localhost:3200/login`
- [ ] Verify `/profile` returns 404: `browser_navigate http://localhost:3200/profile`

## Post-Push CI Verification

- [ ] Push changes to `main`
- [ ] Monitor `.github/workflows/test-and-deploy-organiclever.yml` in GitHub Actions
- [ ] Verify all CI checks pass — confirm individual jobs in dependency order: `lint`, `typecheck`, `test-quick`, `spec-coverage`, `e2e`, `deploy`
- [ ] If any CI check fails, fix immediately and push a follow-up commit before proceeding
- [ ] Do NOT proceed to Vercel verification until CI is green

## Phase 6 — Manual Verification on Vercel

- [ ] Push merged work to `prod-organiclever-web`
- [ ] Confirm Vercel build succeeds with `ORGANICLEVER_BE_URL` unset
- [ ] Visit https://www.organiclever.com/ — landing renders
- [ ] Visit https://www.organiclever.com/system/status/be — "Not configured" renders, HTTP 200
- [ ] Set `ORGANICLEVER_BE_URL` in Vercel (`prod-organiclever-web` project) to an unreachable host, trigger a new production deploy, verify `/system/status/be` shows DOWN with reason and HTTP 200, then remove the variable
- [ ] Remove `ORGANICLEVER_BE_URL` from Vercel once verification done

## Phase 7 — Close Out

- [ ] Move plan folder: `git mv plans/in-progress/2026-04-16__organiclever-fe-local-first plans/done/`
- [ ] Update `plans/in-progress/README.md` — remove plan entry
- [ ] Update `plans/done/README.md` — add plan entry with completion date
- [ ] Commit: `chore(plans): move organiclever-fe-local-first to done`
