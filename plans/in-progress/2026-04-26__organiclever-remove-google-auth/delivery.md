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

- [ ] From parent `ose-projects/`, `cd ose-public && claude --worktree organiclever-remove-google-auth`.
- [ ] Inside the worktree (`ose-public/.claude/worktrees/organiclever-remove-google-auth/`),
      run `npm install`.
- [ ] Run `npm run doctor -- --fix` and confirm all toolchains converge (.NET 10, Node 24,
      Go, etc.).
- [ ] Capture baseline by running `nx affected -t typecheck lint test:quick spec-coverage --base=origin/main`
      and noting any pre-existing failures (so they aren't blamed on this plan).

> **Important**: Fix ALL failures found during quality gates, not just those caused by your
> changes. This follows the root cause orientation principle — proactively fix preexisting
> errors encountered during work.

- [ ] Confirm branch is `worktree-organiclever-remove-google-auth`.

## Phase 1 — Specs

### 1a — Contracts

- [ ] Delete `specs/apps/organiclever/contracts/paths/auth.yaml`.
- [ ] Delete `specs/apps/organiclever/contracts/schemas/auth.yaml`.
- [ ] Delete `specs/apps/organiclever/contracts/schemas/user.yaml`.
- [ ] Delete `specs/apps/organiclever/contracts/examples/auth-login.yaml`.
- [ ] Edit `specs/apps/organiclever/contracts/openapi.yaml`:
  - [ ] Remove the `Authentication` tag from the `tags:` list.
  - [ ] Remove the `bearerAuth` entry from `components.securitySchemes`.
  - [ ] Remove the `AuthGoogleRequest`, `AuthTokenResponse`, `RefreshRequest`, `UserProfile`
        entries from `components.schemas`.
  - [ ] Remove the `/api/v1/auth/google`, `/api/v1/auth/refresh`, `/api/v1/auth/me`
        entries from `paths`.
- [ ] Edit `specs/apps/organiclever/contracts/README.md`:
  - [ ] Update the `paths/` line in the file-structure tree (drop `auth.yaml`).
  - [ ] Update the `schemas/` line (drop `auth.yaml`, `user.yaml`).
  - [ ] Update the `examples/` line (drop `auth-login.yaml`).
- [ ] Run `nx run organiclever-contracts:lint`.
- [ ] Run `nx run organiclever-contracts:bundle`.
- [ ] `grep -i "auth\|google" specs/apps/organiclever/contracts/generated/openapi-bundled.yaml`
      returns no matches.

### 1b — Backend Gherkin

- [ ] Delete `specs/apps/organiclever/be/gherkin/authentication/google-login.feature`.
- [ ] Delete `specs/apps/organiclever/be/gherkin/authentication/me.feature`.
- [ ] Delete the now-empty `specs/apps/organiclever/be/gherkin/authentication/` directory.
- [ ] Edit `specs/apps/organiclever/be/gherkin/README.md`:
  - [ ] Drop the two `authentication` rows from the feature-file table.
  - [ ] Update the header line counts (1 file, 2 scenarios across 1 domain).

### 1c — Frontend Gherkin

- [ ] Edit `specs/apps/organiclever/fe/gherkin/routing/disabled-routes.feature`:
  - [ ] Remove the three `Examples:` rows targeting `/api/auth/google`,
        `/api/auth/refresh`, `/api/auth/me`.
  - [ ] Add a comment at the top of the feature noting that `/login` and `/profile`
        rows remain as guards against accidental re-introduction of Google auth UI.

### 1d — Verify

- [ ] `nx run organiclever-contracts:lint` still passes.
- [ ] Commit: `chore(organiclever-contracts): remove google auth paths, schemas, examples`.
- [ ] Commit: `chore(organiclever-be-specs): drop authentication gherkin features`.
- [ ] Commit: `chore(organiclever-fe-specs): drop /api/auth rows from disabled-routes`.

## Phase 2 — Backend code

- [ ] Delete `apps/organiclever-be/src/OrganicLeverBe/Auth/GoogleAuthService.fs`.
- [ ] Delete `apps/organiclever-be/src/OrganicLeverBe/Auth/JwtMiddleware.fs`.
- [ ] Delete `apps/organiclever-be/src/OrganicLeverBe/Auth/JwtService.fs`.
- [ ] Delete the now-empty `apps/organiclever-be/src/OrganicLeverBe/Auth/` directory.
- [ ] Delete `apps/organiclever-be/src/OrganicLeverBe/Handlers/AuthHandler.fs`.
- [ ] Edit `apps/organiclever-be/src/OrganicLeverBe/Handlers/TestHandler.fs`:
  - [ ] Remove `deleteUsersOnly`.
  - [ ] Remove `resetDb` (no tables exist post-Option-A); delete the file if empty.
- [ ] Delete `apps/organiclever-be/src/OrganicLeverBe/Contracts/ContractWrappers.fs`
      (no remaining consumer); delete the now-empty `Contracts/` directory.
- [ ] Delete `apps/organiclever-be/src/OrganicLeverBe/Infrastructure/AppDbContext.fs`.
- [ ] Delete `apps/organiclever-be/src/OrganicLeverBe/Infrastructure/Repositories/RepositoryTypes.fs`.
- [ ] Delete `apps/organiclever-be/src/OrganicLeverBe/Infrastructure/Repositories/EfRepositories.fs`.
- [ ] Delete the now-empty `Infrastructure/Repositories/` and `Infrastructure/` directories.
- [ ] Edit `apps/organiclever-be/src/OrganicLeverBe/Program.fs`:
  - [ ] Drop `open` lines for `Auth.JwtMiddleware`, `Auth.GoogleAuthService`,
        `Infrastructure.AppDbContext`, `Infrastructure.Repositories.*`.
  - [ ] Drop the `subRoute "/auth"` block from `webApp`.
  - [ ] Drop the `/test/reset-db` and `/test/delete-users` lines.
  - [ ] Drop EF / Sqlite / Npgsql / DbUp wiring from `configureServices`.
  - [ ] Drop the DbUp / `EnsureCreated` block from `main`.
  - [ ] Drop `services.AddScoped<UserRepository>` and the refresh-token repo registration.
  - [ ] Drop the `GoogleAuthService` singleton registration.
  - [ ] Final `webApp` exposes only `GET /api/v1/health`.
- [ ] Edit `apps/organiclever-be/src/OrganicLeverBe/OrganicLeverBe.fsproj`:
  - [ ] Drop `<Compile Include="..." />` for: `Contracts/ContractWrappers.fs`,
        `Infrastructure/AppDbContext.fs`, `Infrastructure/Repositories/RepositoryTypes.fs`,
        `Infrastructure/Repositories/EfRepositories.fs`, `Auth/GoogleAuthService.fs`,
        `Auth/JwtService.fs`, `Auth/JwtMiddleware.fs`, `Handlers/AuthHandler.fs`.
  - [ ] Retain the `<Compile Include="Domain/Types.fs" />` entry — `DomainError` is kept
        by default (see tech-docs); it remains useful for future features.
  - [ ] Drop `<PackageReference />` for: `Microsoft.EntityFrameworkCore`,
        `Microsoft.EntityFrameworkCore.Sqlite`, `Npgsql.EntityFrameworkCore.PostgreSQL`,
        `EFCore.NamingConventions`, `System.IdentityModel.Tokens.Jwt`,
        `Google.Apis.Auth`, `dbup-core`, `dbup-postgresql`.
- [ ] Run `dotnet restore apps/organiclever-be/src/OrganicLeverBe/OrganicLeverBe.fsproj`.
- [ ] Run `nx run organiclever-be:typecheck`.
- [ ] Run `nx run organiclever-be:lint` (fantomas + fsharplint + analyzers).
- [ ] Commit: `refactor(organiclever-be): remove google auth and supporting infrastructure`.

## Phase 3 — Backend tests

- [ ] Delete `apps/organiclever-be/tests/OrganicLeverBe.Tests/Integration/Steps/AuthSteps.fs`.
- [ ] Delete `apps/organiclever-be/tests/OrganicLeverBe.Tests/InMemory/InMemoryRepositories.fs`.
- [ ] Delete the now-empty `InMemory/` directory.
- [ ] Edit `apps/organiclever-be/tests/OrganicLeverBe.Tests/DirectServices.fs`:
  - [ ] Remove `googleLogin`, `refresh`, `getMe`, `resolveAuth`.
  - [ ] If the file is empty after that, delete it.
- [ ] Edit `apps/organiclever-be/tests/OrganicLeverBe.Tests/State.fs`:
  - [ ] Reduce `StepState` to `{ HttpClient; Response; ResponseBody }`.
- [ ] Edit `apps/organiclever-be/tests/OrganicLeverBe.Tests/HttpTestFixture.fs`:
  - [ ] Remove the `GoogleAuthService` swap.
  - [ ] Remove SQLite + EF descriptor scrubbing (Option A).
  - [ ] Remove `APP_JWT_SECRET` env var setup.
  - [ ] Remove `APP_ENV` and `ENABLE_TEST_API` if no remaining caller depends on them.
  - [ ] Simplify `CreateClientWithDb()` to just `this.CreateClient()` (rename or inline).
- [ ] Edit `apps/organiclever-be/tests/OrganicLeverBe.Tests/Integration/FeatureRunner.fs`:
  - [ ] Drop `GoogleLoginFeatureTests`, `MeFeatureTests` types and their `buildScenarioData`
        calls.
- [ ] Edit `apps/organiclever-be/tests/OrganicLeverBe.Tests/Unit/UnitFeatureRunner.fs`:
  - [ ] Drop `UnitGoogleLoginFeatureTests`, `UnitMeFeatureTests` types.
- [ ] Edit `apps/organiclever-be/tests/OrganicLeverBe.Tests/OrganicLeverBe.Tests.fsproj`:
  - [ ] Drop `<Compile Include="Integration/Steps/AuthSteps.fs" />`.
  - [ ] Drop `<PackageReference />` for `Microsoft.IdentityModel.Tokens`,
        `System.IdentityModel.Tokens.Jwt`, `Microsoft.Data.Sqlite`.
- [ ] Edit `apps/organiclever-be/project.json`:
  - [ ] Drop `GoogleAuthService` from `--fileFilter` in `test:quick`.
  - [ ] Drop `Google` from `--assemblyFilter` in `test:quick`.
  - [ ] Update `--fileFilter` to drop `TestHandler` if the handler was deleted.
- [ ] Run `nx run organiclever-be:test:quick`.
- [ ] Verify AltCover line coverage is ≥90% on the surviving HealthHandler-only assembly.

### Manual BE API Verification (curl)

- [ ] Start the BE dev server in a separate terminal: `nx dev organiclever-be`.
- [ ] Verify the health endpoint responds:
      `curl -s http://localhost:8202/api/v1/health | jq .`
- [ ] Confirm the response is HTTP 200 with the expected health payload.
- [ ] Verify auth endpoints are gone (expect 404):
      `curl -s -o /dev/null -w "%{http_code}" http://localhost:8202/api/v1/auth/google`
- [ ] Stop the dev server.

- [ ] Commit: `test(organiclever-be): drop google auth integration + unit suites`.

## Phase 4 — Backend migration

- [ ] Delete `apps/organiclever-be/src/OrganicLeverBe/db/migrations/001-initial-schema.sql`.
- [ ] Delete the now-empty `db/migrations/` and `db/` directories.
- [ ] Confirm no other code embeds these scripts (`grep -r "ScriptsEmbeddedInAssembly"
apps/organiclever-be`).
- [ ] If `docker-compose.integration.yml` provisions PostgreSQL only for the dropped
      tables, simplify or delete it (decide in this step; default: leave compose alone for
      the next plan to revisit).
- [ ] Edit `apps/organiclever-be/Dockerfile.integration`:
  - [ ] On line 38, remove the `GOOGLE_CLIENT_ID` reference from the comment
        (e.g. change `# DATABASE_URL, APP_JWT_SECRET, APP_ENV, and GOOGLE_CLIENT_ID are supplied by docker-compose.`
        to `# DATABASE_URL, APP_JWT_SECRET, and APP_ENV are supplied by docker-compose.`).
- [ ] Run `nx run organiclever-be:test:quick` again.
- [ ] Commit: `chore(organiclever-be): drop initial-schema migration (no entities remain)`.

## Phase 5 — Frontend code

- [ ] Delete `apps/organiclever-web/src/services/auth-service.ts`.
- [ ] Delete `apps/organiclever-web/src/lib/auth/cookies.ts`.
- [ ] Delete the now-empty `apps/organiclever-web/src/lib/auth/` directory.
- [ ] If `apps/organiclever-web/src/lib/` is now empty, delete it.
- [ ] Confirm no remaining import of `auth-service` or `lib/auth/`:
      `grep -rln "auth-service\|lib/auth" apps/organiclever-web/src`.
- [ ] Edit (or delete) `apps/organiclever-web/.env.local`:
  - [ ] Remove the `NEXT_PUBLIC_GOOGLE_CLIENT_ID=...` line.
  - [ ] If the file is now empty, delete it.
- [ ] Edit `apps/organiclever-web/Dockerfile`:
  - [ ] Remove `ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID=""`.
  - [ ] Remove `ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=${NEXT_PUBLIC_GOOGLE_CLIENT_ID}`.
- [ ] Run `nx run organiclever-web:typecheck`.
- [ ] Run `nx run organiclever-web:test:quick`.
- [ ] Run `nx build organiclever-web`.
- [ ] Commit: `refactor(organiclever-web): remove google auth client + cookie helpers`.

## Phase 6 — End-to-end suites

- [ ] Delete `apps/organiclever-be-e2e/steps/google-login.steps.ts`.
- [ ] Delete `apps/organiclever-be-e2e/steps/me.steps.ts`.
- [ ] Delete `apps/organiclever-be-e2e/utils/token-store.ts`.
- [ ] Edit `apps/organiclever-be-e2e/steps/common.steps.ts`:
  - [ ] Remove the `clearAll` / token-store import + `Before` invocation.
- [ ] Edit `apps/organiclever-be-e2e/README.md`:
  - [ ] Drop the `authentication/google-login.feature` and `authentication/me.feature`
        rows from the "What This Tests" list.
  - [ ] Drop the `APP_ENV=test` Google bypass paragraph.
  - [ ] Drop `google-login.steps.ts`, `me.steps.ts`, `token-store.ts` from the project
        structure tree.
  - [ ] Drop the "Test token format" and "Before hook → token reset" sections.
- [ ] Edit `apps/organiclever-web-e2e/steps/accessibility.steps.ts`:
  - [ ] Replace the `images should have alt attributes` body with a flat `<img>` alt
        check (no `#google-signin-button` exclusion, no iframe carve-out).
  - [ ] Remove the GSI comment lines.
- [ ] Edit `apps/organiclever-web-e2e/steps/disabled-routes.steps.ts`:
  - [ ] Update the regex on line 22 to `/a visitor requests (\w+) (\/(?:login|profile))$/`
        (keep the "a visitor requests" prefix so the step matcher stays valid).
- [ ] Run `nx run organiclever-be-e2e:test:quick` (lint + typecheck).
- [ ] Run `nx run organiclever-web-e2e:test:quick` (lint + typecheck).
- [ ] Start the organiclever-web dev server in a separate terminal: `nx dev organiclever-web`.
- [ ] Confirm the app loads at http://localhost:3200.

### Manual UI Verification (Playwright MCP)

- [ ] Navigate to the landing page via `browser_navigate` to http://localhost:3200.
- [ ] Inspect the DOM via `browser_snapshot` — verify no auth-related elements render
      (no login button, no Google Sign-In iframe, no profile link).
- [ ] Check for JS errors via `browser_console_messages` — must be zero errors.
- [ ] Navigate to http://localhost:3200/profile via `browser_navigate` and confirm 404
      or redirect (not a broken page with a JS error).
- [ ] Take a screenshot via `browser_take_screenshot` for visual verification.
- [ ] Stop the dev server.

- [ ] Run `nx run organiclever-web-e2e:test:e2e` against a local dev server.
- [ ] Skip `organiclever-be-e2e:test:e2e` (full e2e is twice-daily cron, not pre-push) —
      spec generation must still work: `cd apps/organiclever-be-e2e && npx bddgen`.
- [ ] Commit: `test(organiclever-e2e): drop google login + me suites and gsi exclusions`.

## Phase 7 — C4 documentation

- [ ] Edit `specs/apps/organiclever/c4/context.md`:
  - [ ] Rewrite EU actor block (drop "Login via Google OAuth, View profile").
  - [ ] Rewrite SYSTEM block (drop "Google OAuth login, Protected user profile").
- [ ] Edit `specs/apps/organiclever/c4/container.md`:
  - [ ] Drop "Google OAuth login" and "Protected /profile route" from the FE box.
  - [ ] Drop "Google OAuth login", "Token refresh", "User profile (me)" from the BE box.
  - [ ] Update the surrounding paragraph that references those flows.
- [ ] Edit `specs/apps/organiclever/c4/component-be.md`:
  - [ ] Drop `AH`, `GAS`, `JM`, `JS`, `URP`, `RTRP` nodes.
  - [ ] Rewrite the routing-discipline paragraph (no public/protected split needed).
  - [ ] Rewrite the arrow diagram so only Health Handler remains.
  - [ ] Rewrite the scenario-mapping table — only `health/health-check` rows survive.
- [ ] Edit `specs/apps/organiclever/c4/component-fe.md`:
  - [ ] Drop `LP`, `PP`, `APRH`, `AS`, `AG`, `BC` (if BackendClient unused after) nodes.
  - [ ] Rewrite the public/protected paragraph.
  - [ ] Rewrite the arrow diagram for the local-first FE.
  - [ ] Rewrite the scenario-mapping table — auth rows go.
- [ ] Edit `specs/apps/organiclever/c4/README.md`:
  - [ ] Drop the `authentication/google-login`, `authentication/me`,
        `authentication/profile`, `authentication/route-protection` rows from both
        feature-mapping tables.
- [ ] Run `npx rhino-cli docs validate-mermaid specs/apps/organiclever/c4/` (or whatever
      the workspace-standard mermaid validator is at the time).
- [ ] Run `npm run lint:md`.
- [ ] Commit: `docs(organiclever-c4): strip auth components from container, context, and component diagrams`.

## Phase 8 — CI workflow

- [ ] Edit `.github/workflows/test-and-deploy-organiclever-web-development.yml`:
  - [ ] Delete line 98 (`GOOGLE_CLIENT_ID: ${{ secrets.GOOGLE_CLIENT_ID }}`).
  - [ ] Delete line 99 (`GOOGLE_CLIENT_SECRET: ${{ secrets.GOOGLE_CLIENT_SECRET }}`).
- [ ] Confirm no other workflow file under `.github/workflows/` references those
      secrets: `grep -rn "GOOGLE_CLIENT" .github/workflows`.
- [ ] Commit: `ci(organiclever-web): drop google client secret env passthrough`.

## Phase 9 — Final verification & archival

- [ ] Run the surface scan from `tech-docs.md` and confirm the only matches are
      `next/font/google` and unrelated text.
- [ ] Run `nx affected -t typecheck lint test:quick spec-coverage --base=origin/main`.
- [ ] Run `nx run organiclever-contracts:lint` and `:bundle` once more.
- [ ] Run `npm run lint:md`.
- [ ] Push the worktree branch to `origin`.
- [ ] Open a draft pull request against `wahidyankf/ose-public:main` titled
      `chore(organiclever): remove google auth surface`.
- [ ] In the PR description, list the GitHub repository secrets that the human operator
      may now safely delete: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
- [ ] Wait for CI to go green; promote the PR from draft to ready for review; merge.
- [ ] After merge, in `ose-public` main, confirm the surface scan still returns no
      unwanted matches.
- [ ] Move this plan folder from `plans/in-progress/` to `plans/done/`.
- [ ] Update `plans/in-progress/README.md` (drop the row).
- [ ] Update `plans/done/README.md` (add the row).

## Roll-back

If at any phase the plan must be aborted:

- The worktree branch contains every change as discrete commits — close the draft PR,
  delete the branch with `git -C ose-public push origin --delete worktree-organiclever-remove-google-auth`,
  and remove the worktree directory.
- `main` remains untouched; nothing reverts.
- Re-open the plan when ready.
