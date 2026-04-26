# PRD — Remove Google Auth from OrganicLever

## Personas

- **OrganicLever maintainer** — the person executing the worktree; deletes files, edits
  specs, and verifies each phase passes before moving on.
- **Future contributor** — the next developer who opens `organiclever-be` or
  `organiclever-web`; they should encounter only the live health-only surface, with no
  dead auth files or misleading C4 diagrams.
- **plan-execution-checker agent** — validates that every item in the delivery checklist
  has been completed and that all acceptance criteria in this document are satisfied.

## User Stories

As an OrganicLever maintainer, I want every Google OAuth file, test, and contract
reference removed from the codebase, so that the v0 surface is clean and no future
contributor is misled by dead auth infrastructure.

As an OrganicLever maintainer, I want the OpenAPI contract reduced to the `Health` tag
only, so that the codegen target never emits auth types into `generated-contracts/` again.

As a future contributor onboarding onto the BE, I want the F# project to compile and test
without any `Google.Apis.Auth`, JWT, or EF package references, so that I can understand
the codebase quickly without chasing dead imports.

As a future contributor onboarding onto the FE, I want `auth-service.ts` and
`lib/auth/cookies.ts` absent from the repository, so that I am not confused by client-side
auth helpers that are never called by any live page.

As a plan-execution-checker agent, I want all ten acceptance criteria in this document to
be verifiable by grep, Nx target commands, and file-system inspection, so that plan
completion can be validated without human interpretation.

## Removal inventory

Every file below is touched by this plan. Status column legend:
**delete** = file removed entirely; **edit** = file modified, still exists;
**rewrite** = effectively re-authored.

### `apps/organiclever-be/`

| Path                                                                | Action  | Notes                                                                                                                                    |
| ------------------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `src/OrganicLeverBe/Auth/GoogleAuthService.fs`                      | delete  | Google ID token verification + test-mode bypass                                                                                          |
| `src/OrganicLeverBe/Auth/JwtMiddleware.fs`                          | delete  | `requireAuth` HttpHandler                                                                                                                |
| `src/OrganicLeverBe/Auth/JwtService.fs`                             | delete  | `generateAccessToken`, `validateToken`, refresh hashing                                                                                  |
| `src/OrganicLeverBe/Auth/`                                          | delete  | empty after the three above are removed                                                                                                  |
| `src/OrganicLeverBe/Handlers/AuthHandler.fs`                        | delete  | `googleLogin`, `refresh`, `me` handlers                                                                                                  |
| `src/OrganicLeverBe/Handlers/TestHandler.fs`                        | edit    | drop `deleteUsersOnly`; keep `resetDb` only if still useful                                                                              |
| `src/OrganicLeverBe/Contracts/ContractWrappers.fs`                  | rewrite | drop `AuthGoogleRequest`, `RefreshRequest`; file may be deleted                                                                          |
| `src/OrganicLeverBe/Infrastructure/AppDbContext.fs`                 | rewrite | drop `UserEntity`, `RefreshTokenEntity`, `Users`, `RefreshTokens`                                                                        |
| `src/OrganicLeverBe/Infrastructure/Repositories/RepositoryTypes.fs` | delete  | only auth repos exist                                                                                                                    |
| `src/OrganicLeverBe/Infrastructure/Repositories/EfRepositories.fs`  | delete  | only auth repos exist                                                                                                                    |
| `src/OrganicLeverBe/Program.fs`                                     | edit    | drop `/auth/*` routes, repo registrations, `GoogleAuthService`                                                                           |
| `src/OrganicLeverBe/OrganicLeverBe.fsproj`                          | edit    | drop `Auth/*.fs`, `AuthHandler.fs`, repo files; drop `Google.Apis.Auth`, `System.IdentityModel.Tokens.Jwt`, EF packages no longer needed |
| `src/OrganicLeverBe/db/migrations/001-initial-schema.sql`           | rewrite | drop `users` and `refresh_tokens` table creations; keep file as no-op or delete if empty                                                 |
| `Dockerfile.integration`                                            | edit    | remove `GOOGLE_CLIENT_ID` reference from the comment on line 38                                                                          |

### `apps/organiclever-be/tests/OrganicLeverBe.Tests/`

| Path                               | Action | Notes                                                                                                                                         |
| ---------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `Integration/Steps/AuthSteps.fs`   | delete | every Given/When/Then targets google-login or me                                                                                              |
| `Integration/FeatureRunner.fs`     | edit   | drop `GoogleLoginFeatureTests`, `MeFeatureTests`                                                                                              |
| `Unit/UnitFeatureRunner.fs`        | edit   | drop `UnitGoogleLoginFeatureTests`, `UnitMeFeatureTests`                                                                                      |
| `HttpTestFixture.fs`               | edit   | drop `GoogleAuthService` swap; drop JWT secret env var; keep SQLite + EF wiring only if other tests require it                                |
| `InMemory/InMemoryRepositories.fs` | delete | only contains `User` and `RefreshToken` repos                                                                                                 |
| `DirectServices.fs`                | edit   | drop `googleLogin`, `refresh`, `getMe`, `resolveAuth`; keep `health` only if any test still uses it; otherwise delete file                    |
| `State.fs`                         | edit   | drop `AccessToken`, `RefreshToken`, `GoogleIdToken`, `UserId`; reduce to just `HttpClient` + `Response` + `ResponseBody`                      |
| `OrganicLeverBe.Tests.fsproj`      | edit   | drop `AuthSteps.fs`; drop `Microsoft.IdentityModel.Tokens` + `System.IdentityModel.Tokens.Jwt` package refs                                   |
| `project.json`                     | edit   | drop `GoogleAuthService` from AltCover `--fileFilter`; drop `Google` from `--assemblyFilter`; coverage threshold may drop too — see tech-docs |

### `apps/organiclever-web/`

| Path                             | Action | Notes                                                    |
| -------------------------------- | ------ | -------------------------------------------------------- |
| `src/services/auth-service.ts`   | delete | Effect-TS AuthService (googleLogin/refresh/getProfile)   |
| `src/lib/auth/cookies.ts`        | delete | `setAuthCookies`, `clearAuthCookies`                     |
| `src/lib/auth/`                  | delete | empty after `cookies.ts` is removed                      |
| `.env.local`                     | edit   | remove `NEXT_PUBLIC_GOOGLE_CLIENT_ID` line               |
| `Dockerfile`                     | edit   | remove `ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID` and `ENV` line |
| `src/services/backend-client.ts` | review | confirm no auth header injection survives                |

### `apps/organiclever-web-e2e/`

| Path                             | Action | Notes                                                                                            |
| -------------------------------- | ------ | ------------------------------------------------------------------------------------------------ |
| `steps/accessibility.steps.ts`   | edit   | drop `#google-signin-button` selector exclusion; rewrite `images` query without GSI escape hatch |
| `steps/disabled-routes.steps.ts` | edit   | shrink the route regex to whatever rows survive in the spec                                      |

### `apps/organiclever-be-e2e/`

| Path                          | Action | Notes                                                                                     |
| ----------------------------- | ------ | ----------------------------------------------------------------------------------------- |
| `steps/google-login.steps.ts` | delete | every Given/When/Then targets google login or refresh                                     |
| `steps/me.steps.ts`           | delete | every Given/When/Then targets `/auth/me`                                                  |
| `utils/token-store.ts`        | delete | only token-aware steps consume this                                                       |
| `steps/common.steps.ts`       | edit   | drop the `clearAll` token-store call from `Before`                                        |
| `README.md`                   | edit   | strip auth feature listing, test-token format section, `auth tests also require...` blurb |

### `specs/apps/organiclever/contracts/`

| Path                                    | Action     | Notes                                                                                                                            |
| --------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `paths/auth.yaml`                       | delete     | `/auth/google`, `/auth/refresh`, `/auth/me`                                                                                      |
| `schemas/auth.yaml`                     | delete     | `AuthGoogleRequest`, `AuthTokenResponse`, `RefreshRequest`                                                                       |
| `schemas/user.yaml`                     | delete     | `UserProfile`                                                                                                                    |
| `examples/auth-login.yaml`              | delete     | example for `POST /auth/google`                                                                                                  |
| `openapi.yaml`                          | edit       | remove `Authentication` tag, `bearerAuth` security scheme, all auth `$ref`s, all `/api/v1/auth/*` paths                          |
| `README.md`                             | edit       | update file-structure tree (drop `auth.yaml`, `user.yaml`, `auth-login.yaml`), drop "POST /auth/\*" line in `paths/` description |
| `generated/openapi-bundled.{json,yaml}` | regenerate | gitignored output, regenerated by `nx run organiclever-contracts:bundle`                                                         |

### `specs/apps/organiclever/be/gherkin/`

| Path                                  | Action | Notes                                                                                           |
| ------------------------------------- | ------ | ----------------------------------------------------------------------------------------------- |
| `authentication/google-login.feature` | delete | 11 scenarios go away                                                                            |
| `authentication/me.feature`           | delete | 6 scenarios go away                                                                             |
| `authentication/`                     | delete | empty after the two above are removed                                                           |
| `README.md`                           | edit   | drop the two `authentication` table rows; counts now read "1 file, 2 scenarios across 1 domain" |

### `specs/apps/organiclever/fe/gherkin/`

| Path                              | Action | Notes                                                                                                                                                                                                                               |
| --------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `routing/disabled-routes.feature` | edit   | drop the three auth rows (`POST /api/auth/google`, `GET /api/auth/refresh`, `GET /api/auth/me`); keep `/login` and `/profile` only if they remain meaningful as guards in v0 — otherwise remove the whole feature and its step file |

### `specs/apps/organiclever/c4/`

| Path              | Action | Notes                                                                                                                                                                                                                                                    |
| ----------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `context.md`      | edit   | rewrite EU actor block (drop "Login via Google OAuth, View profile"); update SYSTEM block                                                                                                                                                                |
| `container.md`    | edit   | drop "Google OAuth login" / "Protected /profile route" from FE box; drop "Google OAuth login / Token refresh / User profile (me)" from BE box; drop the auth-related text in the surrounding paragraph                                                   |
| `component-be.md` | edit   | drop `AH` (Auth Handler), `GAS` (GoogleAuthService), `JM` (JWT Middleware), `JS` (JwtService), `URP` (User Repository), `RTRP` (Refresh Token Repository); rewrite the routing-paragraph + arrow diagram + scenario-mapping table to reflect health-only |
| `component-fe.md` | edit   | drop `LP` (Login Page), `PP` (Profile Page), `APRH` (Auth Proxy Routes), `AS` (AuthService), `AG` (Auth Guard), `BC` (BackendClient if unused after); rewrite arrows + mapping table                                                                     |
| `README.md`       | edit   | rewrite the BE + FE feature-mapping tables (drop `authentication/` rows entirely)                                                                                                                                                                        |

### `.github/workflows/`

| Path                                               | Action | Notes                                                                                                                      |
| -------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------- |
| `test-and-deploy-organiclever-web-development.yml` | edit   | drop the `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` env entries (lines 98–99); leave the rest of the workflow untouched |

## Product Scope

**In scope** — everything in the Removal inventory above, plus:

- All Google-auth Gherkin features under `specs/apps/organiclever/be/gherkin/authentication/`.
- All auth-related rows in `specs/apps/organiclever/fe/gherkin/routing/disabled-routes.feature`.
- All auth-related contract files under `specs/apps/organiclever/contracts/`.
- All C4 diagram auth nodes and labels in `specs/apps/organiclever/c4/`.
- The `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` env passthrough in the CI workflow.

**Out of scope**:

- `next/font/google` import in `app/layout.tsx` — Google Fonts, not auth.
- Actual deletion of GitHub repository secrets `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
  (manual operator step, noted in PR description).
- Cookie infrastructure for a future auth system — tracked in a separate future plan.
- Any file outside `ose-public/`.

## Product Risks

| Risk                                                                                            | Impact                              | Mitigation                                                                                                |
| ----------------------------------------------------------------------------------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Incomplete removal — a Google auth reference is missed, leaving a dead import or broken test    | Build failure caught at merge       | Per-phase `nx run organiclever-be:typecheck` and `test:quick` gates prevent broken refs from accumulating |
| Removal of wrong file — executor deletes a file that is not auth-only (e.g., `Domain/Types.fs`) | Compile error; missed by phase gate | Delivery checklist explicitly keeps `Domain/Types.fs`; Phase 2 typecheck gate catches it immediately      |
| `disabled-routes.feature` step regex broken post-edit                                           | E2E test failure                    | Finding 7 fix corrects the regex instruction to preserve the "a visitor requests" prefix                  |
| Post-removal `organiclever-web-e2e:test:e2e` fails because dev server was not started           | Test connection refused             | Phase 6 now includes explicit dev-server start step before the e2e run                                    |

## Acceptance criteria (Gherkin)

```gherkin
Feature: Google auth surface is fully removed from organiclever

  Scenario: Source code contains no runtime Google auth references
    Given the worktree has merged into main
    When I grep "google\|GOOGLE\|oauth\|OAuth" under apps/organiclever-be/src,
      apps/organiclever-be/tests, apps/organiclever-be-e2e, apps/organiclever-web/src,
      and apps/organiclever-web-e2e excluding bin/ obj/ node_modules/ .next/ generated-contracts/
    Then the only matches are in next/font/google imports

  Scenario: OpenAPI contract is auth-free
    Given the worktree has merged into main
    When I run `nx run organiclever-contracts:bundle`
    Then the generated openapi-bundled.yaml has no path beginning with /api/v1/auth
    And the Authentication tag is absent
    And the bearerAuth security scheme is absent
    And no schema named AuthGoogleRequest, AuthTokenResponse, RefreshRequest, or UserProfile exists

  Scenario: Gherkin specs reflect the health-only contract
    Given the worktree has merged into main
    When I list specs/apps/organiclever/be/gherkin
    Then the authentication/ directory does not exist
    And specs/apps/organiclever/be/gherkin/README.md lists exactly 1 feature file with 2 scenarios

  Scenario: Backend builds and tests pass without auth
    Given the worktree has merged into main
    When I run `nx run organiclever-be:test:quick`
    Then the build succeeds
    And the AltCover line-coverage threshold (per project.json) is met
    And no test class names contain GoogleLogin or Me

  Scenario: Frontend builds without the Google client id
    Given the worktree has merged into main
    And NEXT_PUBLIC_GOOGLE_CLIENT_ID is unset
    When I run `nx build organiclever-web`
    Then the build succeeds with no warning about a missing env var

  Scenario: BE e2e suite no longer expects auth endpoints
    Given the worktree has merged into main
    When I run `nx run organiclever-be-e2e:test:e2e`
    Then no spec file references /api/v1/auth
    And test-token-store helpers are absent

  Scenario: Disabled-routes spec stops asserting on auth paths
    Given the worktree has merged into main
    When I read specs/apps/organiclever/fe/gherkin/routing/disabled-routes.feature
    Then no example row mentions /api/auth/google, /api/auth/refresh, or /api/auth/me

  Scenario: C4 diagrams render auth-free
    Given the worktree has merged into main
    When I render the C4 diagrams (Mermaid)
    Then context.md, container.md, component-be.md, component-fe.md, and README.md
    contain zero Google / OAuth / login / profile node labels

  Scenario: CI workflow no longer reads Google secrets
    Given the worktree has merged into main
    When I read .github/workflows/test-and-deploy-organiclever-web-development.yml
    Then no env key includes secrets.GOOGLE_CLIENT_ID or secrets.GOOGLE_CLIENT_SECRET

  Scenario: Repository quality gate is green
    Given the worktree has merged into main
    When I run `nx affected -t typecheck lint test:quick spec-coverage` from main
    Then every affected target passes
```
