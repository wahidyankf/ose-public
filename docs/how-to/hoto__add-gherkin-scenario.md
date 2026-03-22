---
title: How to Add a Gherkin Scenario
description: Step-by-step guide for adding a new Gherkin scenario and implementing step definitions across all test levels
category: how-to
tags:
  - gherkin
  - bdd
  - testing
  - demo-be
  - demo-fe
created: 2026-03-22
updated: 2026-03-22
---

# How to Add a Gherkin Scenario

This guide explains how to add a new Gherkin scenario to the shared specs and implement
step definitions at each test level.

## Overview

Gherkin feature files are shared across all implementations:

- **Backend**: `specs/apps/demo/be/gherkin/` — consumed by all 11 `demo-be-*` backends
- **Frontend**: `specs/apps/demo/fe/gherkin/` — consumed by all 3 `demo-fe-*` frontends

When you add a scenario, every implementation must add step definitions for it.

## Steps (Backend Example)

### 1. Choose or Create a Feature File

Feature files are organized by domain under `specs/apps/demo/be/gherkin/`:

```
gherkin/
├── health/
├── authentication/
├── user-lifecycle/
├── security/
├── token-management/
├── admin/
├── expenses/
└── test-support/
```

Add your scenario to an existing feature file, or create a new one if it represents a
new domain. See [gherkin README](../../specs/apps/demo/be/gherkin/README.md) for conventions.

### 2. Write the Scenario

Follow these conventions:

- **Background step**: `Given the API is running` (backend) or `Given the app is running` (frontend)
- **Step language**: HTTP-semantic for backend (GET, POST, status codes), UI-semantic for frontend (clicks, types, sees)
- **User story**: Every `Feature:` block opens with `As a … / I want … / So that …`

```gherkin
Scenario: User can update their display name
  Given a user "alice" exists with password "P@ssw0rd1"
  And "alice" is logged in
  When the user updates their display name to "Alice Smith"
  Then the response status should be 200
  And the user's display name should be "Alice Smith"
```

### 3. Implement Unit-Level Step Definitions

In each `demo-be-*` backend, add step definitions in the unit test directory.
Steps call service functions directly with **mocked repositories**:

```
apps/demo-be-{lang}-{framework}/
  tests/unit/steps/   (or language-specific equivalent)
```

- No HTTP framework, no database, no Docker
- Use in-memory stores or mocked repositories
- Assert on return values, not HTTP responses

### 4. Implement Integration-Level Step Definitions

Add step definitions in the integration test directory.
Steps call service functions directly with **real PostgreSQL**:

```
apps/demo-be-{lang}-{framework}/
  tests/integration/steps/
```

- Same function calls as unit level, but with real database connection
- **No HTTP calls** — no MockMvc, no TestClient, no httptest
- Database cleanup between scenarios

### 5. E2E Step Definitions

Backend E2E tests live in `apps/demo-be-e2e/`. If your scenario uses new step patterns
not covered by existing step definitions, add them in
`apps/demo-be-e2e/tests/steps/{domain}/`.

E2E steps send real HTTP requests via Playwright.

### 6. Update the Gherkin README

If you added a new feature file or changed the scenario count, update
`specs/apps/demo/be/gherkin/README.md` — this is the
[authoritative source](../../governance/conventions/writing/dynamic-collection-references.md)
for scenario counts.

### 7. Verify

```bash
# Run unit tests for all affected backends
nx affected -t test:unit

# Or test a specific backend
nx run demo-be-golang-gin:test:quick
```

All backends must pass all scenarios. The Gherkin feature files are the single source of
truth — a failing scenario means the backend is non-compliant.

## Frontend Scenarios

The process is identical but uses `specs/apps/demo/fe/gherkin/` and frontend-specific
step definitions:

- **Unit steps**: Component logic tests with mocked API
- **E2E steps**: Playwright browser interactions in `apps/demo-fe-e2e/`

## Related Documentation

- [Backend Gherkin Specs](../../specs/apps/demo/be/gherkin/README.md) — Feature file conventions
- [Frontend Gherkin Specs](../../specs/apps/demo/fe/gherkin/README.md) — Frontend feature conventions
- [Three-Level Testing Standard](../../governance/development/quality/three-level-testing-standard.md) — What's real vs mocked at each level
- [BDD Spec-Test Mapping](../../governance/development/infra/bdd-spec-test-mapping.md) — How specs map to tests
- [BDD Standards](../explanation/software-engineering/development/behavior-driven-development-bdd/README.md) — Gherkin writing standards
