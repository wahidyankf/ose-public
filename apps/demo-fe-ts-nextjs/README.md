# demo-fe-ts-nextjs

Demo Frontend - Next.js 16 (App Router) implementation consuming the
[demo-be API](../demo-be-golang-gin/README.md).

## Overview

- **Framework**: Next.js 16.1 (App Router)
- **Language**: TypeScript
- **UI Library**: React 19
- **State Management**: TanStack Query v5
- **BDD Tool**: @amiceli/vitest-cucumber
- **Port**: 3301
- **Specs**: `specs/apps/demo/fe/gherkin/` (92 scenarios across 15 features)

## Prerequisites

- **Node.js 24** (managed by Volta)
- **npm 11**
- A running [demo-be backend](../demo-be-golang-gin/README.md) on port 8201 (for E2E tests)

## Nx Commands

```bash
# Start development server (localhost:3301)
nx dev demo-fe-ts-nextjs

# Production build
nx build demo-fe-ts-nextjs

# Start production server
nx run demo-fe-ts-nextjs:start

# Type checking
nx typecheck demo-fe-ts-nextjs

# Lint code (oxlint)
nx lint demo-fe-ts-nextjs

# Fast quality gate: unit tests + coverage check + specs coverage check
nx run demo-fe-ts-nextjs:test:quick

# Unit tests only
nx run demo-fe-ts-nextjs:test:unit
```

**See**: [Nx Target Standards](../../governance/development/infra/nx-targets.md) for canonical target names.

## Project Structure

```
apps/demo-fe-ts-nextjs/
├── src/
│   ├── app/                      # Next.js App Router pages and layouts
│   ├── components/               # Reusable React components
│   ├── lib/                      # Utilities, API clients, hooks
│   └── test/                     # Test utilities
├── test/
│   └── unit/                     # Unit test step definitions (BDD)
├── Dockerfile                    # Production container image
├── next.config.ts                # Next.js configuration
├── vitest.config.ts              # Vitest configuration (coverage thresholds)
├── tsconfig.json                 # TypeScript configuration
└── project.json                  # Nx targets and tags
```

## Testing

Two levels of testing consume the 92 Gherkin scenarios from `specs/apps/demo/fe/gherkin/`:

| Level | Tool                        | Dependencies | Command                              | Cached? |
| ----- | --------------------------- | ------------ | ------------------------------------ | ------- |
| Unit  | @amiceli/vitest-cucumber    | All mocked   | `nx run demo-fe-ts-nextjs:test:unit` | Yes     |
| E2E   | Playwright + playwright-bdd | Full stack   | `nx run demo-fe-e2e:test:e2e`        | No      |

**Coverage**: Measured from `test:unit` only (Vitest v8). `test:quick` = `test:unit` + `rhino-cli test-coverage validate` (>=70%).

### Unit Tests

Steps test component logic and state management with fully mocked dependencies.
No DOM rendering, no HTTP calls:

```bash
nx run demo-fe-ts-nextjs:test:unit
```

### E2E Tests

The [`demo-fe-e2e`](../demo-fe-e2e/) project provides centralized Playwright-based E2E tests
for all demo-fe frontends. Run them after starting this frontend and a backend:

```bash
# Start backend
nx dev demo-be-golang-gin

# Start this frontend (in another terminal)
nx dev demo-fe-ts-nextjs

# Run E2E tests (in another terminal)
BASE_URL=http://localhost:3301 nx run demo-fe-e2e:test:e2e
```

## Docker

Build a production container image:

```bash
docker build -t demo-fe-ts-nextjs:latest apps/demo-fe-ts-nextjs/
```

## Related

- [demo-fe-e2e](../demo-fe-e2e/README.md) - Centralized E2E tests for all demo-fe frontends
- [demo-be-golang-gin](../demo-be-golang-gin/README.md) - Backend API consumed by this frontend
- [specs/apps/demo/fe/gherkin](../../specs/apps/demo/fe/gherkin/) - Gherkin feature files (source of truth)
