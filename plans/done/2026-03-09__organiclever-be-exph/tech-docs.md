# Technical Design: organiclever-be-exph

## BDD Integration Test: Vendored Cabbage + Gherkin

Integration tests parse the canonical `.feature` files in `specs/apps/organiclever-be/` at
compile time using **elixir-cabbage** — our self-maintained fork of `cabbage-ex/cabbage`,
which in turn depends on **elixir-gherkin**, our fork of `cabbage-ex/gherkin`. Both libraries
live in `libs/` and are referenced via local Mix path dependencies.

HTTP calls use `Phoenix.ConnTest` (in-process — no live server or database needed, matching
`organiclever-be-jasb`'s MockMvc approach). The `Accounts` context is replaced with
`MockAccounts` (via `Mox`) for all integration tests — no database or external service required.

Step definitions use ExUnit macros (`defgiven`, `defwhen`, `defthen`). Each feature file maps
to one step-definition file:

```elixir
# test/integration/steps/auth_register_steps.exs
use Cabbage.Feature,
  async: false,
  file: "../../../../specs/apps/organiclever-be/auth/register.feature"

defwhen ~r/^a client sends POST \/api\/v1\/auth\/register with body:$/,
        %{doc_string: body}, state do
  conn = post(build_conn(), "/api/v1/auth/register", Jason.decode!(body))
  {:ok, Map.put(state, :conn, conn)}
end

defthen ~r/^the response status code should be (\d+)$/, %{1 => code}, %{conn: conn} = state do
  assert conn.status == String.to_integer(code)
  {:ok, state}
end
```

Cabbage enforces step-definition completeness: if a step in the `.feature` file has no matching
`defgiven`/`defwhen`/`defthen`, the test fails to compile — spec drift is caught immediately.

### Why We Fork

We fork both upstream libraries rather than consuming them from Hex for the following reasons:

1. **Upstream is effectively dormant.** `cabbage` (0.4.1) was last released September 2023 —
   after a five-year gap from 2018 to 2023. `gherkin` (2.0.0) was released the same day as
   part of the same burst of activity. No commits or releases have followed in either repo.
   A single burst of activity after five years of silence is not a sign of sustained stewardship.

2. **No clear owner.** The `cabbage-ex` GitHub organisation has three small repos and no
   visible active maintainer. Opened issues and PRs receive no response. There is no indication
   the project will be updated for future Elixir or OTP releases.

3. **The Elixir ecosystem itself has confirmed this pattern.** The Elixir Forum thread on BDD
   tools concludes: _"BDD is dying/dead as a process these days for the most part so it's not
   going to get a lot of attention."_ No actively developed alternative with significant adoption
   exists. We would face the same maintenance cliff regardless of which upstream library we chose.

4. **The codebase is tiny — maintenance cost is low.** `cabbage` is ~8 Elixir source files.
   `gherkin` has zero external dependencies and is similarly small. The total surface to own is
   under 20 files. Keeping them up to date with Elixir version bumps is a minor, bounded task.

5. **MIT licence explicitly permits this.** Both `cabbage-ex/cabbage` and `cabbage-ex/gherkin`
   are MIT-licensed. Forking, modifying, and distributing — even privately — is fully permitted
   with no obligation beyond preserving the licence notice.

6. **Supply chain safety.** An unmaintained upstream package can be archived, deleted, or
   taken over by a malicious actor at any time. Vendoring eliminates this risk entirely: our
   copy lives inside the monorepo, is reviewed by us, and changes only when we choose.

7. **Immediate fix capability.** If a future Elixir or OTP release introduces a breaking
   change (a compile warning becomes an error, a deprecated API is removed), we can patch and
   ship in the same PR. We do not wait for an upstream maintainer who may never respond.

8. **We can enforce our own standards.** Vendoring lets us add Credo linting, Dialyzer type
   specs, and ExCoveralls coverage to the libraries themselves — the same quality bar we apply
   to all other code in this monorepo.

### What We Fork

| Lib in `libs/`   | Forks from                            | Forked version | Licence |
| ---------------- | ------------------------------------- | -------------- | ------- |
| `elixir-gherkin` | `cabbage-ex/gherkin` (hex: `gherkin`) | 2.0.0          | MIT     |
| `elixir-cabbage` | `cabbage-ex/cabbage` (hex: `cabbage`) | 0.4.1          | MIT     |

`elixir-cabbage` depends on `elixir-gherkin` via a local Mix path dep (`path: "../../libs/elixir-gherkin"`).
`organiclever-be-exph` depends on both via local path deps (test-only).

---

## Vendored Library Architecture

### libs/elixir-gherkin/

Fork of `cabbage-ex/gherkin`. Zero external dependencies. Changes from upstream at fork time:
(1) Mix app atom renamed from `:gherkin` to `:elixir_gherkin` to avoid Hex atom collision;
(2) `test_coverage: [tool: ExCoveralls]` and `preferred_cli_env` added to `project/0` in
`mix.exs` so `mix coveralls.lcov` is available; (3) `{:excoveralls, only: :test}` added to
deps; (4) quality tooling added (`.credo.exs`, `.formatter.exs`, `.dialyzer_ignore.exs`).

```
libs/elixir-gherkin/
├── lib/
│   └── gherkin/               # source files preserved as-is from upstream
├── test/
├── mix.exs                    # app: :elixir_gherkin (renamed); ExCoveralls dep + test_coverage config added
├── mix.lock
├── .credo.exs                 # added — strict mode
├── .formatter.exs             # added
├── .dialyzer_ignore.exs       # added — empty initially
├── LICENSE                    # MIT preserved from upstream
├── CHANGELOG.md               # upstream + our entries
├── FORK_NOTES.md              # forking rationale, upstream URL, version, our changes
└── project.json
```

**`project.json` for `elixir-gherkin`:**

```json
{
  "name": "elixir-gherkin",
  "sourceRoot": "libs/elixir-gherkin/lib",
  "projectType": "library",
  "targets": {
    "test:quick": {
      "executor": "nx:run-commands",
      "options": {
        "commands": [
          "mix coveralls.lcov",
          "(cd ../../apps/rhino-cli && CGO_ENABLED=0 go run main.go test-coverage validate libs/elixir-gherkin/cover/lcov.info 90)",
          "mix credo --strict",
          "mix format --check-formatted"
        ],
        "parallel": false,
        "cwd": "libs/elixir-gherkin"
      }
    },
    "test:unit": {
      "executor": "nx:run-commands",
      "options": {
        "command": "mix test",
        "cwd": "libs/elixir-gherkin"
      }
    },
    "lint": {
      "executor": "nx:run-commands",
      "options": {
        "command": "mix credo --strict",
        "cwd": "libs/elixir-gherkin"
      }
    },
    "typecheck": {
      "executor": "nx:run-commands",
      "options": {
        "command": "mix dialyzer",
        "cwd": "libs/elixir-gherkin"
      }
    },
    "install": {
      "executor": "nx:run-commands",
      "options": {
        "command": "mix deps.get",
        "cwd": "libs/elixir-gherkin"
      }
    }
  },
  "tags": ["type:lib", "lang:elixir"]
}
```

---

### libs/elixir-cabbage/

Fork of `cabbage-ex/cabbage`. Depends on `elixir-gherkin` via local path dep. Changes from
upstream at fork time: (1) Mix app atom renamed from `:cabbage` to `:elixir_cabbage`;
(2) `{:gherkin, "~> 2.0"}` replaced with `{:elixir_gherkin, path: "../../libs/elixir-gherkin"}`;
(3) `test_coverage: [tool: ExCoveralls]` and `preferred_cli_env` added to `mix.exs`; (4)
`{:excoveralls, only: :test}` added to deps; (5) quality tooling added. Module names
(`Cabbage.*`, `Gherkin.*`) are unchanged — internal module names are independent of Mix app
atoms and do not need to change.

```
libs/elixir-cabbage/
├── lib/
│   ├── cabbage.ex             # source preserved as-is from upstream
│   └── cabbage/               # source preserved as-is from upstream
│       ├── feature.ex
│       ├── feature/
│       │   ├── cucumber_expression.ex
│       │   ├── helpers.ex
│       │   ├── loader.ex
│       │   ├── missing_step_error.ex
│       │   ├── parameter.ex
│       │   └── parameter_type.ex
├── test/
├── mix.exs                    # app: :elixir_cabbage; gherkin dep → local path
├── mix.lock
├── .credo.exs                 # added — strict mode
├── .formatter.exs             # added
├── .dialyzer_ignore.exs       # added — empty initially
├── LICENSE                    # MIT preserved from upstream
├── CHANGELOG.md               # upstream + our entries
├── FORK_NOTES.md              # forking rationale, upstream URL, version, our changes
└── project.json
```

**`project.json` for `elixir-cabbage`:**

```json
{
  "name": "elixir-cabbage",
  "sourceRoot": "libs/elixir-cabbage/lib",
  "projectType": "library",
  "targets": {
    "test:quick": {
      "executor": "nx:run-commands",
      "options": {
        "commands": [
          "mix coveralls.lcov",
          "(cd ../../apps/rhino-cli && CGO_ENABLED=0 go run main.go test-coverage validate libs/elixir-cabbage/cover/lcov.info 90)",
          "mix credo --strict",
          "mix format --check-formatted"
        ],
        "parallel": false,
        "cwd": "libs/elixir-cabbage"
      }
    },
    "test:unit": {
      "executor": "nx:run-commands",
      "options": {
        "command": "mix test",
        "cwd": "libs/elixir-cabbage"
      }
    },
    "lint": {
      "executor": "nx:run-commands",
      "options": {
        "command": "mix credo --strict",
        "cwd": "libs/elixir-cabbage"
      }
    },
    "typecheck": {
      "executor": "nx:run-commands",
      "options": {
        "command": "mix dialyzer",
        "cwd": "libs/elixir-cabbage"
      }
    },
    "install": {
      "executor": "nx:run-commands",
      "options": {
        "command": "mix deps.get",
        "cwd": "libs/elixir-cabbage"
      }
    }
  },
  "tags": ["type:lib", "lang:elixir"],
  "implicitDependencies": ["elixir-gherkin"]
}
```

---

### FORK_NOTES.md Template

Each vendored lib must contain a `FORK_NOTES.md` at its root:

```markdown
# Fork Notes

## Upstream

- Source: https://github.com/cabbage-ex/[repo]
- Hex package: [gherkin|cabbage]
- Forked version: [2.0.0|0.4.1] (released 2023-09-18)
- Fork date: 2026-03-09

## Reason for Forking

1. **Upstream is effectively dormant.** The last release (Sep 2023) followed a five-year gap
   from 2018 to 2023. No commits or releases have followed. A single burst of activity after
   five years of silence is not a sign of sustained stewardship.

2. **No clear owner.** The `cabbage-ex` GitHub organisation has three small repos and no
   visible active maintainer. Opened issues and PRs receive no response. There is no indication
   the project will be updated for future Elixir or OTP releases.

3. **No maintained alternative with significant adoption exists.** The Elixir BDD ecosystem
   is fragmented; every option faces the same maintenance cliff.

4. **The codebase is tiny — maintenance cost is low.** `cabbage` is ~8 Elixir source files.
   `gherkin` has zero external dependencies and is similarly small. The total surface to own
   is under 20 files. Keeping them up to date with Elixir version bumps is a minor, bounded task.

5. **MIT licence explicitly permits this.** Forking, modifying, and distributing is fully
   permitted with no obligation beyond preserving this licence notice.

6. **Supply chain safety.** An unmaintained upstream package can be archived, deleted, or
   taken over at any time. Vendoring eliminates this risk: our copy lives inside the monorepo,
   reviewed by us, and changes only when we choose.

7. **Immediate fix capability.** If a future Elixir or OTP release introduces a breaking
   change, we can patch and ship in the same PR without waiting for an absent maintainer.

8. **We can enforce our own standards.** Vendoring lets us apply Credo, Dialyzer, and
   ExCoveralls — the same quality bar as all other code in this monorepo.

## Changes from Upstream

- `mix.exs`: renamed `app:` atom to `:elixir_[gherkin|cabbage]` to prevent Hex atom collision
- `mix.exs`: bumped version to `[2.0.0|0.4.1]-ose.1` to distinguish from upstream
- `mix.exs` (cabbage only): replaced `{:gherkin, "~> 2.0"}` with local path dep to elixir-gherkin
- Added: `.credo.exs`, `.formatter.exs`, `.dialyzer_ignore.exs`, `project.json`, `FORK_NOTES.md`
- No functional source changes at fork time

## Syncing from Upstream

Upstream is effectively dormant — do not expect upstream changes. If a fix is needed,
implement it directly in this fork. If upstream ever releases a meaningful update, review
the diff manually against our fork and cherry-pick relevant changes.
```

---

## Application Architecture

### Module Structure

```
apps/organiclever-be-exph/
├── lib/
│   ├── organiclever_be_exph/
│   │   ├── accounts/
│   │   │   ├── accounts.ex           # context: implements Behaviour, register/login
│   │   │   ├── accounts_behaviour.ex # @callback interface (Mox target in tests)
│   │   │   └── user.ex               # Ecto schema
│   │   └── auth/
│   │       └── guardian.ex           # Guardian JWT implementation
│   └── organiclever_be_exph_web/
│       ├── controllers/
│       │   ├── health_controller.ex
│       │   ├── hello_controller.ex
│       │   └── auth_controller.ex    # calls @accounts_impl (injected from config)
│       ├── router.ex
│       └── endpoint.ex
├── test/
│   ├── integration/                  # Cabbage BDD — in-process, no external DB
│   │   └── steps/
│   │       ├── health_steps.exs
│   │       ├── hello_steps.exs
│   │       ├── auth_register_steps.exs
│   │       ├── auth_login_steps.exs
│   │       └── jwt_protection_steps.exs
│   ├── unit/                         # Pure unit tests (changesets, helpers)
│   └── support/
│       ├── conn_case.ex
│       ├── data_case.ex              # for unit tests that need DB (e.g. changeset with repo)
│       └── mocks.ex                  # Mox.defmock(MockAccounts, for: Accounts.Behaviour)
├── priv/repo/migrations/
│   └── 20260309000000_create_users.exs
├── config/
│   ├── config.exs  # accounts_impl: OrganicleverBeExph.Accounts
│   ├── dev.exs
│   ├── test.exs    # accounts_impl: OrganicleverBeExph.MockAccounts
│   └── runtime.exs # reads DATABASE_URL, APP_JWT_SECRET, PORT
├── mix.exs
├── mix.lock
├── .credo.exs
├── .dialyzer_ignore.exs
├── .formatter.exs
├── project.json
└── README.md
```

### Key Dependencies (`mix.exs`)

```elixir
def project do
  [
    app: :organiclever_be_exph,
    version: "0.1.0",
    # ... other fields ...
    test_coverage: [tool: ExCoveralls],
    preferred_cli_env: [
      coveralls: :test,
      "coveralls.lcov": :test
    ]
  ]
end

defp deps do
  [
    {:phoenix, "~> 1.7"},
    {:phoenix_ecto, "~> 4.6"},
    {:ecto_sql, "~> 3.12"},
    {:postgrex, ">= 0.0.0"},
    {:jason, "~> 1.4"},
    # Phoenix 1.7+ defaults to Bandit (not Cowboy)
    {:bandit, "~> 1.5"},
    {:guardian, "~> 2.3"},
    {:bcrypt_elixir, "~> 3.0"},
    # Test / BDD — vendored forks (local path deps, not Hex)
    {:elixir_gherkin, path: "../../libs/elixir-gherkin", only: :test},
    {:elixir_cabbage, path: "../../libs/elixir-cabbage", only: :test},
    # Test / mocking (in-process — no external services)
    {:mox, "~> 1.1", only: :test},
    {:excoveralls, "~> 0.18", only: :test},
    # Dev / quality
    {:credo, "~> 1.7", only: [:dev, :test], runtime: false},
    {:dialyxir, "~> 1.4", only: [:dev, :test], runtime: false}
  ]
end
```

> `phoenix_live_dashboard` is excluded — the scaffold uses `--no-dashboard`.
> `plug_cowboy` is excluded — Phoenix 1.7+ ships with Bandit as the default adapter.
> `test_coverage: [tool: ExCoveralls]` and `preferred_cli_env` are required so
> `mix coveralls.lcov` is a valid mix task in the `:test` environment.

### JWT Strategy

Use **Guardian** with HMAC-SHA256 (matching JASB's approach). Configuration:

```elixir
# lib/organiclever_be_exph/auth/guardian.ex
defmodule OrganicleverBeExph.Auth.Guardian do
  use Guardian, otp_app: :organiclever_be_exph

  alias OrganicleverBeExph.{Repo, Accounts.User}

  def subject_for_token(%{id: id}, _claims), do: {:ok, to_string(id)}
  def resource_from_claims(%{"sub" => id}), do: {:ok, Repo.get(User, String.to_integer(id))}
end
```

`subject_for_token` stores the user's integer `id` as a string (`to_string(id)`), so the
`"sub"` claim is `"1"` (a string). `resource_from_claims` must convert it back to an integer
before passing to `Repo.get/2`, which expects an integer primary key. Omitting
`String.to_integer/1` causes Ecto to raise a type error or return `nil`, causing all
authenticated requests to fail with 401.

Guardian also requires an application config entry for the secret key and TTL. Add to
`config/runtime.exs` (NOT `config/config.exs` — `System.get_env` must be evaluated at
runtime so Docker secret injection at container start time works correctly):

```elixir
# config/runtime.exs  ← must be runtime.exs, NOT config.exs
# (System.get_env reads env at runtime — required for Docker/CI secret injection)
config :organiclever_be_exph, OrganicleverBeExph.Auth.Guardian,
  issuer: "organiclever_be_exph",
  secret_key: System.get_env("APP_JWT_SECRET") || raise("APP_JWT_SECRET is not set"),
  ttl: {24, :hours}
```

Without this config block, the application raises a `Guardian.Token.Jwt.Impl` error at
startup. If a fallback secret is needed for the `test` environment, add a hardcoded test
secret in `config/test.exs` — not in `runtime.exs`.

JWT secret is read from `APP_JWT_SECRET` environment variable (identical to JASB).
Token expiry: 24 hours. No refresh token in Phase 1.

### Health Endpoint

Returns `{"status": "UP"}`. Does NOT expose DB/component details to anonymous callers
(mirroring the `when-authorized` behaviour from JASB's `MANAGEMENT_ENDPOINT_HEALTH_SHOWDETAILS`):

```json
GET /health → 200 {"status": "UP"}
```

### Password Validation Rules

Implemented as Ecto changeset validators (not schema constraints):

- Minimum 8 characters
- At least one uppercase letter
- At least one special character (`!@#$%^&*`)
- At least one digit (implicit in existing test data — verify against feature file)

### Username Validation Rules

- Minimum 3 characters
- Alphanumeric + underscore only (`^[a-zA-Z0-9_]+$`)

### CORS

Allow-list: `http://localhost:3200`, `http://localhost:3000`, production origin.
Use the Phoenix built-in `Plug.Conn.put_resp_header` (no additional dependency required).
Add a plug in the router pipeline or endpoint that sets `Access-Control-Allow-Origin` and
related CORS headers for the allowed origins. This avoids the `cors_plug` Hex package, which
is not listed in `mix.exs` deps and is not needed for a simple allow-list configuration.

The CORS plug must handle browser preflight requests. The `/api/v1/hello` endpoint sends an
`Authorization` header, which makes it a "non-simple" CORS request — browsers always issue
an `OPTIONS` preflight before the actual `GET`. The plug must:

1. For `OPTIONS` requests: return 200 immediately with CORS headers set and halt the
   connection using `Plug.Conn.halt/1` (before the request reaches the JWT pipeline).
2. For all other requests: set CORS headers on the response.

Without explicit OPTIONS handling, Phoenix returns 404 or 405 for preflight requests and the
browser blocks the actual CORS request, even though integration tests (in-process ConnTest,
no browser) pass.

---

## Nx Targets (`project.json`)

```json
{
  "name": "organiclever-be-exph",
  "sourceRoot": "apps/organiclever-be-exph/lib",
  "projectType": "application",
  "targets": {
    "build": {
      "executor": "nx:run-commands",
      "options": {
        "command": "MIX_ENV=prod mix do deps.get --only prod, compile --warnings-as-errors",
        "cwd": "apps/organiclever-be-exph"
      }
    },
    "dev": {
      "executor": "nx:run-commands",
      "options": {
        "command": "mix phx.server",
        "cwd": "apps/organiclever-be-exph"
      }
    },
    "start": {
      "executor": "nx:run-commands",
      "options": {
        "command": "mix phx.server",
        "cwd": "apps/organiclever-be-exph"
      }
    },
    "test:quick": {
      "executor": "nx:run-commands",
      "options": {
        "commands": [
          "mix coveralls.lcov",
          "(cd ../../apps/rhino-cli && CGO_ENABLED=0 go run main.go test-coverage validate apps/organiclever-be-exph/cover/lcov.info 90)",
          "mix credo --strict",
          "mix format --check-formatted"
        ],
        "parallel": false,
        "cwd": "apps/organiclever-be-exph"
      }
    },
    "test:unit": {
      "executor": "nx:run-commands",
      "options": {
        "command": "mix test --only unit",
        "cwd": "apps/organiclever-be-exph"
      }
    },
    "test:integration": {
      "executor": "nx:run-commands",
      "options": {
        "command": "mix test --only integration",
        "cwd": "apps/organiclever-be-exph"
      },
      "cache": true,
      "inputs": [
        "{projectRoot}/lib/**/*.ex",
        "{projectRoot}/test/**/*.exs",
        "{workspaceRoot}/specs/apps/organiclever-be/**/*.feature"
      ]
    },
    "lint": {
      "executor": "nx:run-commands",
      "options": {
        "command": "mix credo --strict",
        "cwd": "apps/organiclever-be-exph"
      }
    },
    "typecheck": {
      "executor": "nx:run-commands",
      "options": {
        "command": "mix dialyzer",
        "cwd": "apps/organiclever-be-exph"
      }
    },
    "install": {
      "executor": "nx:run-commands",
      "options": {
        "command": "mix deps.get",
        "cwd": "apps/organiclever-be-exph"
      }
    }
  },
  "tags": ["type:app", "platform:phoenix", "lang:elixir", "domain:organiclever"],
  "implicitDependencies": ["elixir-gherkin", "elixir-cabbage"]
}
```

> **Note on `test:quick`**: Sequential execution (`parallel: false`) is required because
> `mix coveralls.lcov` and `mix credo` share the compiled BEAM artifacts. The coverage gate
> command (`rhino-cli test-coverage validate`) runs after `mix coveralls.lcov` so that
> `cover/lcov.info` exists. `mix coveralls.lcov` requires the `test_coverage` and
> `preferred_cli_env` entries in `mix.exs` — see Key Dependencies above.
>
> `mix coveralls.lcov` runs the **full test suite** (unit + integration) because integration
> tests are in-process (Mox, no external services) and fully deterministic — no `--only`
> filter is needed. This matches the monorepo convention for `organiclever-be-jasb` and
> `golang-commons`.

---

## Infrastructure

### Port Assignment

| Service              | Port                                               |
| -------------------- | -------------------------------------------------- |
| organiclever-db      | 5432                                               |
| organiclever-be-jasb | 8201                                               |
| organiclever-be-exph | 8201 (same port — mutually exclusive alternatives) |
| organiclever-fe      | 3200                                               |

### Docker Compose (`infra/dev/organiclever-exph/docker-compose.yml`)

Mirrors `infra/dev/organiclever-jasb/docker-compose.yml` with these changes:

- Service name: `organiclever-be-exph`
- Container name: `organiclever-be-exph`
- Port: `8201:8201`
- Build context: `Dockerfile.be.dev` (Elixir-based)
- Volume mounts:
  - `../../../apps/organiclever-be-exph:/workspace:rw` — app source (hot-reload in dev)
  - `../../../libs/elixir-gherkin:/libs/elixir-gherkin:ro` — local path dep; Mix resolves
    `path: "../../libs/elixir-gherkin"` from `/workspace` → `/libs/elixir-gherkin`
  - `../../../libs/elixir-cabbage:/libs/elixir-cabbage:ro` — same reason
  - `../../../specs/apps/organiclever-be:/specs/apps/organiclever-be:ro` — Gherkin feature
    files; Cabbage resolves the relative path from the test file to the workspace root
- `depends_on: organiclever-db: condition: service_healthy` — wait for DB before starting
- Environment: `MIX_ENV=dev`, `PORT=8201`, `DATABASE_URL=postgresql://organiclever:organiclever@organiclever-db:5432/organiclever_exph`,
  `APP_JWT_SECRET`
- Command: `sh -c "mix ecto.migrate && mix phx.server"`
- Healthcheck: `wget --spider http://localhost:8201/health`
- Restart: `unless-stopped`
- Network: `organiclever-network`

The `volumes:` section at the bottom of the compose file must declare `organiclever-exph-db-data:`
for DB persistence. No `organiclever-fe` service — the web app connects to whichever backend
is configured.

### Dockerfile.be.dev (Elixir)

```dockerfile
FROM elixir:1.17-otp-27-alpine

RUN apk add --no-cache build-base git && \
    mix local.hex --force && \
    mix local.rebar --force

WORKDIR /workspace

CMD ["sh", "-c", "mix ecto.migrate && mix phx.server"]
```

### docker-compose.e2e.yml

Override for E2E that sets `MANAGEMENT_HEALTH_SHOW_DETAILS=when_authorized` equivalent
(i.e. never expose internals to anonymous callers — default in Phoenix, so this file may be
a no-op but is kept for parity with JASB's pattern):

```yaml
services:
  organiclever-be-exph:
    environment:
      - HEALTH_SHOW_DETAILS=false
```

---

## GitHub Actions

### New Workflow: `e2e-organiclever-exph.yml`

Mirrors `e2e-organiclever-jasb.yml` with:

- Name: `E2E - OrganicLever (EXPH)`
- Schedule: same cron (`0 23 * * *`, `0 11 * * *`)
- `e2e-be` job starts `organiclever-be-exph` via exph docker-compose
- Runs `npx nx run organiclever-be-e2e:test:e2e` with `BASE_URL=http://localhost:8201`
  (the existing `organiclever-be-e2e` Playwright suite must read `BASE_URL` from env)
- No `e2e-web` job (web already covered by jasb workflow; web E2E doesn't test backend specifics)
- Artifact upload: `playwright-report-be-exph`

### Updated Workflow: `main-ci.yml`

Add after existing Java setup:

```yaml
- name: Setup Elixir
  uses: erlef/setup-beam@v1
  with:
    elixir-version: "1.17"
    otp-version: "27"
```

Add coverage upload step:

```yaml
- name: Upload coverage — organiclever-be-exph
  uses: codecov/codecov-action@v5
  with:
    token: ${{ secrets.CODECOV_TOKEN }}
    files: apps/organiclever-be-exph/cover/lcov.info
    flags: organiclever-be-exph
    fail_ci_if_error: false
```

### BASE_URL Configurability in `organiclever-be-e2e`

The existing Playwright suite likely hardcodes `http://localhost:8201`. Before the exph E2E
workflow can reuse it, verify and update the Playwright config to read:

```ts
// playwright.config.ts
baseURL: process.env.BASE_URL ?? "http://localhost:8201",
```

If the suite already reads from env, no change is needed. If not, this is a prerequisite
change to `organiclever-be-e2e` (small, non-breaking, backward-compatible).

---

## Integration Test Strategy: Mox (No External Services)

Integration tests follow the monorepo convention of in-process mocking only — no external
services required, fully deterministic, safe to cache (`cache: true`). This matches
`organiclever-be-jasb` (MockMvc + mocked repositories) and `golang-commons` (mock closures).

**Mox** mocks the `OrganicleverBeExph.Accounts` context at the boundary between the HTTP
layer and the business logic layer. The HTTP layer (`Phoenix.ConnTest`) and the JWT/auth
pipeline run for real; the DB is never touched.

### Behaviour Definition

```elixir
# lib/organiclever_be_exph/accounts/accounts_behaviour.ex
defmodule OrganicleverBeExph.Accounts.Behaviour do
  @callback register_user(map()) :: {:ok, User.t()} | {:error, Ecto.Changeset.t()}
  @callback authenticate_user(String.t(), String.t()) :: {:ok, User.t()} | {:error, :invalid_credentials}
end
```

### Production and Test wiring

```elixir
# config/config.exs
config :organiclever_be_exph, :accounts_impl, OrganicleverBeExph.Accounts

# config/test.exs
config :organiclever_be_exph, :accounts_impl, OrganicleverBeExph.MockAccounts
```

```elixir
# test/support/mocks.ex
Mox.defmock(OrganicleverBeExph.MockAccounts,
  for: OrganicleverBeExph.Accounts.Behaviour)
```

### Step Definitions (Cabbage + Mox)

```elixir
# test/integration/steps/auth_register_steps.exs
use Cabbage.Feature,
  async: false,
  file: "../../../../specs/apps/organiclever-be/auth/register.feature"

alias OrganicleverBeExph.MockAccounts

defwhen ~r/^a client sends POST \/api\/v1\/auth\/register with body:$/,
        %{doc_string: body}, state do
  params = Jason.decode!(body)
  Mox.expect(MockAccounts, :register_user, fn _ ->
    {:ok, %{id: 1, username: params["username"]}}
  end)
  conn = post(build_conn(), "/api/v1/auth/register", params)
  {:ok, Map.put(state, :conn, conn)}
end
```

The controllers call the configured implementation via:

```elixir
@accounts Application.compile_env!(:organiclever_be_exph, :accounts_impl)
```

This pattern keeps integration tests completely in-process and consistent with the monorepo
convention. The full Controller → Accounts → Ecto → PostgreSQL stack is exercised only by
the E2E Playwright suite against the live Dockerised stack.

---

## Feature File Path Resolution

JASB copies feature files into the Maven test classpath via `maven-antrun-plugin`. For Elixir
with Cabbage, the path is specified directly at compile time:

```elixir
use Cabbage.Feature,
  file: "../../../../specs/apps/organiclever-be/auth/register.feature"
```

The relative path resolves from the test file's directory to the workspace root. Alternatively,
configure Cabbage to look in an absolute path via an environment variable set in `config/test.exs`:

```elixir
# config/test.exs
config :organiclever_be_exph, :specs_path,
  Path.expand("../../../../specs/apps/organiclever-be", __DIR__)
```

In the Docker container, the volume mount places specs at `/specs/apps/organiclever-be`
(consistent with JASB), so the path must be configurable between local dev and CI.
