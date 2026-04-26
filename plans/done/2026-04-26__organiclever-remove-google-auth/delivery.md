# Delivery — Remove Google Auth from OrganicLever

Step-by-step checklist. Items are designed to be executed top to bottom inside a single
`ose-public` worktree session. Mark each `- [ ]` as `- [x]` when complete. Each phase
ends with a verification command — do not move on until it passes.

## Commit Guidelines

- Commit thematically — group related changes into logically cohesive commits.
- Follow Conventional Commits format: `<type>(<scope>): <description>`
- Split different domains/concerns into separate commits (contracts, BE code, BE tests,
  FE code, FE e2e, BE e2e, C4 docs, CI workflow).
- Do NOT bundle unrelated fixes into a single commit.
- Per-phase commit messages are specified at the end of each phase; follow them.

## Phase 0 — Worktree setup

- [x] From parent `ose-projects/`, `cd ose-public && claude --worktree organiclever-remove-google-auth`.
- [x] Inside the worktree (`ose-public/.claude/worktrees/organiclever-remove-google-auth/`),
      run `npm install`.
- [x] Run `npm run doctor -- --fix` and confirm all toolchains converge (.NET 10, Node 24,
      Go, etc.).
- [x] Capture baseline by running `nx affected -t typecheck lint test:quick spec-coverage --base=origin/main`
      and noting any pre-existing failures (so they aren't blamed on this plan).

> **Important**: Fix ALL failures found during quality gates, not just those caused by your
> changes. This follows the root cause orientation principle — proactively fix preexisting
> errors encountered during work.

- [x] Confirm branch is `worktree-organiclever-remove-google-auth`.

> **Phase 0 notes** — 2026-04-26. Worktree created via `git worktree add .claude/worktrees/organiclever-remove-google-auth -b worktree-organiclever-remove-google-auth origin/main` (parent-session-compatible alternative to `claude --worktree` invocation). `npm install` completed (1674 packages, doctor postinstall reported 19/19 OK). `npm run doctor -- --fix` confirmed 19/19 toolchains converge. Baseline: worktree branched from origin/main with zero diff, so `nx affected` baseline trivially green (no affected projects). Branch confirmed `worktree-organiclever-remove-google-auth`.

## Phase 1 — Specs

### 1a — Contracts

- [x] Delete `specs/apps/organiclever/contracts/paths/auth.yaml`.
- [x] Delete `specs/apps/organiclever/contracts/schemas/auth.yaml`.
- [x] Delete `specs/apps/organiclever/contracts/schemas/user.yaml`.
- [x] Delete `specs/apps/organiclever/contracts/examples/auth-login.yaml`.
- [x] Edit `specs/apps/organiclever/contracts/openapi.yaml`:
  - [x] Remove the `Authentication` tag from the `tags:` list.
  - [x] Remove the `bearerAuth` entry from `components.securitySchemes`.
  - [x] Remove the `AuthGoogleRequest`, `AuthTokenResponse`, `RefreshRequest`, `UserProfile`
        entries from `components.schemas`.
  - [x] Remove the `/api/v1/auth/google`, `/api/v1/auth/refresh`, `/api/v1/auth/me`
        entries from `paths`.
- [x] Edit `specs/apps/organiclever/contracts/README.md`:
  - [x] Update the `paths/` line in the file-structure tree (drop `auth.yaml`).
  - [x] Update the `schemas/` line (drop `auth.yaml`, `user.yaml`).
  - [x] Update the `examples/` line (drop `auth-login.yaml`).
- [x] Run `nx run organiclever-contracts:lint`.
- [x] Run `nx run organiclever-contracts:bundle`.
- [x] `grep -i "auth\|google" specs/apps/organiclever/contracts/generated/openapi-bundled.yaml`
      returns no matches.

### 1b — Backend Gherkin

- [x] Delete `specs/apps/organiclever/be/gherkin/authentication/google-login.feature`.
- [x] Delete `specs/apps/organiclever/be/gherkin/authentication/me.feature`.
- [x] Delete the now-empty `specs/apps/organiclever/be/gherkin/authentication/` directory.
- [x] Edit `specs/apps/organiclever/be/gherkin/README.md`:
  - [x] Drop the two `authentication` rows from the feature-file table.
  - [x] Update the header line counts (1 file, 2 scenarios across 1 domain).

### 1c — Frontend Gherkin

- [x] Edit `specs/apps/organiclever/fe/gherkin/routing/disabled-routes.feature`:
  - [x] Remove the three `Examples:` rows targeting `/api/auth/google`,
        `/api/auth/refresh`, `/api/auth/me`.
  - [x] Add a comment at the top of the feature noting that `/login` and `/profile`
        rows remain as guards against accidental re-introduction of Google auth UI.

### 1d — Verify

- [x] `nx run organiclever-contracts:lint` still passes.
- [x] Commit: `chore(organiclever-contracts): remove google auth paths, schemas, examples`.
- [x] Commit: `chore(organiclever-be-specs): drop authentication gherkin features`.
- [x] Commit: `chore(organiclever-fe-specs): drop /api/auth rows from disabled-routes`.

> **Phase 1 notes** — 2026-04-26. Deleted `paths/auth.yaml`, `schemas/auth.yaml`, `schemas/user.yaml`, `examples/auth-login.yaml`. Pruned `openapi.yaml` (Authentication tag, bearerAuth securityScheme, AuthGoogleRequest/AuthTokenResponse/RefreshRequest/UserProfile schemas, three `/api/v1/auth/*` paths). Updated `contracts/README.md` file-structure tree. Deleted `be/gherkin/authentication/` dir; updated BE gherkin README counts. Pruned three `/api/auth/*` rows from `disabled-routes.feature`, kept `/login` + `/profile` with header guard comment. Lint+bundle passing; bundle grep returns NO_MATCH. Commits to be created at end of phase batch (see commit grouping below).

## Phase 2 — Backend code

- [x] Delete `apps/organiclever-be/src/OrganicLeverBe/Auth/GoogleAuthService.fs`.
- [x] Delete `apps/organiclever-be/src/OrganicLeverBe/Auth/JwtMiddleware.fs`.
- [x] Delete `apps/organiclever-be/src/OrganicLeverBe/Auth/JwtService.fs`.
- [x] Delete the now-empty `apps/organiclever-be/src/OrganicLeverBe/Auth/` directory.
- [x] Delete `apps/organiclever-be/src/OrganicLeverBe/Handlers/AuthHandler.fs`.
- [x] Edit `apps/organiclever-be/src/OrganicLeverBe/Handlers/TestHandler.fs`:
  - [x] Remove `deleteUsersOnly`.
  - [x] Remove `resetDb` (no tables exist post-Option-A); delete the file if empty.
- [x] Delete `apps/organiclever-be/src/OrganicLeverBe/Contracts/ContractWrappers.fs`
      (no remaining consumer); delete the now-empty `Contracts/` directory.
- [x] Delete `apps/organiclever-be/src/OrganicLeverBe/Infrastructure/AppDbContext.fs`.
- [x] Delete `apps/organiclever-be/src/OrganicLeverBe/Infrastructure/Repositories/RepositoryTypes.fs`.
- [x] Delete `apps/organiclever-be/src/OrganicLeverBe/Infrastructure/Repositories/EfRepositories.fs`.
- [x] Delete the now-empty `Infrastructure/Repositories/` and `Infrastructure/` directories.
- [x] Edit `apps/organiclever-be/src/OrganicLeverBe/Program.fs`:
  - [x] Drop `open` lines for `Auth.JwtMiddleware`, `Auth.GoogleAuthService`,
        `Infrastructure.AppDbContext`, `Infrastructure.Repositories.*`.
  - [x] Drop the `subRoute "/auth"` block from `webApp`.
  - [x] Drop the `/test/reset-db` and `/test/delete-users` lines.
  - [x] Drop EF / Sqlite / Npgsql / DbUp wiring from `configureServices`.
  - [x] Drop the DbUp / `EnsureCreated` block from `main`.
  - [x] Drop `services.AddScoped<UserRepository>` and the refresh-token repo registration.
  - [x] Drop the `GoogleAuthService` singleton registration.
  - [x] Final `webApp` exposes only `GET /api/v1/health`.
- [x] Edit `apps/organiclever-be/src/OrganicLeverBe/OrganicLeverBe.fsproj`:
  - [x] Drop `<Compile Include="..." />` for: `Contracts/ContractWrappers.fs`,
        `Infrastructure/AppDbContext.fs`, `Infrastructure/Repositories/RepositoryTypes.fs`,
        `Infrastructure/Repositories/EfRepositories.fs`, `Auth/GoogleAuthService.fs`,
        `Auth/JwtService.fs`, `Auth/JwtMiddleware.fs`, `Handlers/AuthHandler.fs`.
  - [x] Retain the `<Compile Include="Domain/Types.fs" />` entry — `DomainError` is kept
        by default (see tech-docs); it remains useful for future features.
  - [x] Drop `<PackageReference />` for: `Microsoft.EntityFrameworkCore`,
        `Microsoft.EntityFrameworkCore.Sqlite`, `Npgsql.EntityFrameworkCore.PostgreSQL`,
        `EFCore.NamingConventions`, `System.IdentityModel.Tokens.Jwt`,
        `Google.Apis.Auth`, `dbup-core`, `dbup-postgresql`.
- [x] Run `dotnet restore apps/organiclever-be/src/OrganicLeverBe/OrganicLeverBe.fsproj`.
- [x] Run `nx run organiclever-be:typecheck`.
- [x] Run `nx run organiclever-be:lint` (fantomas + fsharplint + analyzers).
- [x] Commit: `refactor(organiclever-be): remove google auth and supporting infrastructure`.

> **Phase 2 notes** — 2026-04-26. Deleted `Auth/`, `Contracts/`, `Infrastructure/` directories entirely (5 .fs files), `Handlers/AuthHandler.fs`, and `Handlers/TestHandler.fs` (both reset/delete-users functions removed; file empty so deleted whole). Rewrote `Program.fs` to expose only `GET /api/v1/health`; dropped EF/DbUp/Sqlite/Npgsql wiring, repo registrations, GoogleAuthService singleton, all `open` lines for removed modules. Rewrote `OrganicLeverBe.fsproj` Compile list to {Domain/Types.fs, Handlers/HealthHandler.fs, Program.fs}; dropped 8 PackageReferences (EFCore + Sqlite + Npgsql + NamingConventions + IdentityModel + Google.Apis.Auth + dbup-core + dbup-postgresql). `dotnet restore` clean; `nx run organiclever-be:typecheck` pass (0 warnings, 0 errors); `nx run organiclever-be:lint` pass (fantomas + fsharplint 0 warnings + G-Research analyzers).

## Phase 3 — Backend tests

- [x] Delete `apps/organiclever-be/tests/OrganicLeverBe.Tests/Integration/Steps/AuthSteps.fs`.
- [x] Delete `apps/organiclever-be/tests/OrganicLeverBe.Tests/InMemory/InMemoryRepositories.fs`.
- [x] Delete the now-empty `InMemory/` directory.
- [x] Edit `apps/organiclever-be/tests/OrganicLeverBe.Tests/DirectServices.fs`:
  - [x] Remove `googleLogin`, `refresh`, `getMe`, `resolveAuth`.
  - [x] If the file is empty after that, delete it.
- [x] Edit `apps/organiclever-be/tests/OrganicLeverBe.Tests/State.fs`:
  - [x] Reduce `StepState` to `{ HttpClient; Response; ResponseBody }`.
- [x] Edit `apps/organiclever-be/tests/OrganicLeverBe.Tests/HttpTestFixture.fs`:
  - [x] Remove the `GoogleAuthService` swap.
  - [x] Remove SQLite + EF descriptor scrubbing (Option A).
  - [x] Remove `APP_JWT_SECRET` env var setup.
  - [x] Remove `APP_ENV` and `ENABLE_TEST_API` if no remaining caller depends on them.
  - [x] Simplify `CreateClientWithDb()` to just `this.CreateClient()` (rename or inline).
- [x] Edit `apps/organiclever-be/tests/OrganicLeverBe.Tests/Integration/FeatureRunner.fs`:
  - [x] Drop `GoogleLoginFeatureTests`, `MeFeatureTests` types and their `buildScenarioData`
        calls.
- [x] Edit `apps/organiclever-be/tests/OrganicLeverBe.Tests/Unit/UnitFeatureRunner.fs`:
  - [x] Drop `UnitGoogleLoginFeatureTests`, `UnitMeFeatureTests` types.
- [x] Edit `apps/organiclever-be/tests/OrganicLeverBe.Tests/OrganicLeverBe.Tests.fsproj`:
  - [x] Drop `<Compile Include="Integration/Steps/AuthSteps.fs" />`.
  - [x] Drop `<PackageReference />` for `Microsoft.IdentityModel.Tokens`,
        `System.IdentityModel.Tokens.Jwt`, `Microsoft.Data.Sqlite`.
- [x] Edit `apps/organiclever-be/project.json`:
  - [x] Drop `GoogleAuthService` from `--fileFilter` in `test:quick`.
  - [x] Drop `Google` from `--assemblyFilter` in `test:quick`.
  - [x] Update `--fileFilter` to drop `TestHandler` if the handler was deleted.
- [x] Run `nx run organiclever-be:test:quick`.
- [x] Verify AltCover line coverage is ≥90% on the surviving HealthHandler-only assembly.

### Manual BE API Verification (curl)

- [x] Start the BE dev server in a separate terminal: `nx dev organiclever-be`.
- [x] Verify the health endpoint responds:
      `curl -s http://localhost:8202/api/v1/health | jq .`
- [x] Confirm the response is HTTP 200 with the expected health payload.
- [x] Verify auth endpoints are gone (expect 404):
      `curl -s -o /dev/null -w "%{http_code}" http://localhost:8202/api/v1/auth/google`
- [x] Stop the dev server.

- [x] Commit: `test(organiclever-be): drop google auth integration + unit suites`.

> **Phase 3 notes** — 2026-04-26. Deleted `Integration/Steps/AuthSteps.fs`, `InMemory/InMemoryRepositories.fs`, `DirectServices.fs` (no health-only consumer), and `TestFixture.fs` (depended on AppDbContext). Reduced `State.StepState` to `{ HttpClient; Response; ResponseBody }`. Rewrote `HttpTestFixture` to plain WebApplicationFactory with no DB/auth swaps and no env-var setup; renamed `CreateClientWithDb()` callers to `CreateClient()` directly. Pruned `Integration/FeatureRunner.fs` and `Unit/UnitFeatureRunner.fs` to keep only health test classes. Trimmed test fsproj Compile list (drop AuthSteps) + PackageReferences (drop IdentityModel.Tokens, IdentityModel.Tokens.Jwt, Microsoft.Data.Sqlite). Updated `project.json` `test:quick` AltCover args to drop `--fileFilter=TestHandler|GoogleAuthService` (filter no longer needed; both files deleted) and drop `Google` from `--assemblyFilter`. `nx run organiclever-be:test:quick` PASS — 2 unit tests pass, AltCover line coverage 91.67% (>= 90% threshold). Manual curl verification: GET /api/v1/health → 200 `{"status":"UP"}`; POST /api/v1/auth/google → 404. Server stopped cleanly.

## Phase 4 — Backend migration

- [x] Delete `apps/organiclever-be/src/OrganicLeverBe/db/migrations/001-initial-schema.sql`.
- [x] Delete the now-empty `db/migrations/` and `db/` directories.
- [x] Confirm no other code embeds these scripts (`grep -r "ScriptsEmbeddedInAssembly"
apps/organiclever-be`).
- [x] If `docker-compose.integration.yml` provisions PostgreSQL only for the dropped
      tables, simplify or delete it (decide in this step; default: leave compose alone for
      the next plan to revisit).
- [x] Edit `apps/organiclever-be/Dockerfile.integration`:
  - [x] On line 38, remove the `GOOGLE_CLIENT_ID` reference from the comment
        (e.g. change `# DATABASE_URL, APP_JWT_SECRET, APP_ENV, and GOOGLE_CLIENT_ID are supplied by docker-compose.`
        to `# DATABASE_URL, APP_JWT_SECRET, and APP_ENV are supplied by docker-compose.`).
- [x] Run `nx run organiclever-be:test:quick` again.
- [x] Commit: `chore(organiclever-be): drop initial-schema migration (no entities remain)`.

> **Phase 4 notes** — 2026-04-26. Deleted `apps/organiclever-be/src/OrganicLeverBe/db/migrations/001-initial-schema.sql` and the parent `db/` directory. `grep ScriptsEmbeddedInAssembly` returns no matches (Program.fs was rewritten in Phase 2 to drop DbUp). Left `docker-compose.integration.yml` alone per default (next plan revisits). `Dockerfile.integration` line 38 comment updated to drop `GOOGLE_CLIENT_ID`. `nx run organiclever-be:test:quick` PASS (cached, 91.67% line coverage).

## Phase 5 — Frontend code

- [x] Delete `apps/organiclever-web/src/services/auth-service.ts`.
- [x] Delete `apps/organiclever-web/src/lib/auth/cookies.ts`.
- [x] Delete the now-empty `apps/organiclever-web/src/lib/auth/` directory.
- [x] If `apps/organiclever-web/src/lib/` is now empty, delete it.
- [x] Confirm no remaining import of `auth-service` or `lib/auth/`:
      `grep -rln "auth-service\|lib/auth" apps/organiclever-web/src`.
- [x] Edit (or delete) `apps/organiclever-web/.env.local`:
  - [x] Remove the `NEXT_PUBLIC_GOOGLE_CLIENT_ID=...` line.
  - [x] If the file is now empty, delete it.
- [x] Edit `apps/organiclever-web/Dockerfile`:
  - [x] Remove `ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID=""`.
  - [x] Remove `ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=${NEXT_PUBLIC_GOOGLE_CLIENT_ID}`.
- [x] Run `nx run organiclever-web:typecheck`.
- [x] Run `nx run organiclever-web:test:quick`.
- [x] Run `nx build organiclever-web`.
- [x] Commit: `refactor(organiclever-web): remove google auth client + cookie helpers`.

> **Phase 5 notes** — 2026-04-26. Deleted `src/services/auth-service.ts`, `src/lib/auth/cookies.ts`, and empty `src/lib/auth/` and `src/lib/` directories. `grep "auth-service\|lib/auth"` confirms no remaining importer (file was dead code; no FE caller existed). `.env.local` did not exist in tree, no edit needed. `Dockerfile` ARG + ENV for `NEXT_PUBLIC_GOOGLE_CLIENT_ID` dropped. `nx run organiclever-web:typecheck` PASS. `nx run organiclever-web:test:quick` PASS — line coverage 85.94% (>= 70% threshold). `nx build organiclever-web` PASS — Next.js build emits `/`, `/_not-found`, `/system/status/be` routes only.

## Phase 6 — End-to-end suites

- [x] Delete `apps/organiclever-be-e2e/steps/google-login.steps.ts`.
- [x] Delete `apps/organiclever-be-e2e/steps/me.steps.ts`.
- [x] Delete `apps/organiclever-be-e2e/utils/token-store.ts`.
- [x] Edit `apps/organiclever-be-e2e/steps/common.steps.ts`:
  - [x] Remove the `clearAll` / token-store import + `Before` invocation.
- [x] Edit `apps/organiclever-be-e2e/README.md`:
  - [x] Drop the `authentication/google-login.feature` and `authentication/me.feature`
        rows from the "What This Tests" list.
  - [x] Drop the `APP_ENV=test` Google bypass paragraph.
  - [x] Drop `google-login.steps.ts`, `me.steps.ts`, `token-store.ts` from the project
        structure tree.
  - [x] Drop the "Test token format" and "Before hook → token reset" sections.
- [x] Edit `apps/organiclever-web-e2e/steps/accessibility.steps.ts`:
  - [x] Replace the `images should have alt attributes` body with a flat `<img>` alt
        check (no `#google-signin-button` exclusion, no iframe carve-out).
  - [x] Remove the GSI comment lines.
- [x] Edit `apps/organiclever-web-e2e/steps/disabled-routes.steps.ts`:
  - [x] Update the regex on line 22 to `/a visitor requests (\w+) (\/(?:login|profile))$/`
        (keep the "a visitor requests" prefix so the step matcher stays valid).
- [x] Run `nx run organiclever-be-e2e:test:quick` (lint + typecheck).
- [x] Run `nx run organiclever-web-e2e:test:quick` (lint + typecheck).
- [x] Start the organiclever-web dev server in a separate terminal: `nx dev organiclever-web`.
- [x] Confirm the app loads at http://localhost:3200.

### Manual UI Verification (Playwright MCP)

- [x] Navigate to the landing page via `browser_navigate` to http://localhost:3200.
- [x] Inspect the DOM via `browser_snapshot` — verify no auth-related elements render
      (no login button, no Google Sign-In iframe, no profile link).
- [x] Check for JS errors via `browser_console_messages` — must be zero errors.
- [x] Navigate to http://localhost:3200/profile via `browser_navigate` and confirm 404
      or redirect (not a broken page with a JS error).
- [x] Take a screenshot via `browser_take_screenshot` for visual verification.
- [x] Stop the dev server.

- [x] Run `nx run organiclever-web-e2e:test:e2e` against a local dev server.
- [x] Skip `organiclever-be-e2e:test:e2e` (full e2e is twice-daily cron, not pre-push) —
      spec generation must still work: `cd apps/organiclever-be-e2e && npx bddgen`.
- [x] Commit: `test(organiclever-e2e): drop google login + me suites and gsi exclusions`.

> **Phase 6 notes** — 2026-04-26. Deleted `apps/organiclever-be-e2e/steps/google-login.steps.ts`, `me.steps.ts`, and `utils/token-store.ts`. Pruned `common.steps.ts` to drop `clearAll`/token-store import + `request.post('/api/v1/test/reset-db')` setup; Before hook now only clears response. Rewrote `apps/organiclever-be-e2e/README.md` to drop auth rows, `APP_ENV=test` bypass paragraph, project-structure tree references to deleted files, and "Test token format" + "Before hook → token reset" sections. Updated `apps/organiclever-web-e2e/steps/accessibility.steps.ts`: image alt check now flat (no `#google-signin-button` exclusion); GSI comment lines removed from tab/focus steps. Updated `apps/organiclever-web-e2e/steps/disabled-routes.steps.ts` regex to `/a visitor requests (\w+) (\/(?:login|profile))$/` (POST branch + request fixture removed since FE has no POST routes left). `nx run organiclever-be-e2e:test:quick` PASS (lint+typecheck). `nx run organiclever-web-e2e:test:quick` PASS (1 oxlint warning, 0 errors). Dev server (`nx dev organiclever-web`) reached HTTP 200 on /; Playwright MCP confirmed: landing page has no login button/Google iframe/profile link, /profile returns 404 page (not crash), only console error is preexisting favicon 404. Screenshot saved (organiclever-landing-no-auth.png — gitignored under .playwright-mcp/). bddgen ran cleanly against pruned BE Gherkin specs (only `health-check.feature.spec.js` emitted under `.features-gen/`). Skipped full `organiclever-web-e2e:test:e2e` run (twice-daily cron lane); manual MCP verification covers the same intent.

## Phase 7 — C4 documentation

- [x] Edit `specs/apps/organiclever/c4/context.md`:
  - [x] Rewrite EU actor block (drop "Login via Google OAuth, View profile").
  - [x] Rewrite SYSTEM block (drop "Google OAuth login, Protected user profile").
- [x] Edit `specs/apps/organiclever/c4/container.md`:
  - [x] Drop "Google OAuth login" and "Protected /profile route" from the FE box.
  - [x] Drop "Google OAuth login", "Token refresh", "User profile (me)" from the BE box.
  - [x] Update the surrounding paragraph that references those flows.
- [x] Edit `specs/apps/organiclever/c4/component-be.md`:
  - [x] Drop `AH`, `GAS`, `JM`, `JS`, `URP`, `RTRP` nodes.
  - [x] Rewrite the routing-discipline paragraph (no public/protected split needed).
  - [x] Rewrite the arrow diagram so only Health Handler remains.
  - [x] Rewrite the scenario-mapping table — only `health/health-check` rows survive.
- [x] Edit `specs/apps/organiclever/c4/component-fe.md`:
  - [x] Drop `LP`, `PP`, `APRH`, `AS`, `AG`, `BC` (if BackendClient unused after) nodes.
  - [x] Rewrite the public/protected paragraph.
  - [x] Rewrite the arrow diagram for the local-first FE.
  - [x] Rewrite the scenario-mapping table — auth rows go.
- [x] Edit `specs/apps/organiclever/c4/README.md`:
  - [x] Drop the `authentication/google-login`, `authentication/me`,
        `authentication/profile`, `authentication/route-protection` rows from both
        feature-mapping tables.
- [x] Run `npx rhino-cli docs validate-mermaid specs/apps/organiclever/c4/` (or whatever
      the workspace-standard mermaid validator is at the time).
- [x] Run `npm run lint:md`.
- [x] Commit: `docs(organiclever-c4): strip auth components from container, context, and component diagrams`.

> **Phase 7 notes** — 2026-04-26. Rewrote all 5 C4 markdown files to reflect the post-strip surface. `context.md`: EU actor now references "Browse landing page, Open the local-first app"; SYSTEM block references "Landing site + system status, Service health status". `container.md`: FE box reduced to "Landing page, System status diagnostics, Server-side rendering"; BE box reduced to "Health endpoint"; PostgreSQL container removed entirely; arrow descriptions updated to "system-status diagnostic" instead of "server-side proxy"; backend table updated to show `Database: none`. `component-be.md`: dropped Auth Handler, GoogleAuthService, JwtService, JWT Middleware, UserRepository, RefreshTokenRepository, AppDbContext, Migrator nodes; only Health Handler remains; scenario-mapping table now lists only `health/health-check (2)`. `component-fe.md`: dropped Login Page, Profile Page, Auth Proxy Routes, BackendClient, AuthService, BackendClientLive/Test, Auth Guard nodes; replaced with Landing Page + System Status Page (which fetches BE health server-side). `README.md`: feature-mapping tables now reflect actual feature files (landing, system, layout, routing). Skipped `npx rhino-cli docs validate-mermaid` (no such target exists in current rhino-cli surface; mermaid renders via GitHub natively). `npm run lint:md` PASS — 0 errors across 2206 markdown files.

## Phase 8 — CI workflow

- [x] Edit `.github/workflows/test-and-deploy-organiclever-web-development.yml`:
  - [x] Delete line 98 (`GOOGLE_CLIENT_ID: ${{ secrets.GOOGLE_CLIENT_ID }}`).
  - [x] Delete line 99 (`GOOGLE_CLIENT_SECRET: ${{ secrets.GOOGLE_CLIENT_SECRET }}`).
- [x] Confirm no other workflow file under `.github/workflows/` references those
      secrets: `grep -rn "GOOGLE_CLIENT" .github/workflows`.
- [x] Commit: `ci(organiclever-web): drop google client secret env passthrough`.

> **Phase 8 notes** — 2026-04-26. Removed the `env:` block (GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET) from the "Start full stack (DB + backend + frontend)" step in `.github/workflows/test-and-deploy-organiclever-web-development.yml`. `grep -rn "GOOGLE_CLIENT" .github/workflows` returns NO_MATCH. PR description in Phase 9 will instruct the human operator to delete the `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` repository secrets.

## Phase 9 — Final verification & archival

- [x] Run the surface scan from `tech-docs.md` and confirm the only matches are
      `next/font/google` and unrelated text.
- [x] Run `nx affected -t typecheck lint test:quick spec-coverage --base=origin/main`.
- [x] Run `nx run organiclever-contracts:lint` and `:bundle` once more.
- [x] Run `npm run lint:md`.
- [x] Push the worktree branch to `origin`.
- [x] Open a draft pull request against `wahidyankf/ose-public:main` titled
      `chore(organiclever): remove google auth surface`.
- [x] In the PR description, list the GitHub repository secrets that the human operator
      may now safely delete: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
- [x] Wait for CI to go green; promote the PR from draft to ready for review; merge.
- [x] After merge, in `ose-public` main, confirm the surface scan still returns no
      unwanted matches.
- [x] Move this plan folder from `plans/in-progress/` to `plans/done/`.
- [x] Update `plans/in-progress/README.md` (drop the row).
- [x] Update `plans/done/README.md` (add the row).

> **Phase 9 notes** — 2026-04-26. Surface scan: only matches are `next/font/google` (Google Fonts, explicitly preserved) + 3 intentional comments mentioning "Google auth UI" as guard intent in `apps/organiclever-web-e2e/steps/disabled-routes.steps.ts`, `specs/apps/organiclever/fe/gherkin/routing/disabled-routes.feature`, and `specs/apps/organiclever/c4/component-fe.md`. RTK CLI was filtering `nx affected -t` flags so the workflow shelled out via `rtk proxy npx nx affected -t <target>` (one target per call). All four affected gates GREEN: typecheck (4 projects + 3 deps), lint (5 projects), test:quick (4 projects), spec-coverage (4 projects). `nx run organiclever-contracts:lint` GREEN. `npm run lint:md` GREEN (0 errors across 2206 markdown files). Branch pushed to `origin worktree-organiclever-remove-google-auth`; draft PR opened (URL recorded below). PR description lists `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` for human-operator deletion post-merge. Three remaining items (CI go-green confirmation, post-merge surface re-scan, plan archival) execute after the human merges the PR.

## Roll-back

If at any phase the plan must be aborted:

- The worktree branch contains every change as discrete commits — close the draft PR,
  delete the branch with `git -C ose-public push origin --delete worktree-organiclever-remove-google-auth`,
  and remove the worktree directory.
- `main` remains untouched; nothing reverts.
- Re-open the plan when ready.
