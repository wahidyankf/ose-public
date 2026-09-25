# Playwright — Test Organization, Selectors, Assertions

## Test Organization

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
- Test descriptions: Behaviour-focused (e.g., "successful login redirects to dashboard")

## Selectors (Accessibility-First)

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

## Assertions (Web-First)

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
