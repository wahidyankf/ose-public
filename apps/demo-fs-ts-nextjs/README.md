# demo-fs-ts-nextjs

Fullstack Next.js 16 demo application combining backend API Route Handlers and frontend
App Router in a single deployable unit. Built with TypeScript, Drizzle ORM, and PostgreSQL.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL 17 via Drizzle ORM
- **Auth**: JWT (HS256) via jose, scrypt password hashing
- **Frontend**: React 19, TanStack Query, inline styles
- **Testing**: Vitest + @amiceli/vitest-cucumber (BDD), @testing-library/react
- **Port**: 3401

## Commands

```bash
# Development
nx dev demo-fs-ts-nextjs              # Start dev server on port 3401
nx build demo-fs-ts-nextjs            # Production build
nx run demo-fs-ts-nextjs:typecheck    # Type checking
nx run demo-fs-ts-nextjs:lint         # Linting (oxlint)

# Testing
nx run demo-fs-ts-nextjs:test:unit    # Run all unit tests (BE + FE BDD)
nx run demo-fs-ts-nextjs:test:quick   # Unit tests + coverage validation (75%+)

# Code generation
nx run demo-fs-ts-nextjs:codegen      # Generate types from OpenAPI spec
```

## Architecture

### Backend (Route Handlers)

API routes under `src/app/api/v1/` follow a layered architecture:

- **Route Handlers** → thin HTTP adapters (parse request, call service, format response)
- **Services** → business logic with `ServiceResult<T>` pattern
- **Repositories** → data access via Drizzle ORM (interface-based for testability)

### Frontend (App Router)

Pages under `src/app/` with route groups:

- `(auth)` — login, register (public)
- `(dashboard)` — expenses, profile, admin, tokens (authenticated)

Client-side state via TanStack Query with auth context provider.

### Testing Strategy

Three-level testing following the project standard:

1. **Unit** (`test:unit`): Services called directly with in-memory repositories (BE),
   components rendered with mocked API (FE). Both consume Gherkin specs.
2. **Integration** (`test:integration`): Services with real PostgreSQL via Docker.
3. **E2E** (`test:e2e`): Full HTTP via `demo-be-e2e` and `demo-fe-e2e` Playwright suites.

## Related Documentation

- [OpenAPI Contract](../../specs/apps/demo/contracts/)
- [BE Gherkin Specs](../../specs/apps/demo/be/gherkin/)
- [FE Gherkin Specs](../../specs/apps/demo/fe/gherkin/)
- [Three-Level Testing Standard](../../governance/development/quality/three-level-testing-standard.md)
- [Nx Targets Convention](../../governance/development/infra/nx-targets.md)
