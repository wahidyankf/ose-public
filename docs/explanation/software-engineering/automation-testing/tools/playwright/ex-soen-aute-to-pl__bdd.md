---
title: "Playwright BDD Integration (playwright-bdd)"
description: OSE Platform standards for playwright-bdd — driving Playwright tests from Gherkin feature files
category: explanation
subcategory: automation-testing
tags:
  - playwright
  - bdd
  - gherkin
  - playwright-bdd
  - typescript
  - api-testing
principles:
  - documentation-first
  - explicit-over-implicit
  - automation-over-manual
created: 2026-03-04
updated: 2026-03-04
---

# Playwright BDD Integration (playwright-bdd)

**This is the authoritative OSE Platform reference** for using playwright-bdd to drive Playwright
tests from Gherkin feature files.

## Prerequisite Knowledge

**REQUIRED before using this document:**

- **[BDD Standards](../../../development/behavior-driven-development-bdd/README.md)** — OSE
  Platform BDD requirements, Three Amigos process, framework requirements per language
- **[Playwright Framework](README.md)** — Playwright standards, configuration, and test
  organization patterns in this codebase

Both are required. This document assumes you understand Gherkin syntax and Playwright fixtures.

## When to Use playwright-bdd

**Use playwright-bdd when:**

- Acceptance tests are defined in `specs/` as Gherkin feature files
- The test suite targets REST APIs or web flows that need BDD-style scenarios
- The feature file is owned by Three Amigos (business + development + QA)

**Use vanilla Playwright spec files when:**

- The tests are exploratory or developer-internal (no business-facing feature file)
- The scenario is not backed by a `specs/` feature file
- You are writing low-level component or technical regression tests

## Architecture Overview

```
specs/**/*.feature
       │
       ▼ npx bddgen
.features-gen/**/*.spec.ts   (generated — do not edit)
       │
       ▼ npx playwright test
tests/steps/**/*.ts          (your step definitions)
```

1. `bddgen` reads every `.feature` file and generates a matching `.spec.ts` in `.features-gen/`
2. Playwright executes the generated spec files
3. Generated specs call into your step definitions via the step registry built by `createBdd()`

## Package Setup

Add `playwright-bdd` to `devDependencies` in the E2E project's `package.json`:

```json
{
  "devDependencies": {
    "playwright-bdd": "^8.0.0"
  }
}
```

## Configuration

Replace the standard `testDir` string with `defineBddConfig()`:

```typescript
import { defineConfig } from "@playwright/test";
import { defineBddConfig } from "playwright-bdd";

const testDir = defineBddConfig({
  featuresRoot: "../../specs/apps/organiclever-be",
  features: "../../specs/apps/organiclever-be/**/*.feature",
  steps: "./tests/steps/**/*.ts",
});

export default defineConfig({
  testDir, // ← returned by defineBddConfig
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html"], ["junit", { outputFile: "test-results/junit.xml" }]],
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:8201",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  // No projects array needed for API-only suites
});
```

**See**: [Configuration Standards](ex-soen-aute-to-pl__configuration.md) for the full BDD config
section and the canonical file at `apps/organiclever-be-e2e/playwright.config.ts`.

## Step Definition Patterns

### createBdd() setup

Import `createBdd` and destructure only the keywords you need:

```typescript
import { createBdd } from "playwright-bdd";

const { Given, When, Then } = createBdd();
```

### Fixture parameter: always use `{}`

The first argument of every step function is the Playwright fixtures object. **Always destructure
it as `{}`** — even when empty.

`bddgen` statically inspects the first parameter to determine which Playwright fixtures to inject.
Using `_` (an ignored parameter) breaks generation because bddgen cannot infer the fixture
bindings.

```typescript
// CORRECT — bddgen can inspect {} to determine fixture needs
// oxlint-disable-next-line no-empty-pattern
Then("the response status code should be {int}", async ({}, code: number) => {
  expect(getResponse().status()).toBe(code);
});

// CORRECT — destructure named fixtures when you need them
When(/^a client sends GET \/api\/v1\/hello$/, async ({ request }) => {
  setResponse(await request.get("/api/v1/hello"));
});

// WRONG — bddgen cannot infer fixtures from _
Then("the response status code should be {int}", async (_, code: number) => {
  /* ... */
});
```

The `// oxlint-disable-next-line no-empty-pattern` comment is required when the destructuring
pattern is empty (`{}`).

### Cucumber expressions vs regex for URL paths

Step text containing `/` **must use regex patterns**. The `/` character is the Cucumber Expression
alternation operator and causes "Alternative may not be empty" errors when used in step strings.

```typescript
// CORRECT — regex escapes the URL path slashes
When(/^a client sends GET \/api\/v1\/hello$/, async ({ request }) => {
  setResponse(await request.get("/api/v1/hello"));
});

When(/^an operations engineer sends GET \/health$/, async ({ request }) => {
  setResponse(await request.get("/health"));
});

// WRONG — Cucumber expression parser splits on / and produces empty alternatives
When("a client sends GET /api/v1/hello", async ({ request }) => {
  /* ... */
});
```

**Rule**: Any step text containing a URL path (e.g., `/api/v1/hello`, `/health`) must be
a regex literal (`/^…$/`).

### Typed parameters: {string}, {int}, and (.+)

Use Cucumber expression parameter types when the feature file **quotes** the value:

```typescript
// Feature file: Then the health status should be "UP"
Then("the health status should be {string}", async ({}, status: string) => {
  /* ... */
});

// Feature file: Then the response status code should be 200
Then("the response status code should be {int}", async ({}, code: number) => {
  /* ... */
});
```

When the feature file omits quotes, use a regex capture group `(.+)`:

```typescript
// Feature file: When a client sends GET /api/v1/hello with an Origin header of http://localhost:3200
When(/^a client sends GET \/api\/v1\/hello with an Origin header of (.+)$/, async ({ request }, origin: string) => {
  /* ... */
});
```

## Shared State Pattern

For API tests, use a **module-level response store** to pass `APIResponse` from `When` steps to
`Then` steps. This is safe because scenarios run sequentially per worker and all requests are
read-only.

```typescript
// tests/utils/response-store.ts
import type { APIResponse } from "@playwright/test";

let response: APIResponse | null = null;

export function setResponse(r: APIResponse): void {
  response = r;
}

export function getResponse(): APIResponse {
  if (!response) {
    throw new Error("No response stored. A When step must run before Then steps.");
  }
  return response;
}

export function clearResponse(): void {
  response = null;
}
```

Import and use in step definitions:

```typescript
import { setResponse, getResponse } from "../../utils/response-store";

When(/^a client sends GET \/api\/v1\/hello$/, async ({ request }) => {
  setResponse(await request.get("/api/v1/hello"));
});

Then(/^the response body should be \{"message":"world!"\}$/, async () => {
  const body = await getResponse().json();
  expect(body.message).toBe("world!");
});
```

**See**: `apps/organiclever-be-e2e/tests/utils/response-store.ts` for the canonical implementation.

## Nx Integration

The `test:e2e` target in `project.json` must run `bddgen` before `playwright test`:

```json
{
  "targets": {
    "test:e2e": {
      "executor": "nx:run-commands",
      "options": {
        "command": "npx bddgen && npx playwright test",
        "cwd": "apps/organiclever-be-e2e"
      }
    },
    "test:e2e:ui": {
      "executor": "nx:run-commands",
      "options": {
        "command": "npx bddgen && npx playwright test --ui",
        "cwd": "apps/organiclever-be-e2e"
      }
    }
  }
}
```

**See**: `apps/organiclever-be-e2e/project.json` for the canonical example.

## Generated Files

`.features-gen/` contains the spec files generated by `bddgen`. It is listed in `.gitignore` and
**must not be edited manually** — changes will be overwritten on the next `bddgen` run.

```
apps/organiclever-be-e2e/
└── .features-gen/     # gitignored — regenerated on every bddgen run
    └── **/*.spec.ts   # do not edit
```

Always regenerate before running tests:

```bash
npx bddgen && npx playwright test
```

## Related Documentation

- **[BDD Standards](../../../development/behavior-driven-development-bdd/README.md)** — Framework
  requirements, Three Amigos process, coverage rules
- **[specs/apps/organiclever-be/](../../../../../../specs/apps/organiclever-be/README.md)** — Feature files
  and their organization
- **[Configuration Standards](ex-soen-aute-to-pl__configuration.md)** — playwright.config.ts
  patterns including the BDD configuration section
- **[Playwright Framework Index](README.md)** — Playwright standards overview
- **[apps/organiclever-be-e2e/README.md](../../../../../../apps/organiclever-be-e2e/README.md)** —
  E2E test project README

---

**Last Updated**: 2026-03-04
