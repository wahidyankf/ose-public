# demo-fe-elixir-phoenix

Demo Frontend - Phoenix LiveView implementation consuming the
[demo-be API](../demo-be-java-springboot/README.md).

## Overview

- **Framework**: Phoenix 1.8 with LiveView
- **Language**: Elixir 1.19
- **HTTP Client**: Req
- **Web Server**: Bandit
- **CSS**: Tailwind CSS (via esbuild)
- **BDD Tool**: Cabbage
- **Coverage**: ExCoveralls (LCOV output)
- **Port**: 3301
- **Specs**: `specs/apps/demo/fe/gherkin/` (92 scenarios across 15 features)

## Prerequisites

- **Elixir 1.19+** (with OTP 27)
- **Node.js 24** (for asset compilation via esbuild/tailwind)
- A running [demo-be backend](../demo-be-java-springboot/README.md) on port 8201 (for E2E tests)

## Nx Commands

```bash
# Start development server (localhost:3301)
nx dev demo-fe-elixir-phoenix

# Compile the project
nx build demo-fe-elixir-phoenix

# Start production server
nx run demo-fe-elixir-phoenix:start

# Lint code (Credo strict mode)
nx lint demo-fe-elixir-phoenix

# Fast quality gate: unit tests + coverage check + specs coverage check
nx run demo-fe-elixir-phoenix:test:quick

# Unit tests only
nx run demo-fe-elixir-phoenix:test:unit
```

**See**: [Nx Target Standards](../../governance/development/infra/nx-targets.md) for canonical target names.

## Project Structure

```
apps/demo-fe-elixir-phoenix/
├── lib/                          # Application source code
│   └── demo_fe_exph_web/        # Phoenix web layer (controllers, live views, templates)
├── test/                         # Unit tests (Cabbage step definitions)
├── assets/                       # CSS and JavaScript assets
├── config/                       # Phoenix configuration (dev, test, prod)
├── Dockerfile                    # Production container image
├── mix.exs                       # Elixir project and dependencies
├── coveralls.json                # Coverage exclusion rules
└── project.json                  # Nx targets and tags
```

## Testing

Two levels of testing consume the 92 Gherkin scenarios from `specs/apps/demo/fe/gherkin/`:

| Level | Tool                        | Dependencies | Command                                   | Cached? |
| ----- | --------------------------- | ------------ | ----------------------------------------- | ------- |
| Unit  | Cabbage                     | All mocked   | `nx run demo-fe-elixir-phoenix:test:unit` | Yes     |
| E2E   | Playwright + playwright-bdd | Full stack   | `nx run demo-fe-e2e:test:e2e`             | No      |

**Coverage**: Measured from `test:unit` only (ExCoveralls LCOV). `test:quick` = `test:unit` + `rhino-cli test-coverage validate` (>=25%).

### Unit Tests

Steps test LiveView logic and state management with fully mocked dependencies:

```bash
nx run demo-fe-elixir-phoenix:test:unit
```

### E2E Tests

The [`demo-fe-e2e`](../demo-fe-e2e/) project provides centralized Playwright-based E2E tests
for all demo-fe frontends. Run them after starting this frontend and a backend:

```bash
# Start backend
nx dev demo-be-java-springboot

# Start this frontend (in another terminal)
nx dev demo-fe-elixir-phoenix

# Run E2E tests (in another terminal)
BASE_URL=http://localhost:3301 nx run demo-fe-e2e:test:e2e
```

## Docker

Build a production container image:

```bash
docker build -t demo-fe-elixir-phoenix:latest apps/demo-fe-elixir-phoenix/
```

## Related

- [demo-fe-e2e](../demo-fe-e2e/README.md) - Centralized E2E tests for all demo-fe frontends
- [demo-be-java-springboot](../demo-be-java-springboot/README.md) - Backend API consumed by this frontend
- [specs/apps/demo/fe/gherkin](../../specs/apps/demo/fe/gherkin/) - Gherkin feature files (source of truth)
