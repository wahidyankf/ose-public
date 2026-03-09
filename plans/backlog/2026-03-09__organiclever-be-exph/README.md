# Plan: organiclever-be-exph

Elixir/Phoenix reimplementation of the OrganicLever backend REST API — a functional twin of
`apps/organiclever-be-jasb` using Elixir, Phoenix, Ecto, and PostgreSQL.

## Goals

- Provide a functionally equivalent backend to `organiclever-be-jasb` using the Elixir ecosystem
- Consume the shared `specs/apps/organiclever-be/` Gherkin feature files for BDD integration tests
- Integrate seamlessly into the Nx monorepo with the same target surface (`build`, `dev`,
  `test:quick`, `test:unit`, `test:integration`, `lint`, `typecheck`)
- Reuse the existing `organiclever-be-e2e` Playwright BDD test suite for E2E validation
- Add a dedicated GitHub Actions workflow (`e2e-organiclever-exph.yml`) and Docker Compose
  infra (`infra/dev/organiclever-exph/`)

## Naming

`exph` = **El**ixir + **Ph**oenix (matching the `-jasb` suffix pattern: **Ja**va **S**pring **B**oot).

## API Surface (identical to organiclever-be-jasb)

| Method | Path                    | Auth | Description              |
| ------ | ----------------------- | ---- | ------------------------ |
| GET    | `/health`               | No   | Health check             |
| GET    | `/api/v1/hello`         | JWT  | Greeting endpoint        |
| POST   | `/api/v1/auth/register` | No   | Register new user        |
| POST   | `/api/v1/auth/login`    | No   | Login, return JWT Bearer |

## Tech Stack

| Concern          | Choice                                                                               |
| ---------------- | ------------------------------------------------------------------------------------ |
| Language         | Elixir 1.17 (OTP 27)                                                                 |
| Web framework    | Phoenix 1.7                                                                          |
| Database ORM     | Ecto 3.12 + PostgreSQL 17                                                            |
| JWT              | Guardian 2.x                                                                         |
| Password hashing | Bcrypt (`bcrypt_elixir`)                                                             |
| BDD (int. tests) | **elixir-cabbage** + **elixir-gherkin** — vendored forks in `libs/`, self-maintained |
| Linting          | Credo                                                                                |
| Type checking    | Dialyxir (Dialyzer wrapper)                                                          |
| Coverage         | ExCoveralls → LCOV → `rhino-cli test-coverage validate`                              |
| Port             | **8201** (same as organiclever-be-jasb — they are mutually exclusive alternatives)   |

## Related Files

- `libs/elixir-gherkin/` — vendored fork of `cabbage-ex/gherkin` (to be created)
- `libs/elixir-cabbage/` — vendored fork of `cabbage-ex/cabbage` (to be created)
- `apps/organiclever-be-exph/` — application source (to be created)
- `infra/dev/organiclever-exph/` — Docker Compose dev infra (to be created)
- `.github/workflows/e2e-organiclever-exph.yml` — E2E workflow (to be created)
- `.github/workflows/main-ci.yml` — add Elixir setup + coverage upload (to be updated)
- `specs/apps/organiclever-be/` — shared Gherkin specs (consumed, not modified)
- `apps/organiclever-be-e2e/` — reused Playwright E2E suite (consumed, not modified)

## See Also

- [requirements.md](./requirements.md) — acceptance criteria
- [tech-docs.md](./tech-docs.md) — technical design
- [delivery.md](./delivery.md) — delivery checklist
