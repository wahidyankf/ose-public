# Technical Documentation

## Architecture

The fullstack app runs as a single Next.js server serving both API routes and UI pages.
No separate backend or API proxy is needed.

```mermaid
flowchart TD
    Browser["Browser\n(React SPA + TanStack Query)"]
    NextJS["Next.js 16\nApp Router + Route Handlers\nport 3401"]
    DB["PostgreSQL\n(Drizzle ORM)"]

    Browser -- "fetch /api/v1/*\n+ page navigation" --> NextJS
    NextJS -- "SQL queries" --> DB

    style Browser fill:#0173B2,color:#ffffff
    style NextJS fill:#029E73,color:#ffffff
    style DB fill:#DE8F05,color:#ffffff
```

## Project Structure

```
apps/demo-fs-ts-nextjs/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── api/                      # Route Handlers (BE API)
│   │   │   └── v1/
│   │   │       ├── auth/             # /api/v1/auth/*
│   │   │       ├── users/            # /api/v1/users/*
│   │   │       ├── admin/            # /api/v1/admin/*
│   │   │       ├── expenses/         # /api/v1/expenses/*
│   │   │       ├── tokens/           # /api/v1/tokens/*
│   │   │       ├── reports/          # /api/v1/reports/*
│   │   │       └── test/             # /api/v1/test/* (test-only)
│   │   ├── (auth)/                   # Auth pages (login, register)
│   │   ├── (dashboard)/              # Protected pages
│   │   │   ├── expenses/             # Expense list + detail + summary
│   │   │   ├── profile/              # User profile + password change
│   │   │   ├── tokens/               # Token inspector
│   │   │   └── admin/                # Admin panel
│   │   ├── health/                    # /health endpoint
│   │   │   └── route.ts
│   │   ├── .well-known/               # JWKS endpoint
│   │   │   └── jwks.json/
│   │   │       └── route.ts
│   │   ├── layout.tsx                # Root layout
│   │   └── page.tsx                  # Home page
│   ├── services/                     # Business logic (pure functions)
│   │   ├── auth-service.ts           # Auth logic
│   │   ├── user-service.ts           # User management
│   │   ├── expense-service.ts        # Expense CRUD
│   │   ├── attachment-service.ts     # File handling
│   │   └── report-service.ts         # P&L reporting
│   ├── repositories/                 # Data access layer (Drizzle)
│   │   ├── user-repository.ts
│   │   ├── session-repository.ts
│   │   ├── expense-repository.ts
│   │   └── attachment-repository.ts
│   ├── db/                           # Database setup
│   │   ├── schema.ts                 # Drizzle schema definitions
│   │   ├── client.ts                 # Drizzle client singleton
│   │   └── migrations/               # SQL migrations
│   ├── components/                   # Reusable React components
│   ├── lib/                          # Utilities, auth, hooks
│   │   ├── auth-provider.tsx         # Client-side auth context
│   │   ├── jwt.ts                    # JWT sign/verify (server-side)
│   │   └── api-client.ts            # Client-side fetch wrapper
│   ├── generated-contracts/          # OpenAPI codegen output
│   └── test/                         # Test utilities
├── test/
│   ├── unit/
│   │   ├── be-steps/                 # BE Gherkin step definitions
│   │   │   ├── health-steps.ts
│   │   │   ├── auth-steps.ts
│   │   │   ├── token-lifecycle-steps.ts
│   │   │   ├── registration-steps.ts
│   │   │   ├── user-account-steps.ts
│   │   │   ├── security-steps.ts
│   │   │   ├── token-management-steps.ts
│   │   │   ├── admin-steps.ts
│   │   │   ├── expense-steps.ts
│   │   │   ├── currency-steps.ts
│   │   │   ├── unit-handling-steps.ts
│   │   │   ├── reporting-steps.ts
│   │   │   ├── attachment-steps.ts
│   │   │   └── test-api-steps.ts
│   │   └── fe-steps/                 # FE Gherkin step definitions
│   │       ├── health-steps.ts
│   │       ├── login-steps.ts
│   │       ├── session-steps.ts
│   │       ├── registration-steps.ts
│   │       ├── profile-steps.ts
│   │       ├── security-steps.ts
│   │       ├── tokens-steps.ts
│   │       ├── admin-steps.ts
│   │       ├── expense-steps.ts
│   │       ├── currency-steps.ts
│   │       ├── unit-handling-steps.ts
│   │       ├── reporting-steps.ts
│   │       ├── attachment-steps.ts
│   │       ├── responsive-steps.ts
│   │       └── accessibility-steps.ts
│   └── integration/
│       └── be-steps/                 # BE integration steps (real PostgreSQL)
├── drizzle.config.ts                 # Drizzle Kit config
├── docker-compose.integration.yml    # Integration test: PG + test runner
├── Dockerfile                        # Production container
├── next.config.ts                    # Next.js configuration
├── vitest.config.ts                  # Vitest configuration
├── tsconfig.json                     # TypeScript config
└── project.json                      # Nx targets and tags
```

## Design Decisions

| Decision         | Choice                     | Reason                                                |
| ---------------- | -------------------------- | ----------------------------------------------------- |
| App type         | Fullstack (fs)             | First demo combining BE + FE in one app               |
| Framework        | Next.js 16 (App Router)    | Proven fullstack framework; existing FE experience    |
| API layer        | Next.js Route Handlers     | Native, zero-config API routes in App Router          |
| ORM              | Drizzle ORM                | Lightweight, SQL-like, type-safe, functional style    |
| Database         | PostgreSQL                 | Same as all other demo backends                       |
| Auth             | JWT HS256 (jose library)   | Same token format as other backends                   |
| State management | TanStack Query v5          | Same as existing FE apps                              |
| HTTP client      | fetch (native)             | No extra dependency                                   |
| Auth storage     | localStorage (client-side) | Must match keys for E2E compatibility                 |
| Coverage tool    | Vitest v8 + rhino-cli      | Same as TS projects; 80%+ threshold (BE+FE blend)     |
| Linter           | oxlint                     | Same as demo-fe-ts-nextjs                             |
| Port             | 3401                       | New range for fullstack apps                          |
| BDD tool         | @amiceli/vitest-cucumber   | Unified coverage: both BE + FE steps run in Vitest    |
| Docker           | Multi-stage + PostgreSQL   | Same pattern as other demo backends                   |
| Integration BDD  | @cucumber/cucumber         | Proven pattern from demo-be-ts-effect; runs in Docker |

## Key Architectural Differences from Existing Apps

**vs `demo-be-*` backends:**

- API routes are Next.js Route Handlers, not standalone HTTP servers
- Same service layer pattern (services/ + repositories/) but in TypeScript
- Same PostgreSQL schema and migrations
- Route Handlers receive `NextRequest` and return `NextResponse`

**vs `demo-fe-*` frontends:**

- No API proxy needed — Route Handlers serve the API on the same origin
- Frontend code can import server-side utilities via server components
- Database connection is in-process, not over HTTP

**Service Layer Architecture:**

```
Route Handler (app/api/v1/...)  ──→  Service (services/)  ──→  Repository (repositories/)
         │                                                              │
         ↓                                                              ↓
    NextRequest/NextResponse                                      Drizzle ORM → PostgreSQL
         │
Page Component (app/(dashboard)/...)  ──→  API Client (lib/api-client.ts)  ──→  fetch("/api/v1/...")
```

Unit tests call service functions directly with mocked repositories (same pattern as all
demo backends). Frontend unit tests mock the API client layer (same pattern as demo-fe apps).

## Spec Consumption

The fullstack app is unique in consuming **both** spec sets:

| Spec Source                   | Consumed By                  | Test Level            | Step Style             |
| ----------------------------- | ---------------------------- | --------------------- | ---------------------- |
| `specs/apps/demo/be/gherkin/` | `test/unit/be-steps/`        | Unit (mocked repos)   | Service function calls |
| `specs/apps/demo/be/gherkin/` | `test/integration/be-steps/` | Integration (real PG) | Service function calls |
| `specs/apps/demo/be/gherkin/` | `demo-be-e2e`                | E2E                   | HTTP requests          |
| `specs/apps/demo/fe/gherkin/` | `test/unit/fe-steps/`        | Unit (mocked API)     | Component logic        |
| `specs/apps/demo/fe/gherkin/` | `demo-fe-e2e`                | E2E                   | Playwright browser     |

## Database Schema

Same schema as other backends (users, sessions, expenses, attachments). Defined in
Drizzle schema format (`src/db/schema.ts`), with SQL migrations generated by Drizzle Kit.

## Nx Configuration

**Tags:**

```json
"tags": ["type:app", "platform:nextjs", "lang:ts", "domain:demo-fs"]
```

**Implicit dependencies:**

```json
"implicitDependencies": ["demo-contracts", "rhino-cli"]
```

**7 mandatory targets** + optional `dev`:

| Target             | Purpose                                          | Cacheable |
| ------------------ | ------------------------------------------------ | --------- |
| `codegen`          | Generate types from OpenAPI spec                 | Yes       |
| `dev`              | Start dev server (port 3401)                     | No        |
| `typecheck`        | `tsc --noEmit` (depends on `codegen`)            | Yes       |
| `lint`             | oxlint                                           | Yes       |
| `build`            | `next build`                                     | Yes       |
| `test:unit`        | Unit tests — BE (mocked repos) + FE (mocked API) | Yes       |
| `test:quick`       | Unit tests + coverage validation (80%+)          | Yes       |
| `test:integration` | Docker + real PostgreSQL                         | No        |

**Cache inputs for `test:unit` and `test:quick`:**

```json
"inputs": [
  "default",
  "{projectRoot}/src/generated-contracts/**/*",
  "{workspaceRoot}/specs/apps/demo/be/gherkin/**/*.feature",
  "{workspaceRoot}/specs/apps/demo/fe/gherkin/**/*.feature"
]
```

Note: Both BE and FE Gherkin specs are included as cache inputs since this app consumes both.

## Docker Compose

**Local development** (`infra/dev/demo-fs-ts-nextjs/docker-compose.yml`):

```yaml
services:
  demo-fs-ts-nextjs-db:
    image: postgres:17-alpine
    container_name: demo-fs-ts-nextjs-db
    environment:
      POSTGRES_DB: demo_fs_nextjs
      POSTGRES_USER: ${POSTGRES_USER:-demo_fs_nextjs}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-demo_fs_nextjs}
    ports:
      - "5432:5432"
    volumes:
      - demo-fs-ts-nextjs-db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-demo_fs_nextjs} -d demo_fs_nextjs"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
    restart: unless-stopped
    networks:
      - demo-fs-ts-nextjs-network

  demo-fs-ts-nextjs:
    build:
      context: ../../../apps/demo-fs-ts-nextjs
    container_name: demo-fs-ts-nextjs
    ports:
      - "3401:3401"
    depends_on:
      demo-fs-ts-nextjs-db:
        condition: service_healthy
    environment:
      - DATABASE_URL=postgresql://demo_fs_nextjs:demo_fs_nextjs@demo-fs-ts-nextjs-db:5432/demo_fs_nextjs
      - APP_JWT_SECRET=${APP_JWT_SECRET:-change-me-in-dev-only-not-for-production}
      - ENABLE_TEST_API=true
      - PORT=3401
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3401/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s
    restart: unless-stopped
    networks:
      - demo-fs-ts-nextjs-network

networks:
  demo-fs-ts-nextjs-network:
    driver: bridge
    name: demo-fs-ts-nextjs-network

volumes:
  demo-fs-ts-nextjs-db-data:
```

**Integration tests** (`apps/demo-fs-ts-nextjs/docker-compose.integration.yml`):

Same pattern as other backends — PostgreSQL + test runner container.

## CI Workflow

`.github/workflows/test-demo-fs-ts-nextjs.yml` following the pattern of other demo app
workflows:

- **Triggers**: 2x daily cron (WIB 06, 18) + manual dispatch
- **Jobs**:
  - `unit`: `nx run demo-fs-ts-nextjs:test:quick`
  - `integration`: `nx run demo-fs-ts-nextjs:test:integration`
  - `e2e-be`: Start app + PG, run `demo-be-e2e` with `BASE_URL=http://localhost:3401`
  - `e2e-fe`: Start app + PG, run `demo-fe-e2e` with `BASE_URL=http://localhost:3401`
    and `BACKEND_URL=http://localhost:3401`
- **Codecov**: Upload coverage from unit tests
