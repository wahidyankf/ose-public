---
name: swe-developing-e2e-test-with-playwright
description: Playwright E2E testing standards from authoritative docs/explanation/software-engineering/automation-testing/tools/playwright/ documentation
---

# Playwright E2E Testing Standards

## Purpose

Progressive disclosure of Playwright end-to-end testing standards for agents writing E2E tests.

**Authoritative Source**: [docs/explanation/software-engineering/automation-testing/tools/playwright/README.md](../../../docs/explanation/software-engineering/automation-testing/tools/playwright/README.md)

**Usage**: Auto-loaded for agents when writing Playwright E2E tests. Provides quick reference to test organization, selectors, assertions, page objects, and debugging patterns.

## Quick Standards Reference

### Test Organization

**File Structure**: Group tests by feature or page

```
tests/
├── e2e/
│   ├── auth/
│   │   ├── login.spec.ts
│   │   └── register.spec.ts
│   ├── payments/
│   │   ├── murabaha.spec.ts
│   │   └── zakat.spec.ts
│   └── navigation.spec.ts
├── page-objects/
│   ├── pages/
│   │   ├── LoginPage.ts
│   │   └── DashboardPage.ts
│   └── components/
│       ├── Header.ts
│       └── Sidebar.ts
└── fixtures/
    └── test-data.ts
```

**Naming Conventions**:

- Test files: `*.spec.ts` (e.g., `login.spec.ts`)
- Page objects: `PascalCase` (e.g., `LoginPage.ts`)
- Test descriptions: Behavior-focused (e.g., "successful login redirects to dashboard")

### Selectors (Accessibility-First)

**Priority Order**: Role → Label → Text → TestID → CSS

```typescript
// ✅ PASS: Accessibility-first selectors
page.getByRole("button", { name: "Submit" }); // Priority 1: Role
page.getByLabel("Email"); // Priority 2: Label
page.getByText("Welcome"); // Priority 3: Text
page.getByTestId("submit-button"); // Priority 4: TestID
page.locator("css=.button"); // Priority 5: CSS (last resort)
```

**Avoid**:

- Overly specific CSS selectors
- XPath unless necessary
- Element IDs that change frequently
- Position-based selectors

### Assertions (Web-First)

**Auto-Waiting Assertions**: Use web-first assertions with automatic retries

```typescript
// ✅ PASS: Web-first assertions (auto-wait)
await expect(page).toHaveTitle("Dashboard");
await expect(page.getByRole("heading")).toContainText("Welcome");
await expect(page.getByLabel("Email")).toBeVisible();
await expect(page.getByTestId("status")).toHaveText("Success");

// ❌ FAIL: Generic assertions (no auto-wait)
const text = await page.getByRole("heading").textContent();
expect(text).toBe("Welcome"); // No retry, flaky
```

**Assertion Types**:

- Visibility: `toBeVisible()`, `toBeHidden()`
- Text: `toHaveText()`, `toContainText()`
- Values: `toHaveValue()`, `toHaveAttribute()`
- States: `toBeEnabled()`, `toBeDisabled()`, `toBeChecked()`
- URL: `toHaveURL()`, URL patterns with regex

### Page Object Model

**Class-Based Pattern**: Encapsulate page locators and actions

```typescript
// ✅ PASS: Page Object Model
import { Page, Locator } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByRole("textbox", { name: "Email" });
    this.passwordInput = page.getByRole("textbox", { name: "Password" });
    this.submitButton = page.getByRole("button", { name: "Sign in" });
  }

  async goto() {
    await this.page.goto("/login");
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
```

**Usage in Tests**:

```typescript
test("successful login", async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login("user@example.com", "password123");
  await expect(page).toHaveURL("/dashboard");
});
```

### Configuration Standards

**playwright.config.ts**: Environment-specific settings

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["html"], ["junit"]] : "html",
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
});
```

### Best Practices

**Test Isolation**: Each test independent

```typescript
// ✅ PASS: Test isolation with beforeEach
test.describe("User Management", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/users");
    await page.getByRole("button", { name: "Add User" }).click();
  });

  test("creates new user", async ({ page }) => {
    // Fresh state from beforeEach
    await page.getByLabel("Name").fill("John Doe");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("User created")).toBeVisible();
  });
});
```

**API Testing Integration**: Combine UI and API

```typescript
test("user sees their data after login", async ({ page, request }) => {
  // API setup
  const response = await request.post("/api/users", {
    data: { name: "Test User", email: "test@example.com" },
  });
  const userId = (await response.json()).id;

  // UI verification
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login("test@example.com", "password");
  await expect(page.getByText("Test User")).toBeVisible();

  // API cleanup
  await request.delete(`/api/users/${userId}`);
});
```

### Anti-Patterns to Avoid

**❌ Manual Waits**:

```typescript
// ❌ FAIL: Manual waits
await page.click("button");
await page.waitForTimeout(2000); // Arbitrary wait, flaky

// ✅ PASS: Auto-waiting
await page.click("button");
await expect(page.getByText("Success")).toBeVisible(); // Auto-retries
```

**❌ Overly Specific Selectors**:

```typescript
// ❌ FAIL: Fragile CSS selector
await page.locator("div.container > div:nth-child(2) > button.primary").click();

// ✅ PASS: Semantic selector
await page.getByRole("button", { name: "Submit" }).click();
```

**❌ Test Interdependence**:

```typescript
// ❌ FAIL: Tests depend on execution order
test("1. create user", async ({ page }) => {
  // Creates user, stores in global state
});

test("2. edit user", async ({ page }) => {
  // Depends on user from test 1
});

// ✅ PASS: Independent tests
test.describe("User Management", () => {
  test.beforeEach(async ({ request }) => {
    // Each test creates its own user
    await request.post("/api/users", { data: testUser });
  });

  test("creates user", async ({ page }) => {
    // Independent
  });

  test("edits user", async ({ page }) => {
    // Independent
  });
});
```

### Debugging Tools

**Trace Viewer**: Post-failure debugging

```bash
# Show trace for failed tests
npx playwright show-trace trace.zip
```

**Inspector**: Step-through debugging

```bash
# Debug specific test
npx playwright test login.spec.ts --debug
```

**Headed Mode**: Visual debugging

```typescript
// playwright.config.ts
use: {
  headless: false, // Show browser
  slowMo: 500, // Slow down actions
},
```

## OSE Platform Context

### Islamic Finance Testing

**Zakat Calculator Tests**:

```typescript
test("calculates zakat correctly", async ({ page }) => {
  await page.goto("/zakat-calculator");
  await page.getByLabel("Wealth Amount").fill("100000");
  await page.getByRole("button", { name: "Calculate" }).click();

  // Verify 2.5% calculation
  await expect(page.getByTestId("zakat-amount")).toHaveText("RM 2,500.00");
});
```

**Murabaha Contract Tests**:

```typescript
test("murabaha contract workflow", async ({ page }) => {
  const murabaha = new MurabahaPage(page);
  await murabaha.goto();
  await murabaha.createContract({
    asset: "Vehicle",
    cost: 50000,
    profitRate: 5,
  });

  await expect(page.getByText("Contract Created")).toBeVisible();
  await expect(page.getByTestId("total-payment")).toContainText("52,500");
});
```

## Test-Driven Development for E2E

TDD applies to E2E test authoring: write the failing Playwright spec — or a failing Playwright-MCP
manual verification script — **before** the feature implementation exists. Both forms follow
Red→Green→Refactor:

- **Red**: Author the `.spec.ts` or manual verification script and run it. It must fail because the
  feature does not yet exist, not because of a misconfigured test environment.
- **Green**: The feature implementation makes every Playwright assertion or manual observation pass.
- **Refactor**: Improve locators, page objects, and fixture composition while keeping all assertions
  green.

Manual verification scripts are TDD-compliant when they are written, dated, repeatable, and contain
discrete expected observations (e.g., "Navigate to /products → snapshot shows product list with 3
items"). Informal "tested manually" notes are not TDD-compliant. Promote manual scripts to
automated Playwright specs whenever the behavior recurs.

**Canonical references**:

- [Test-Driven Development Convention](../../../governance/development/workflow/test-driven-development.md)
  — full Red→Green→Refactor rules, "Manual verification is part of TDD" subsection, and all test
  levels covered.
- [Manual Behavioral Verification](../../../governance/development/quality/manual-behavioral-verification.md)
  — Playwright MCP tool list, verification checklists, and `curl` for API verification.

## Related Standards

**See Authoritative Documentation**:

- [Test Organization](../../../docs/explanation/software-engineering/automation-testing/tools/playwright/test-organization.md) - Test structure, fixtures, grouping
- [Selectors](../../../docs/explanation/software-engineering/automation-testing/tools/playwright/selectors.md) - Accessibility-first selector strategies
- [Assertions](../../../docs/explanation/software-engineering/automation-testing/tools/playwright/assertions.md) - Web-first assertions
- [Page Objects](../../../docs/explanation/software-engineering/automation-testing/tools/playwright/page-objects.md) - Page Object Model patterns
- [Configuration](../../../docs/explanation/software-engineering/automation-testing/tools/playwright/configuration.md) - playwright.config.ts setup
- [Best Practices](../../../docs/explanation/software-engineering/automation-testing/tools/playwright/best-practices.md) - Production testing standards
- [Anti-Patterns](../../../docs/explanation/software-engineering/automation-testing/tools/playwright/anti-patterns.md) - Common mistakes
- [Idioms](../../../docs/explanation/software-engineering/automation-testing/tools/playwright/idioms.md) - Playwright-specific patterns
- [Debugging](../../../docs/explanation/software-engineering/automation-testing/tools/playwright/debugging.md) - Trace viewer, inspector
