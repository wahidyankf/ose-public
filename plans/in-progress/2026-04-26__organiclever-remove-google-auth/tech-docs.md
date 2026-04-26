# Tech Docs — Remove Google Auth from OrganicLever

## Architectural shape after the cut

The post-removal `organiclever-be` collapses to a single concern: **health**.

```
organiclever-be
├── src/OrganicLeverBe/
│   ├── Domain/Types.fs            ← keep (DomainError union — still useful)
│   ├── Handlers/HealthHandler.fs  ← keep
│   ├── Program.fs                 ← edit: only health route + health-only services
│   └── OrganicLeverBe.fsproj      ← edit: prune Auth/* + EF + JWT + Google.Apis
└── tests/OrganicLeverBe.Tests/
    ├── Integration/Steps/HealthSteps.fs   ← keep
    ├── Integration/Steps/CommonSteps.fs   ← keep
    ├── Integration/FeatureRunner.fs       ← edit: only HealthFeatureTests survives
    ├── Unit/UnitFeatureRunner.fs          ← edit: only UnitHealthFeatureTests survives
    ├── HttpTestFixture.fs                 ← simplify: no auth swap, may drop SQLite
    └── State.fs                           ← simplify to HttpClient + Response
```

**Open question (decide in Phase 2)**: do EF Core / `AppDbContext` / DbUp survive at all
in v0? The only entities they ever held were `users` and `refresh_tokens`. With both
gone, the BE becomes stateless. Options:

- **Option A (preferred): drop EF + DbUp + Sqlite + Npgsql + the entire `Infrastructure/`
  tree.** Smallest surface; fastest path to a clean v0. Re-add per-feature when actual
  storage lands.
- **Option B: keep `AppDbContext` as an empty shell** so the next feature has a hook.
  Costs: dead-code warnings, fsharp-analyzers complaints, doctor noise, dragged-in
  packages.

Default to **Option A**. If a follow-up plan immediately after this needs persistence,
re-add EF then. The plan's delivery checklist assumes Option A; switching to B is a
reversible decision documented at the relevant checkbox.

The post-removal `organiclever-web` keeps the entire local-first storyboard (per the
existing `2026-04-25__organiclever-web-app` plan). The only deletions on the FE side are
two files (`auth-service.ts`, `lib/auth/cookies.ts`), the env var, and the Dockerfile
ARG/ENV — there is no v0 caller for any of them.

## Ordering rationale

The phases in `delivery.md` are ordered to avoid intermediate red builds:

1. **Specs first.** Removing Gherkin and contract files first means the Nx
   `codegen` target stops generating auth types into `generated-contracts/`. If we
   removed the F# code first, codegen would still emit `AuthGoogleRequest`, the BE
   would still typecheck against it, and we would chase ghost references for an hour.

2. **BE code second** consumes the now-thinner contract.

3. **BE tests third** — they reference both code and specs, so cannot move ahead of
   either.

4. **BE migration fourth** — pure DDL, no compile dependency, can land any time after
   test code is gone (so test fixtures aren't asserting the dropped tables exist).

5. **FE code fifth** — independent of BE; could move earlier, but bundling with FE e2e
   keeps the diff readable.

6. **e2e suites sixth** — depend on the FE `disabled-routes` feature edits and the
   already-dead BE auth endpoints.

7. **C4 docs seventh** — these reference everything, so write them after the code is
   already shaped.

8. **CI workflow last** — single line edit, lowest risk; doing it last avoids
   triggering deploy-time surprises while iterating.

## File-level gotchas

### `Program.fs`

Current `webApp` references both `Handlers.AuthHandler.googleLogin/refresh/me` and
`requireAuth` (from `JwtMiddleware`). All three are removed. The `subRoute "/auth"` block
goes entirely. The `/test/*` test endpoints (`resetDb`, `deleteUsersOnly`) need a
decision:

- `deleteUsersOnly` exists only because the auth me-feature needs it. Delete with auth.
- `resetDb` deletes from `users` and `refresh_tokens`. Under Option A those tables
  don't exist → delete the handler. Under Option B → rewrite as a no-op.

`configureServices` currently registers `UserRepository`, `RefreshTokenRepository`,
`GoogleAuthService`, and `AppDbContext`. Under Option A, only `services.AddGiraffe()`
and `services.AddCors()` remain.

Top of file: `open OrganicLeverBe.Auth.JwtMiddleware` and
`open OrganicLeverBe.Auth.GoogleAuthService` go.

### `OrganicLeverBe.fsproj`

Drop these `<Compile Include="..." />` entries:

- `Contracts/ContractWrappers.fs` (under Option A — no other consumers)
- `Infrastructure/AppDbContext.fs` (Option A)
- `Infrastructure/Repositories/RepositoryTypes.fs` (Option A)
- `Infrastructure/Repositories/EfRepositories.fs` (Option A)
- `Auth/GoogleAuthService.fs`
- `Auth/JwtService.fs`
- `Auth/JwtMiddleware.fs`
- `Handlers/AuthHandler.fs`

Drop these `<PackageReference />` entries (Option A):

- `Microsoft.EntityFrameworkCore`, `.Sqlite`, `Npgsql.EntityFrameworkCore.PostgreSQL`,
  `EFCore.NamingConventions`
- `System.IdentityModel.Tokens.Jwt`
- `Google.Apis.Auth`
- `dbup-core`, `dbup-postgresql`

Keep `Giraffe`, `FSharp.SystemTextJson`, the analyzers, `FSharp.Analyzers.Build`.

### `OrganicLeverBe.Tests.fsproj`

Drop `<Compile Include="Integration/Steps/AuthSteps.fs" />`. Drop these packages:

- `Microsoft.IdentityModel.Tokens`
- `System.IdentityModel.Tokens.Jwt`
- `Microsoft.Data.Sqlite` (Option A — no DbContext to in-memory)

Keep `Microsoft.NET.Test.Sdk`, `TickSpec`, `xunit`, `xunit.runner.visualstudio`,
`Microsoft.AspNetCore.Mvc.Testing`, `coverlet.collector`. The `<Target>` that copies
Gherkin specs from `specs/apps/organiclever/be/gherkin/**/*.feature` survives unchanged
— it just copies fewer files.

### `HttpTestFixture.fs`

Today the fixture (a) opens an in-memory SQLite, (b) sets `APP_ENV=test`,
(c) sets `ENABLE_TEST_API=true`, (d) sets `APP_JWT_SECRET`, (e) replaces the EF
provider, and (f) swaps `GoogleAuthService` to a forced-test instance.

Under Option A all of (a), (d), (e), (f) go. (b) and (c) become irrelevant unless
something else depends on `APP_ENV=test` — currently nothing does once auth is gone.
Likely simplification: delete the file and use the default `WebApplicationFactory`
inline in the runners, or keep an empty subclass. Either way, the unit/integration
runners' `ScenarioServiceProvider` now only needs to construct an `HttpClient` from
the factory.

### `project.json` — coverage filter

Current `--fileFilter=TestHandler|GoogleAuthService` exists because those files have
intentionally-untestable branches (test-only handlers, real Google API call). After
removal, `GoogleAuthService` is gone; keep `TestHandler` only if its handler survives.
The `--assemblyFilter` `Google` clause is redundant after Google.Apis.Auth is removed
from the build output.

The coverage threshold (currently `90`) is set on `rhino-cli test-coverage validate`.
After removal the `organiclever-be` codebase shrinks dramatically — the absolute number
of covered lines drops, but the **percentage** should stay ≥90 because the surviving
HealthHandler is fully exercised. Revisit if the post-removal `dotnet test` reports a
sub-90 number; do not preemptively lower the threshold.

### `001-initial-schema.sql`

Under Option A: delete the file outright. DbUp does not run in Option A
(no `ScriptsEmbeddedInAssembly` consumer). The migrations directory becomes empty and
is removed.

Under Option B: rewrite the file as `-- intentionally empty` and keep DbUp running.

### Contract bundle regeneration

`generated/openapi-bundled.{yaml,json}` is gitignored. After editing the YAML sources:

```bash
nx run organiclever-contracts:lint    # bundles + spectral lints
nx run organiclever-contracts:bundle  # writes the regenerated artefact
```

Both apps' `codegen` targets depend on `organiclever-contracts:bundle` and on the
bundled YAML as an input. Running `nx affected -t codegen` will pick up the change.
The frontend's `src/generated-contracts/` regenerates — verify nothing under
`apps/organiclever-web/src/generated-contracts/` references `auth` after the run.

### `disabled-routes.feature` — tactical decision

Current rows assert that `/login`, `/profile`, `POST /api/auth/google`,
`GET /api/auth/refresh`, `GET /api/auth/me` return 404. With auth gone, three of those
were never going to exist in v0 anyway, but keeping them in the spec is harmless: the
spec is a guard against accidental re-introduction.

**Choice**: drop only the three `/api/auth/*` rows. Keep `/login` and `/profile` as
guards against accidentally re-introducing Google auth UI. Document the choice in the
feature file's comment header.

If the v0 plan later removes `/login` and `/profile` from the guard list, that is a
follow-up edit, not part of this plan.

### `accessibility.steps.ts` — GSI image escape hatch

The current `images should have alt attributes` step excludes
`#google-signin-button`-rooted images. With GSI gone, the exclusion is dead code.
Replace the implementation with a flat "every `<img>` has an `alt` attribute" check.
The accompanying `iframe` comment goes too.

### `.env.local`

The single line `NEXT_PUBLIC_GOOGLE_CLIENT_ID=...` is the entire file today. Decision:
delete the file rather than leave an empty `.env.local`. (`.env.example` if present
in the same directory should also lose any auth lines — none seem to exist, but verify
during Phase 5.)

### `Dockerfile`

Web image: drop `ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID=""` and the matching `ENV` line.
BE image (`Dockerfile.integration`): only contains a comment about
`GOOGLE_CLIENT_ID` — delete the comment line.

### CI workflow

`test-and-deploy-organiclever-web-development.yml` lines 98–99 read
`GOOGLE_CLIENT_ID: ${{ secrets.GOOGLE_CLIENT_ID }}` and the `_SECRET` counterpart.
Delete those two lines. No other workflow keys depend on them.

## Verification toolbox

Use these commands repeatedly throughout the worktree:

```bash
# Surface scan (must return only next/font/google + unrelated text)
grep -rIn "google\|GOOGLE\|oauth\|OAuth" \
  apps/organiclever-be/src \
  apps/organiclever-be/tests \
  apps/organiclever-be-e2e \
  apps/organiclever-web/src \
  apps/organiclever-web-e2e \
  specs/apps/organiclever \
  --exclude-dir=node_modules --exclude-dir=bin --exclude-dir=obj \
  --exclude-dir=.next --exclude-dir=generated-contracts

# Bundled OpenAPI sanity
nx run organiclever-contracts:lint
nx run organiclever-contracts:bundle
grep -i "auth\|google" specs/apps/organiclever/contracts/generated/openapi-bundled.yaml

# Build + test
nx affected -t typecheck
nx affected -t lint
nx affected -t test:quick
nx affected -t spec-coverage

# Spec coverage explicitly
nx run organiclever-be:spec-coverage 2>/dev/null || true
```

## Risk register

| Risk                                                         | Likelihood | Mitigation                                                                |
| ------------------------------------------------------------ | :--------: | ------------------------------------------------------------------------- |
| Coverage threshold breaks because surviving line count drops |   medium   | Re-run `test:quick` after every BE phase; only adjust threshold if forced |
| Hidden caller of `auth-service.ts` in v0 plan code           |    low     | Grep `from "[./]*auth-service"` and `AuthService` before deleting         |
| F# analyzers complain about removed packages                 |    low     | Run `nx run organiclever-be:lint` after fsproj edits                      |
| `disabled-routes` feature breaks if all rows removed         |    low     | Decision documented above: keep `/login` and `/profile`                   |
| Vercel build picks up missing env var                        |    low     | Already optional; the var is `NEXT_PUBLIC_*`, not required at build time  |
| Stale `bin/` / `obj/` artefacts mislead grep                 |   medium   | Always exclude those dirs; run `dotnet clean` before final coverage scan  |
