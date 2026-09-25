# Playwright — Best Practices, Anti-Patterns, Debugging

## Best Practices

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

## Anti-Patterns to Avoid

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

## Debugging Tools

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
