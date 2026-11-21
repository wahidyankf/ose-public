# OrganicLever Backend — API

**Audience:** Engineers, Technical Product/Project Managers

OrganicLever backend (`organiclever-be`) is an F#/Giraffe (a functional web framework
on top of ASP.NET Core — think Node.js Express but functional and typed) REST API.
Today it ships one endpoint: the health check. All productivity-tracking endpoints are
deferred; the backend is deployed alongside the frontend for operational readiness, not
because current features require it.

## Endpoints

| Method | Path             | Auth | Description                                 |
| ------ | ---------------- | ---- | ------------------------------------------- |
| GET    | `/api/v1/health` | None | Health check — returns 200 with status body |

## Environment variables

No required environment variables today. The health endpoint runs without any
configuration. Future endpoints will document their variables here.

| Variable     | Scope | Required | Description |
| ------------ | ----- | -------- | ----------- |
| (none today) | —     | No       | —           |

## Architecture

```
apps/organiclever-be/
├── src/
│   └── OrganicLeverBe/
│       ├── Program.fs               # Entry point, routing, DI registration
│       ├── Domain/
│       │   └── Types.fs             # Domain error types (reserved for future features)
│       └── Handlers/
│           └── HealthHandler.fs     # GET /api/v1/health
└── tests/
    └── OrganicLeverBe.Tests/
        ├── State.fs                 # BDD step state record
        ├── HttpTestFixture.fs       # WebApplicationFactory wrapper
        ├── Unit/                    # Unit BDD runner (TickSpec + xunit)
        └── Integration/             # Integration BDD runner and step definitions
```

## Tech stack

| Layer     | Technology                                               |
| --------- | -------------------------------------------------------- |
| Language  | F# (functional, type-safe)                               |
| Framework | Giraffe (functional ASP.NET Core web framework)          |
| Runtime   | .NET 10                                                  |
| Port      | 8202 (development)                                       |
| API base  | `/api/v1`                                                |
| Testing   | TickSpec (BDD step runner), xunit, and Coverlet          |
| Coverage  | At least 99% Unit line coverage, enforced by `test:unit` |

## BDD test coverage

The canonical corpus is [`behaviours/`](./behaviours/README.md). Its `.feature` files drive:

- **Unit** (`organiclever-be:test:unit`) — in-process production logic through injected doubles,
  with a hard 99% line-coverage minimum
- **Integration** (`organiclever-be:test:integration`) — real isolated local resources without
  network access
- **E2E** (`organiclever-be-e2e:test:e2e`) — the real service through its public HTTP boundary
- **Static coverage** (`test:behaviour:coverage`) — exact Gherkin binding/exemption validation that runs no
  tests and is mandatory in `test:quick`

## Related

- [Behaviour specs](./behaviours/README.md) — Gherkin acceptance criteria
- [Architecture](./architecture.md) — where this service fits
- [OpenAPI contract](./contracts/README.md) — the schema this API serves
