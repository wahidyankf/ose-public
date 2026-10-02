---
description: Mapping canonical Gherkin scenarios to owner-local Vitest Cucumber Unit and Playwright BDD E2E bindings.
when_to_use: Use when wiring a canonical scenario to the repository's current TypeScript or F# test adapters.
---

# Integration with Test Automation

Follow the [canonical BDD contract](../../behaviour-driven-development.md): features live only in
the owner's recursively discovered `specs/apps/**/behaviours/` or `specs/libs/**/behaviours/`
corpus. Every active scenario has a Unit binding; add Integration and E2E bindings only when their
real boundaries apply.

## TypeScript Unit Binding

Use `@amiceli/vitest-cucumber` in the owner's `test:unit` suite. Replace database, filesystem,
environment, clock, process, and network dependencies with injected doubles.

```gherkin
# specs/apps/example/web/behaviours/auth/login.feature
Scenario: User login with valid credentials
  Given a user with email "user@example.com"
  When the user logs in with correct password
  Then the user should be authenticated
```

```typescript
// apps/example-web/tests/unit/steps/login.steps.ts
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";

const feature = await loadFeature("specs/apps/example/web/behaviours/auth/login.feature");

describeFeature(feature, ({ Scenario }) => {
  Scenario("User login with valid credentials", ({ Given, When, Then }) => {
    const users = new InMemoryUserRepository(); // Unit double
    const service = new LoginService({ users });
    let authenticated = false;

    Given('a user with email "user@example.com"', async () => {
      await users.add({ email: "user@example.com", password: "correct password" });
    });
    When("the user logs in with correct password", async () => {
      authenticated = await service.login("user@example.com", "correct password");
    });
    Then("the user should be authenticated", () => {
      expect(authenticated).toBe(true);
    });
  });
});
```

## TypeScript E2E Binding

Use `playwright-bdd` in the dedicated E2E project. `playwright.config.ts` discovers the owner's
canonical corpus with `defineBddConfig`; step files use `createBdd()` and exercise the real public
browser or HTTP boundary with synthetic isolated identities.

```typescript
// apps/example-web-e2e/steps/login.steps.ts
import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";

const { Given, When, Then } = createBdd();

Given('a user with email "user@example.com"', async ({ page }) => {
  await page.goto("/test-fixtures/users/user@example.com");
});
When("the user logs in with correct password", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("user@example.com");
  await page.getByLabel("Password").fill("correct password");
  await page.getByRole("button", { name: "Log in" }).click();
});
Then("the user should be authenticated", async ({ page }) => {
  await expect(page).toHaveURL("/dashboard");
});
```

## F\#

F# suites use their owner-local scenario-name/step mapping through the native test harness. Unit
bindings inject doubles. Integration may use a real isolated socket-free resource such as a
temporary file or embedded database; public process or HTTP proof belongs to E2E.

## Adding a Language

Only wire an adapter this repository actually builds. Adding a new binding syntax also means
teaching the owner-local static `test:coverage:*` validators to recognise it; otherwise scenarios
correctly read as uncovered. Run the
[Gherkin implementation review](../../../workflows/quality/gherkin-implementation-review.md) after a
material feature, adapter, exemption, or coverage-mechanism change.
