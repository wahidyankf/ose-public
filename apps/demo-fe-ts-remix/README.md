# demo-fe-ts-remix

Demo Frontend - React Router v7 (formerly Remix) implementation consuming the
[demo-be API](../demo-be-golang-gin/README.md).

## Overview

- **Framework**: React Router v7 (formerly Remix)
- **Language**: TypeScript
- **UI Library**: React 19
- **State Management**: TanStack Query v5
- **Build Tool**: Vite
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
nx dev demo-fe-ts-remix

# Production build
nx build demo-fe-ts-remix

# Start production server
nx run demo-fe-ts-remix:start

# Type checking (generates route types first)
nx typecheck demo-fe-ts-remix

# Lint code (oxlint)
nx lint demo-fe-ts-remix

# Fast quality gate: unit tests + coverage check + specs coverage check
nx run demo-fe-ts-remix:test:quick

# Unit tests only
nx run demo-fe-ts-remix:test:unit
```

**See**: [Nx Target Standards](../../governance/development/infra/nx-targets.md) for canonical target names.

## Project Structure

```
apps/demo-fe-ts-remix/
├── app/                          # React Router app directory (routes, components)
├── test/
│   └── unit/                     # Unit test step definitions (BDD)
├── Dockerfile                    # Production container image
├── react-router.config.ts        # React Router configuration
├── vite.config.ts                # Vite build configuration
├── vitest.config.ts              # Vitest configuration (coverage thresholds)
├── tsconfig.json                 # TypeScript configuration
└── project.json                  # Nx targets and tags
```

## Testing

Two levels of testing consume the 92 Gherkin scenarios from `specs/apps/demo/fe/gherkin/`:

| Level | Tool                        | Dependencies | Command                             | Cached? |
| ----- | --------------------------- | ------------ | ----------------------------------- | ------- |
| Unit  | @amiceli/vitest-cucumber    | All mocked   | `nx run demo-fe-ts-remix:test:unit` | Yes     |
| E2E   | Playwright + playwright-bdd | Full stack   | `nx run demo-fe-e2e:test:e2e`       | No      |

**Coverage**: Measured from `test:unit` only (Vitest v8). `test:quick` = `test:unit` + `rhino-cli test-coverage validate` (>=25%).

### Unit Tests

Steps test component logic and state management with fully mocked dependencies.
No DOM rendering, no HTTP calls:

```bash
nx run demo-fe-ts-remix:test:unit
```

### E2E Tests

The [`demo-fe-e2e`](../demo-fe-e2e/) project provides centralized Playwright-based E2E tests
for all demo-fe frontends. Run them after starting this frontend and a backend:

```bash
# Start backend
nx dev demo-be-golang-gin

# Start this frontend (in another terminal)
nx dev demo-fe-ts-remix

# Run E2E tests (in another terminal)
BASE_URL=http://localhost:3301 nx run demo-fe-e2e:test:e2e
```

## Docker

Build a production container image:

```bash
docker build -t demo-fe-ts-remix:latest apps/demo-fe-ts-remix/
```

## Related

- [demo-fe-e2e](../demo-fe-e2e/README.md) - Centralized E2E tests for all demo-fe frontends
- [demo-be-golang-gin](../demo-be-golang-gin/README.md) - Backend API consumed by this frontend
- [specs/apps/demo/fe/gherkin](../../specs/apps/demo/fe/gherkin/) - Gherkin feature files (source of truth)
