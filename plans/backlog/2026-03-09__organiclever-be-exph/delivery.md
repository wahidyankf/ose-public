# Delivery Checklist: organiclever-be-exph

Execute phases in order. Each phase produces a working, committable state.

---

## Phase 0: Prerequisites

- [ ] Read `tech-docs.md` — "Why We Fork" section confirms **elixir-gherkin** and
      **elixir-cabbage** as the chosen BDD stack
- [ ] Verify `organiclever-be-e2e` Playwright config reads `BASE_URL` from env; patch if not
- [ ] Confirm Elixir 1.17 / OTP 27 available in CI (`erlef/setup-beam@v1`)
- [ ] Confirm `rhino-cli test-coverage validate` supports LCOV (it does — already used by
      `organiclever-web`)
- [ ] Clone `cabbage-ex/gherkin` and `cabbage-ex/cabbage` locally to inspect source before
      forking — verify no surprises (no GPL dependencies, no binary blobs)

---

## Phase 1: Fork Vendored Libraries

**Commits**:

- `feat(libs): add elixir-gherkin — vendored fork of cabbage-ex/gherkin 2.0.0`
- `feat(libs): add elixir-cabbage — vendored fork of cabbage-ex/cabbage 0.4.1`

### elixir-gherkin

- [ ] Copy source of `cabbage-ex/gherkin` tag `2.0.0` into `libs/elixir-gherkin/`
      (preserve directory structure: `lib/`, `test/`, `mix.exs`, `mix.lock`, `LICENSE`,
      `CHANGELOG.md`)
- [ ] In `mix.exs`: rename `app: :gherkin` → `app: :elixir_gherkin`; bump version to
      `2.0.0-ose.1` to distinguish from upstream
- [ ] In `mix.exs` `project/0`: add `test_coverage: [tool: ExCoveralls]` and
      `preferred_cli_env: [coveralls: :test, "coveralls.lcov": :test]`
- [ ] In `mix.exs` deps: add `{:excoveralls, "~> 0.18", only: :test}`
- [ ] Add `project.json` with targets from `tech-docs.md` (Vendored Library Architecture)
- [ ] Add `.credo.exs` (strict mode)
- [ ] Add `.formatter.exs`
- [ ] Add `.dialyzer_ignore.exs` (empty initially)
- [ ] Add `FORK_NOTES.md` using the template from `tech-docs.md`
- [ ] Run `mix deps.get` inside `libs/elixir-gherkin/`
- [ ] Verify `nx run elixir-gherkin:test:quick` passes (existing upstream tests pass as-is)
- [ ] Verify `nx run elixir-gherkin:typecheck` passes (initial PLT build)
- [ ] Commit

### elixir-cabbage

- [ ] Copy source of `cabbage-ex/cabbage` tag `0.4.1` into `libs/elixir-cabbage/`
      (preserve: `lib/`, `test/`, `mix.exs`, `mix.lock`, `LICENSE`, `CHANGELOG.md`)
- [ ] In `mix.exs`: rename `app: :cabbage` → `app: :elixir_cabbage`; bump version to
      `0.4.1-ose.1`
- [ ] In `mix.exs` deps: replace `{:gherkin, "~> 2.0"}` with
      `{:elixir_gherkin, path: "../../libs/elixir-gherkin"}`; add
      `{:excoveralls, "~> 0.18", only: :test}`
- [ ] In `mix.exs` `project/0`: add `test_coverage: [tool: ExCoveralls]` and
      `preferred_cli_env: [coveralls: :test, "coveralls.lcov": :test]`
- [ ] Add `project.json` with targets + `"implicitDependencies": ["elixir-gherkin"]`
- [ ] Add `.credo.exs` (strict mode)
- [ ] Add `.formatter.exs`
- [ ] Add `.dialyzer_ignore.exs` (empty initially; upstream may have pre-existing Dialyzer
      suppressions — evaluate and document each one)
- [ ] Add `FORK_NOTES.md`
- [ ] Run `mix deps.get` inside `libs/elixir-cabbage/`
- [ ] Verify `nx run elixir-cabbage:test:quick` passes
- [ ] Verify `nx run elixir-cabbage:typecheck` passes
- [ ] Commit

> **Note**: If Credo or Dialyzer flags pre-existing upstream issues, add suppressions to
> `.dialyzer_ignore.exs` / `.credo.exs` with a comment linking to the upstream issue. Fix
> them as a follow-up PR, not as part of the fork commit (keeps the diff reviewable).

---

## Phase 2: Project Scaffold

**Commit**: `feat(organiclever-be-exph): scaffold Phoenix project`

- [ ] Run `mix phx.new organiclever_be_exph --no-live --no-assets --no-dashboard --no-mailer`
      inside `apps/`; rename folder to `organiclever-be-exph`
- [ ] Add `project.json` with all targets from `tech-docs.md` (Nx Targets section),
      including `"implicitDependencies": ["elixir-gherkin", "elixir-cabbage"]`
- [ ] Configure `mix.exs` with all deps:
  - Production: Phoenix, Ecto, Guardian, Bcrypt, Jason, Bandit (not Plug.Cowboy — Phoenix 1.7+)
  - Test only: `{:elixir_gherkin, path: "../../libs/elixir-gherkin"}`,
    `{:elixir_cabbage, path: "../../libs/elixir-cabbage"}`, `{:mox, "~> 1.1"}`, ExCoveralls
  - Dev/test: Credo, Dialyxir
- [ ] In `mix.exs` `project/0`: add `test_coverage: [tool: ExCoveralls]` and
      `preferred_cli_env: [coveralls: :test, "coveralls.lcov": :test]` — required so
      `mix coveralls.lcov` is a valid task
- [ ] Add `.credo.exs` (strict mode)
- [ ] Add `.formatter.exs`
- [ ] Add `.dialyzer_ignore.exs` (empty initially)
- [ ] Configure `config/test.exs` with Ecto sandbox
- [ ] Configure `config/runtime.exs` to read `DATABASE_URL`, `APP_JWT_SECRET`, `PORT`
- [ ] Add `README.md` covering local dev, Docker, env vars
- [ ] Run `mix deps.get` and confirm compilation with zero warnings
- [ ] Verify `nx run organiclever-be-exph:lint` passes
- [ ] Verify `nx run organiclever-be-exph:typecheck` passes (initial PLT generation)

---

## Phase 3: Database, User Schema, and Mox Behaviour

**Commit**: `feat(organiclever-be-exph): add User schema, Accounts context, and Mox behaviour`

- [ ] Create migration: `create_users` table (`id`, `username unique not null`, `password_hash`,
      `inserted_at`, `updated_at`)
- [ ] Define `User` Ecto schema with `username` and `password_hash` fields
- [ ] Define `OrganicleverBeExph.Accounts.Behaviour` — the `@callback` interface for the
      Accounts context (used by controllers and mocked in integration tests)
- [ ] Implement `OrganicleverBeExph.Accounts` with `@behaviour Accounts.Behaviour`:
  - `register_user/1` — validates, hashes password with `bcrypt_elixir`, inserts
  - `authenticate_user/2` — lookup by username, verify hash
- [ ] Add changeset validations for username (min 3, `^[a-zA-Z0-9_]+$`) and
      password (min 8, uppercase, special char)
- [ ] Wire implementation via `config/config.exs`:
      `config :organiclever_be_exph, :accounts_impl, OrganicleverBeExph.Accounts`
- [ ] Wire mock via `config/test.exs`:
      `config :organiclever_be_exph, :accounts_impl, OrganicleverBeExph.MockAccounts`
- [ ] Define `OrganicleverBeExph.MockAccounts` in `test/support/mocks.ex` using
      `Mox.defmock/2`
- [ ] Write unit tests for changeset validations (tag `@tag :unit`)
- [ ] Verify `mix test --only unit` passes
- [ ] Verify `mix credo --strict` passes

---

## Phase 4: Health Endpoint

**Commit**: `feat(organiclever-be-exph): add /health endpoint`

- [ ] Create `HealthController` returning `{"status": "UP"}` with status 200
- [ ] Add route `GET /health` (public, outside the JWT pipeline scope)
- [ ] Write Cabbage integration test consuming
      `specs/apps/organiclever-be/health/health-check.feature` (2 scenarios)
- [ ] Implement step definitions in `test/integration/steps/health_steps.exs`
- [ ] Tag test module with `@moduletag :integration`
- [ ] Verify `mix test --only integration` passes

---

## Phase 5: Auth — Register & Login

**Commit**: `feat(organiclever-be-exph): add register and login endpoints`

- [ ] Configure Guardian in `lib/organiclever_be_exph/auth/guardian.ex`
- [ ] Create `AuthController` with:
  - `POST /api/v1/auth/register` → 201 `{"id": ..., "username": ...}` (no password field)
  - `POST /api/v1/auth/login` → 200 `{"token": "...", "type": "Bearer"}` or 401/400
- [ ] Add `Guardian.Plug.Pipeline` plug for JWT verification
- [ ] Add routes: public scope for `/api/v1/auth/*`
- [ ] Write Cabbage integration tests for:
  - `specs/apps/organiclever-be/auth/register.feature` (9 scenarios)
  - `specs/apps/organiclever-be/auth/login.feature` (5 scenarios)
- [ ] Implement step definitions in `auth_register_steps.exs` and `auth_login_steps.exs`
- [ ] Verify all 14 scenarios pass: `mix test --only integration`

---

## Phase 6: Hello & JWT Protection

**Commit**: `feat(organiclever-be-exph): add /api/v1/hello with JWT protection`

- [ ] Create `HelloController` returning `{"message": "world!"}` (JSON, 200)
- [ ] Add protected scope in router using `Guardian.Plug.Pipeline`
- [ ] Add CORS headers for `http://localhost:3200` (and `http://localhost:3000`)
- [ ] Write Cabbage integration tests for:
  - `specs/apps/organiclever-be/hello/hello-endpoint.feature` (2 scenarios)
  - `specs/apps/organiclever-be/auth/jwt-protection.feature` (6 scenarios)
- [ ] Implement step definitions in `hello_steps.exs` and `jwt_protection_steps.exs`
- [ ] Verify all 24 scenarios pass: `mix test --only integration`
- [ ] Run full test suite with coverage: `mix test --cover`
- [ ] Verify coverage ≥ 90% via `rhino-cli test-coverage validate`
- [ ] Verify `mix credo --strict` and `mix dialyzer` pass

---

## Phase 7: Infra — Docker Compose

**Commit**: `feat(infra): add organiclever-exph docker-compose dev environment`

- [ ] Create `infra/dev/organiclever-exph/Dockerfile.be.dev` (Elixir 1.17 OTP 27 Alpine)
- [ ] Create `infra/dev/organiclever-exph/docker-compose.yml`:
  - `organiclever-db` service (PostgreSQL 17, port 5432) with healthcheck and named volume
    `organiclever-exph-db-data`
  - `organiclever-be-exph` service (port 8201):
    - `depends_on: organiclever-db: condition: service_healthy`
    - Volume: `../../../apps/organiclever-be-exph:/workspace:rw`
    - Volume: `../../../libs/elixir-gherkin:/libs/elixir-gherkin:ro` — Mix path dep
    - Volume: `../../../libs/elixir-cabbage:/libs/elixir-cabbage:ro` — Mix path dep
    - Volume: `../../../specs/apps/organiclever-be:/specs/apps/organiclever-be:ro` — feature files
    - Healthcheck: `wget --spider http://localhost:8201/health`
    - `restart: unless-stopped`
  - Named volumes block: `organiclever-exph-db-data:`
  - Network: `organiclever-network`
- [ ] Create `infra/dev/organiclever-exph/docker-compose.e2e.yml`
- [ ] Create `infra/dev/organiclever-exph/README.md` with startup instructions
- [ ] Manual test: `docker compose ... up --build` → container reaches healthy state
- [ ] Manual test: `curl http://localhost:8201/health` → `{"status":"UP"}`

> **Volume mounts for local deps**: Because `mix.exs` declares `elixir-gherkin` and
> `elixir-cabbage` as local path deps, Mix resolves them at compile time by reading their
> source from the filesystem. Inside the Docker container the paths `../../libs/elixir-gherkin`
> and `../../libs/elixir-cabbage` (relative to `/workspace`) resolve to `/libs/elixir-gherkin`
> and `/libs/elixir-cabbage`. Both must be bind-mounted read-only.
>
> **DB Port Decision**: jasb and exph share port 8201 and are mutually exclusive alternatives —
> they cannot run simultaneously. They may therefore share the same PostgreSQL instance (port 5432)
> and database name. Document this in `infra/dev/organiclever-exph/README.md`.

---

## Phase 8: GitHub Actions — E2E Workflow

**Commit**: `ci: add e2e-organiclever-exph GitHub Actions workflow`

- [ ] Create `.github/workflows/e2e-organiclever-exph.yml`:
  - Trigger: schedule (same crons as jasb) + `workflow_dispatch`
  - Job `e2e-be`:
    1. Checkout
    2. `docker compose ... up --build -d organiclever-be-exph`
    3. Wait-for-healthy loop (same pattern as jasb)
    4. Setup Volta + `npm ci`
    5. `npx nx run organiclever-be-e2e:test:e2e` with env `BASE_URL=http://localhost:8201`
    6. Upload artifact `playwright-report-be-exph`
    7. `docker compose ... down` (always)
- [ ] Trigger `workflow_dispatch` manually; verify green

---

## Phase 9: CI — main-ci.yml Update

**Commit**: `ci: add Elixir setup and organiclever-be-exph coverage upload to main-ci`

- [ ] Add `erlef/setup-beam@v1` step to `main-ci.yml` (Elixir 1.17, OTP 27)
- [ ] Add coverage upload step for `apps/organiclever-be-exph/cover/lcov.info` with flag
      `organiclever-be-exph`
- [ ] Run full `nx run-many -t test:quick --all` locally to confirm no regressions
- [ ] Push to `main`; verify `Main CI` workflow passes

---

## Phase 10: Final Validation

- [ ] `nx run elixir-gherkin:test:quick` passes (coverage ≥ 90%, credo, format)
- [ ] `nx run elixir-gherkin:typecheck` passes (zero Dialyzer warnings)
- [ ] `nx run elixir-cabbage:test:quick` passes (coverage ≥ 90%, credo, format)
- [ ] `nx run elixir-cabbage:typecheck` passes (zero Dialyzer warnings)
- [ ] `nx run organiclever-be-exph:test:quick` passes (lint + format + coverage ≥ 90%)
- [ ] `nx run organiclever-be-exph:test:unit` passes
- [ ] `nx run organiclever-be-exph:test:integration` passes (all 24 Gherkin scenarios)
- [ ] `nx run organiclever-be-exph:lint` passes
- [ ] `nx run organiclever-be-exph:typecheck` passes (zero Dialyzer warnings)
- [ ] `nx run organiclever-be-exph:build` succeeds
- [ ] Docker Compose stack starts and health check passes
- [ ] `e2e-organiclever-exph.yml` workflow green on GitHub Actions
- [ ] `main-ci.yml` workflow green on GitHub Actions
- [ ] Update `plans/backlog/README.md` to list this plan
- [ ] Move plan folder to `plans/done/`

---

## Gherkin Scenario Count Reference

| Feature file           | Scenarios |
| ---------------------- | --------- |
| health-check.feature   | 2         |
| hello-endpoint.feature | 2         |
| register.feature       | 9         |
| login.feature          | 5         |
| jwt-protection.feature | 6         |
| **Total**              | **24**    |

All 24 scenarios must pass in both `test:integration` (in-process, Ecto sandbox) and
`test:e2e` (live Docker stack via `organiclever-be-e2e`).
