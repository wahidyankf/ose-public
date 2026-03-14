# demo-fe-dart-flutter

Demo Frontend - Flutter Web implementation consuming the
[demo-be API](../demo-be-golang-gin/README.md).

## Overview

- **Framework**: Flutter Web 3.41+
- **Language**: Dart 3.11+
- **State Management**: Riverpod (with code generation)
- **Routing**: GoRouter
- **HTTP Client**: Dio
- **BDD Tool**: bdd_widget_test
- **Port**: 3301
- **Specs**: `specs/apps/demo/fe/gherkin/` (92 scenarios across 15 features)

## Prerequisites

- **Flutter SDK 3.41+** (includes Dart 3.11+)
- **Chrome** (for Flutter web development)
- A running [demo-be backend](../demo-be-golang-gin/README.md) on port 8201 (for E2E tests)

## Nx Commands

```bash
# Start development server (Chrome, localhost:3301)
nx dev demo-fe-dart-flutter

# Production build (web release)
nx build demo-fe-dart-flutter

# Serve production build (via npx serve)
nx run demo-fe-dart-flutter:start

# Lint code (dart analyze)
nx lint demo-fe-dart-flutter

# Fast quality gate: unit tests + coverage check + specs coverage check
nx run demo-fe-dart-flutter:test:quick

# Unit tests only
nx run demo-fe-dart-flutter:test:unit
```

**See**: [Nx Target Standards](../../governance/development/infra/nx-targets.md) for canonical target names.

## Project Structure

```
apps/demo-fe-dart-flutter/
├── lib/                          # Application source code
├── test/                         # Unit tests (bdd_widget_test step definitions)
├── web/                          # Web-specific assets (index.html, icons)
├── Dockerfile                    # Production container image
├── pubspec.yaml                  # Dart/Flutter dependencies
├── analysis_options.yaml         # Dart analyzer configuration
├── build.yaml                    # Build runner configuration (Riverpod codegen)
└── project.json                  # Nx targets and tags
```

## Testing

Two levels of testing consume the 92 Gherkin scenarios from `specs/apps/demo/fe/gherkin/`:

| Level | Tool                        | Dependencies | Command                                 | Cached? |
| ----- | --------------------------- | ------------ | --------------------------------------- | ------- |
| Unit  | bdd_widget_test             | All mocked   | `nx run demo-fe-dart-flutter:test:unit` | Yes     |
| E2E   | Playwright + playwright-bdd | Full stack   | `nx run demo-fe-e2e:test:e2e`           | No      |

**Coverage**: Measured from `test:unit` only (`flutter test --coverage`). `test:quick` = `test:unit` + `rhino-cli test-coverage validate` (>=1%).

### Unit Tests

Steps test widget logic and state management with fully mocked dependencies:

```bash
nx run demo-fe-dart-flutter:test:unit
```

### E2E Tests

The [`demo-fe-e2e`](../demo-fe-e2e/) project provides centralized Playwright-based E2E tests
for all demo-fe frontends. Run them after starting this frontend and a backend:

```bash
# Start backend
nx dev demo-be-golang-gin

# Build and serve this frontend (in another terminal)
nx build demo-fe-dart-flutter
nx run demo-fe-dart-flutter:start

# Run E2E tests (in another terminal)
BASE_URL=http://localhost:3301 nx run demo-fe-e2e:test:e2e
```

## Docker

Build a production container image:

```bash
docker build -t demo-fe-dart-flutter:latest apps/demo-fe-dart-flutter/
```

## Related

- [demo-fe-e2e](../demo-fe-e2e/README.md) - Centralized E2E tests for all demo-fe frontends
- [demo-be-golang-gin](../demo-be-golang-gin/README.md) - Backend API consumed by this frontend
- [specs/apps/demo/fe/gherkin](../../specs/apps/demo/fe/gherkin/) - Gherkin feature files (source of truth)
