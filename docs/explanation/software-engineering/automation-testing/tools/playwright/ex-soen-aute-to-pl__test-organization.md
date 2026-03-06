---
title: "Playwright Test Organization Standards"
description: Authoritative OSE Platform Playwright test organization standards (structure, naming, grouping, fixtures)
category: explanation
subcategory: automation-testing
tags:
  - playwright
  - testing
  - automation
  - test-organization
  - typescript
  - playwright-1.40
principles:
  - automation-over-manual
  - explicit-over-implicit
  - reproducibility
created: 2026-02-08
updated: 2026-02-08
---

# Playwright Test Organization Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Playwright fundamentals from [AyoKoding Playwright Learning Path](../../../../../../apps/ayokoding-web/content/en/learn/software-engineering/automation-testing/tools/playwright/) before using these standards.

**This document is OSE Platform-specific**, not a Playwright tutorial. We define HOW to organize tests in THIS codebase, not WHAT Playwright test organization is.

**See**: [Programming Language Documentation Separation Convention](../../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative test organization standards** for Playwright end-to-end testing in the OSE Platform. These are prescriptive rules that MUST be followed across all E2E test projects to ensure consistency, maintainability, and alignment with platform architecture.

**Target Audience**: OSE Platform E2E test developers, technical reviewers, automated test quality tools

**Scope**: OSE Platform test structure, naming conventions, fixture patterns, test grouping, and organization best practices

## Software Engineering Principles

These standards enforce the software engineering principles from `governance/principles/software-engineering/`:

### 1. Automation Over Manual

**Principle**: Automate repetitive tasks with tools, scripts, and CI/CD to reduce human error and increase consistency.

**How Playwright Test Organization Implements**:

- `test.describe()` blocks for automated test grouping
- Fixtures for automated setup/teardown
- `beforeEach/afterEach` hooks for automated state management
- Parallel execution for automated test distribution
- `test.skip()` and `test.fixme()` for automated test status management

**PASS Example** (Automated Zakat Test Organization):

```typescript
// tests/e2e/zakat/calculation.spec.ts
import { test, expect } from "@playwright/test";
import { ZakatCalculatorPage } from "../../page-objects/pages/ZakatCalculatorPage";
import { zakatTestData } from "../../fixtures/zakat-test-data";

test.describe("Zakat Calculation", () => {
  // Automated setup - runs before each test
  test.beforeEach(async ({ page }) => {
    const calculatorPage = new ZakatCalculatorPage(page);
    await calculatorPage.goto();
  });

  // Automated grouping by domain concept
  test.describe("Wealth Above Nisab", () => {
    test("calculates 2.5% for gold wealth", async ({ page }) => {
      const calculatorPage = new ZakatCalculatorPage(page);
      await calculatorPage.enterGoldWealth(zakatTestData.goldAboveNisab);

      const result = await calculatorPage.getZakatAmount();
      expect(result).toBe(zakatTestData.expected2Point5Percent);
    });

    test("calculates 2.5% for cash wealth", async ({ page }) => {
      const calculatorPage = new ZakatCalculatorPage(page);
      await calculatorPage.enterCashWealth(zakatTestData.cashAboveNisab);

      const result = await calculatorPage.getZakatAmount();
      expect(result).toBe(zakatTestData.expected2Point5PercentCash);
    });
  });

  test.describe("Wealth Below Nisab", () => {
    test("returns zero zakat for insufficient gold", async ({ page }) => {
      const calculatorPage = new ZakatCalculatorPage(page);
      await calculatorPage.enterGoldWealth(zakatTestData.goldBelowNisab);

      const result = await calculatorPage.getZakatAmount();
      expect(result).toBe("0.00");
    });
  });

  // Automated cleanup - runs after each test
  test.afterEach(async ({ page }) => {
    await page.close();
  });
});
```

**See**: [Automation Over Manual Principle](../../../../../../governance/principles/software-engineering/automation-over-manual.md)

### 2. Explicit Over Implicit

**Principle**: Choose explicit composition and configuration over magic, convenience, and hidden behavior.

**How Playwright Test Organization Implements**:

- Explicit `test.describe()` grouping with clear labels
- Explicit `test.beforeEach()` setup (no hidden global state)
- Explicit fixture dependencies via destructuring
- Explicit test metadata (tags, annotations, slow markers)
- Explicit page object instantiation in tests

**PASS Example** (Explicit Murabaha Contract Test Organization):

```typescript
// tests/e2e/murabaha/contract-creation.spec.ts
import { test, expect } from "@playwright/test";
import { MurabahaContractPage } from "../../page-objects/pages/MurabahaContractPage";
import { AuthFixture } from "../../fixtures/auth-fixture";

// Explicit test metadata
test.describe("Murabaha Contract Creation", () => {
  // Explicit annotation
  test.describe.configure({ mode: "serial" });

  // Explicit fixture dependencies
  test.beforeEach(async ({ page, context }) => {
    // Explicit authentication setup
    const auth = new AuthFixture(page);
    await auth.loginAsContractManager();

    // Explicit navigation
    const contractPage = new MurabahaContractPage(page);
    await contractPage.goto();
  });

  // Explicit test grouping by business rule
  test.describe("Profit Margin Validation", () => {
    // Explicit slow marker for integration test
    test("rejects profit margin above Shariah limit", async ({ page }) => {
      test.slow(); // Explicit slow marker

      const contractPage = new MurabahaContractPage(page);

      // Explicit test data
      await contractPage.enterCostPrice("100000");
      await contractPage.enterProfitMargin("50000"); // 50% - exceeds 30% Shariah limit
      await contractPage.submitContract();

      // Explicit assertion
      await expect(contractPage.errorMessage).toContainText("Profit margin exceeds 30% Shariah compliance limit");
    });

    // Explicit browser context for parallel execution
    test("accepts profit margin within Shariah limit", async ({ page }) => {
      const contractPage = new MurabahaContractPage(page);

      // Explicit test data
      await contractPage.enterCostPrice("100000");
      await contractPage.enterProfitMargin("25000"); // 25% - within 30% limit
      await contractPage.submitContract();

      // Explicit success validation
      await expect(contractPage.successMessage).toContainText("Contract created successfully");
    });
  });
});
```

**See**: [Explicit Over Implicit Principle](../../../../../../governance/principles/software-engineering/explicit-over-implicit.md)

### 3. Reproducibility First

**Principle**: Ensure builds, tests, and deployments are reproducible across environments and time.

**How Playwright Test Organization Implements**:

- `package-lock.json` with exact Playwright version
- `playwright.config.ts` with explicit configuration
- Test fixtures for reproducible test data
- Test isolation via browser contexts
- Deterministic test ordering with `test.describe.serial()`

**PASS Example** (Reproducible Zakat Payment Test):

```typescript
// package.json - Exact Playwright version
{
  "devDependencies": {
    "@playwright/test": "1.40.1"
  }
}

// playwright.config.ts - Explicit reproducible configuration
import { defineConfig } from '@playwright/test';

export default defineConfig({
 testDir: './tests/e2e',
 fullyParallel: false, // Explicit serial execution for reproducibility
 forbidOnly: !!process.env.CI, // No .only() in CI
 retries: process.env.CI ? 2 : 0, // Explicit retry strategy
 workers: 1, // Single worker for deterministic ordering
 reporter: [['html'], ['junit', { outputFile: 'test-results/junit.xml' }]],
 use: {
  baseURL: 'http://localhost:3000',
  trace: 'on-first-retry', // Explicit trace capture
  screenshot: 'only-on-failure',
  video: 'retain-on-failure'
 }
});

// tests/fixtures/zakat-test-data.ts - Reproducible test data
export const zakatTestData = {
 // Fixed test data for reproducibility
 goldAboveNisab: '100.00', // grams
 goldPrice: '65.00', // USD per gram
 nisabGold: '85.00', // grams
 expected2Point5Percent: '162.50' // USD
};

// tests/e2e/zakat/payment.spec.ts - Reproducible test
test.describe('Zakat Payment Flow', () => {
 test.describe.configure({ mode: 'serial' }); // Explicit serial execution

 test('creates zakat payment record', async ({ page }) => {
  const paymentPage = new ZakatPaymentPage(page);
  await paymentPage.goto();

  // Reproducible test data
  await paymentPage.enterAmount(zakatTestData.expected2Point5Percent);
  await paymentPage.selectPaymentMethod('Bank Transfer');
  await paymentPage.submitPayment();

  // Deterministic assertion
  await expect(paymentPage.confirmationMessage).toContainText('Payment submitted');
 });

 test('verifies payment in transaction history', async ({ page }) => {
  // Depends on previous test - serial execution ensures order
  const historyPage = new TransactionHistoryPage(page);
  await historyPage.goto();

  // Reproducible verification
  const lastTransaction = await historyPage.getLastTransaction();
  expect(lastTransaction.amount).toBe(zakatTestData.expected2Point5Percent);
  expect(lastTransaction.type).toBe('Zakat');
 });
});
```

**See**: [Reproducibility Principle](../../../../../../governance/principles/software-engineering/reproducibility.md)

## Test Organization Standards

### Directory Structure

**MUST** follow this structure for all Playwright E2E test projects:

```
apps/[app-name]/
├── tests/
│   ├── e2e/                           # End-to-end test specs
│   │   ├── auth/                      # Domain: Authentication
│   │   │   ├── login.spec.ts
│   │   │   ├── logout.spec.ts
│   │   │   └── password-reset.spec.ts
│   │   ├── zakat/                     # Domain: Zakat (Islamic wealth tax)
│   │   │   ├── calculation.spec.ts
│   │   │   ├── payment.spec.ts
│   │   │   └── history.spec.ts
│   │   ├── murabaha/                  # Domain: Murabaha (Islamic financing)
│   │   │   ├── contract-creation.spec.ts
│   │   │   ├── installment-payment.spec.ts
│   │   │   └── contract-closure.spec.ts
│   │   └── navigation/                # Domain: General navigation
│   │       └── navigation.spec.ts
│   ├── page-objects/                  # Page Object Models
│   │   ├── pages/                     # Full page objects
│   │   │   ├── BasePage.ts
│   │   │   ├── LoginPage.ts
│   │   │   ├── DashboardPage.ts
│   │   │   ├── ZakatCalculatorPage.ts
│   │   │   └── MurabahaContractPage.ts
│   │   └── components/                # Reusable components
│   │       ├── Header.ts
│   │       ├── Sidebar.ts
│   │       └── Modal.ts
│   ├── fixtures/                      # Test fixtures and test data
│   │   ├── auth-fixture.ts
│   │   ├── zakat-test-data.ts
│   │   └── murabaha-test-data.ts
│   └── utils/                         # Test utilities
│       ├── api-helpers.ts
│       ├── db-helpers.ts
│       └── date-helpers.ts
├── playwright.config.ts               # Playwright configuration
└── package.json                       # Dependencies
```

**Rationale**:

- **Domain-based organization**: Tests grouped by Islamic finance domain (zakat, murabaha, waqf)
- **Separation of concerns**: Tests, page objects, fixtures, utils clearly separated
- **Scalability**: Easy to add new domains or expand existing ones

### File Naming Conventions

**MUST** follow these naming patterns:

#### Test Spec Files

**Pattern**: `[feature-name].spec.ts`

**Examples**:

```
✅ CORRECT:
- login.spec.ts
- zakat-calculation.spec.ts
- murabaha-contract-creation.spec.ts
- waqf-donation-history.spec.ts

❌ INCORRECT:
- LoginTest.ts (Use kebab-case, not PascalCase)
- zakatCalc.spec.ts (No abbreviations)
- test-murabaha.ts (Missing .spec suffix)
- MurabahaContractCreation.test.ts (Wrong suffix, wrong case)
```

#### Page Object Files

**Pattern**: `[PageName]Page.ts` (PascalCase with "Page" suffix)

**Examples**:

```
✅ CORRECT:
- LoginPage.ts
- ZakatCalculatorPage.ts
- MurabahaContractPage.ts
- WaqfDonationPage.ts

❌ INCORRECT:
- login-page.ts (Use PascalCase for classes)
- ZakatCalculator.ts (Missing Page suffix)
- murabaha_contract_page.ts (Use PascalCase, not snake_case)
```

#### Fixture Files

**Pattern**: `[fixture-name]-fixture.ts` or `[domain]-test-data.ts`

**Examples**:

```
✅ CORRECT:
- auth-fixture.ts
- zakat-test-data.ts
- murabaha-test-data.ts

❌ INCORRECT:
- AuthFixture.ts (Use kebab-case for fixture files)
- zakatData.ts (Missing -test-data suffix)
```

### Test Grouping with test.describe()

**MUST** use `test.describe()` to group related tests.

**Grouping hierarchy**:

```
Feature (describe)
└── Business Rule (nested describe)
    └── Test Cases (test)
```

**PASS Example**:

```typescript
// tests/e2e/zakat/calculation.spec.ts
import { test, expect } from "@playwright/test";

// Level 1: Feature
test.describe("Zakat Calculation", () => {
  // Level 2: Business Rule
  test.describe("Nisab Threshold Validation", () => {
    // Level 3: Test Case
    test("returns zero when wealth below nisab", async ({ page }) => {
      // Test implementation
    });

    test("calculates 2.5% when wealth equals nisab", async ({ page }) => {
      // Test implementation
    });

    test("calculates 2.5% when wealth above nisab", async ({ page }) => {
      // Test implementation
    });
  });

  // Level 2: Another Business Rule
  test.describe("Gold vs Silver Nisab", () => {
    test("uses gold nisab when both applicable", async ({ page }) => {
      // Test implementation
    });

    test("uses silver nisab when gold not applicable", async ({ page }) => {
      // Test implementation
    });
  });
});
```

**FAIL Example**:

```typescript
// ❌ WRONG: Flat structure without grouping
test("zakat returns zero below nisab", async ({ page }) => {});
test("zakat calculates 2.5% above nisab", async ({ page }) => {});
test("zakat uses gold nisab when applicable", async ({ page }) => {});
test("murabaha profit margin validation", async ({ page }) => {}); // Mixed concerns!
```

**Why it fails**: No logical grouping, unrelated tests mixed together, hard to navigate.

### Setup and Teardown Hooks

**MUST** use hooks for test lifecycle management:

- `test.beforeAll()` - Setup once before all tests in describe block
- `test.beforeEach()` - Setup before each test
- `test.afterEach()` - Cleanup after each test
- `test.afterAll()` - Cleanup once after all tests in describe block

**PASS Example** (Murabaha Contract Tests):

```typescript
import { test, expect } from "@playwright/test";
import { MurabahaContractPage } from "../../page-objects/pages/MurabahaContractPage";
import { AuthFixture } from "../../fixtures/auth-fixture";

test.describe("Murabaha Contract Management", () => {
  let authFixture: AuthFixture;

  // Setup once - authenticate
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    authFixture = new AuthFixture(page);
    await authFixture.loginAsContractManager();
  });

  // Setup before each test - navigate to clean state
  test.beforeEach(async ({ page }) => {
    const contractPage = new MurabahaContractPage(page);
    await contractPage.goto();
  });

  test("creates new contract", async ({ page }) => {
    // Test implementation
  });

  test("updates existing contract", async ({ page }) => {
    // Test implementation
  });

  // Cleanup after each test - clear form state
  test.afterEach(async ({ page }) => {
    const contractPage = new MurabahaContractPage(page);
    await contractPage.clearForm();
  });

  // Cleanup once - logout
  test.afterAll(async ({ browser }) => {
    await authFixture.logout();
    await browser.close();
  });
});
```

**FAIL Example**:

```typescript
// ❌ WRONG: Manual setup/cleanup in each test
test("creates new contract", async ({ page }) => {
  // Manual setup - duplicated across tests
  const auth = new AuthFixture(page);
  await auth.loginAsContractManager();
  const contractPage = new MurabahaContractPage(page);
  await contractPage.goto();

  // Test logic

  // Manual cleanup - duplicated across tests
  await contractPage.clearForm();
  await auth.logout();
});

test("updates existing contract", async ({ page }) => {
  // Same setup/cleanup duplicated! ❌
  const auth = new AuthFixture(page);
  await auth.loginAsContractManager();
  // ...
});
```

**Why it fails**: Duplicated setup/cleanup code, violates DRY principle, error-prone.

### Test Fixtures

**SHOULD** use fixtures for reusable test dependencies.

**Custom fixture pattern**:

```typescript
// tests/fixtures/auth-fixture.ts
import { test as base, Page } from "@playwright/test";
import { LoginPage } from "../page-objects/pages/LoginPage";

// Define fixture type
export type AuthFixture = {
  authenticatedPage: Page;
  contractManagerPage: Page;
  auditorPage: Page;
};

// Extend base test with custom fixtures
export const test = base.extend<AuthFixture>({
  // Fixture: Authenticated regular user
  authenticatedPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login("user@example.com", "password123");
    await use(page);
    await loginPage.logout();
  },

  // Fixture: Contract manager user
  contractManagerPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login("manager@example.com", "manager123");
    await use(page);
    await loginPage.logout();
  },

  // Fixture: Auditor user
  auditorPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login("auditor@example.com", "auditor123");
    await use(page);
    await loginPage.logout();
  },
});

export { expect } from "@playwright/test";
```

**Using fixtures in tests**:

```typescript
// tests/e2e/murabaha/contract-creation.spec.ts
import { test, expect } from "../../fixtures/auth-fixture";
import { MurabahaContractPage } from "../../page-objects/pages/MurabahaContractPage";

test.describe("Murabaha Contract Creation", () => {
  // Use custom fixture - automatic authentication + cleanup
  test("contract manager can create contract", async ({ contractManagerPage }) => {
    const contractPage = new MurabahaContractPage(contractManagerPage);
    await contractPage.goto();
    await contractPage.createContract({
      costPrice: "100000",
      profitMargin: "25000",
    });

    await expect(contractPage.successMessage).toBeVisible();
  });

  // Different fixture - different user role
  test("auditor cannot create contract", async ({ auditorPage }) => {
    const contractPage = new MurabahaContractPage(auditorPage);
    await contractPage.goto();

    // Create button should not be visible for auditor
    await expect(contractPage.createButton).not.toBeVisible();
  });
});
```

### Serial vs Parallel Execution

**SHOULD** use parallel execution by default for isolated tests.

**MUST** use serial execution for interdependent tests.

**Parallel execution (default)**:

```typescript
// Tests run in parallel - fully isolated
test.describe("Zakat Calculation", () => {
  test("calculates for gold", async ({ page }) => {
    // Independent test
  });

  test("calculates for silver", async ({ page }) => {
    // Independent test
  });

  test("calculates for cash", async ({ page }) => {
    // Independent test
  });
});
```

**Serial execution**:

```typescript
// Tests run serially - share state
test.describe("Murabaha Contract Lifecycle", () => {
  test.describe.configure({ mode: "serial" }); // Explicit serial mode

  let contractId: string;

  test("creates contract", async ({ page }) => {
    // Creates contract
    contractId = await createContract(page);
  });

  test("activates contract", async ({ page }) => {
    // Uses contractId from previous test
    await activateContract(page, contractId);
  });

  test("closes contract", async ({ page }) => {
    // Uses contractId from previous tests
    await closeContract(page, contractId);
  });
});
```

### Test Metadata and Annotations

**SHOULD** use annotations for test metadata.

**Available annotations**:

- `test.skip()` - Skip test
- `test.fixme()` - Mark as broken (CI fails if run)
- `test.slow()` - Increase timeout 3x
- `test.fail()` - Expect test to fail
- `test.only()` - Run only this test (FORBIDDEN in CI)

**PASS Example**:

```typescript
test.describe("Murabaha Contract Validation", () => {
  // Skip test conditionally
  test.skip(({ browserName }) => browserName === "webkit", "Safari has rendering bug #1234")(
    "validates profit margin format",
    async ({ page }) => {
      // Test implementation
    },
  );

  // Mark as broken
  test.fixme("handles negative profit margin", async ({ page }) => {
    // Known bug - fails in CI
  });

  // Mark as slow
  test("generates comprehensive audit report", async ({ page }) => {
    test.slow(); // Increase timeout 3x

    // Long-running report generation
  });

  // Expect failure (temporary workaround)
  test("handles server timeout gracefully", async ({ page }) => {
    test.fail(); // Known issue - fails but doesn't block CI

    // Will fail - expected behavior
  });
});
```

**FAIL Example**:

```typescript
// ❌ WRONG: Using test.only() in committed code
test.only("creates contract", async ({ page }) => {
  // This is FORBIDDEN - only() must not be committed
  // CI should fail if .only() detected
});
```

## Best Practices

### 1. One Feature Per File

**MUST** keep one feature per spec file.

**PASS**:

```
✅ tests/e2e/zakat/calculation.spec.ts     - Only zakat calculation
✅ tests/e2e/zakat/payment.spec.ts         - Only zakat payment
✅ tests/e2e/murabaha/contract.spec.ts     - Only murabaha contracts
```

**FAIL**:

```
❌ tests/e2e/islamic-finance.spec.ts       - Mixed: zakat, murabaha, waqf (too broad!)
```

### 2. Clear Test Names

**MUST** use descriptive test names following Given-When-Then pattern.

**PASS**:

```typescript
test("returns zero zakat when wealth below nisab", async ({ page }) => {});
test("calculates 2.5% zakat when wealth above nisab", async ({ page }) => {});
test("rejects profit margin above 30% Shariah limit", async ({ page }) => {});
```

**FAIL**:

```typescript
test("test1", async ({ page }) => {}); // ❌ Non-descriptive
test("zakat", async ({ page }) => {}); // ❌ Too vague
test("it works", async ({ page }) => {}); // ❌ Meaningless
```

### 3. Isolated Tests

**MUST** ensure tests are independent and can run in any order.

**PASS**:

```typescript
test.describe("Zakat Payment", () => {
  test.beforeEach(async ({ page }) => {
    // Each test starts with fresh state
    await createTestZakatRecord(page);
  });

  test("submits payment", async ({ page }) => {
    // Independent - doesn't depend on other tests
  });

  test("cancels payment", async ({ page }) => {
    // Independent - doesn't depend on other tests
  });

  test.afterEach(async ({ page }) => {
    // Each test cleans up
    await deleteTestZakatRecord(page);
  });
});
```

**FAIL**:

```typescript
test.describe("Zakat Payment", () => {
  // ❌ WRONG: Tests share state
  let paymentId: string;

  test("creates payment", async ({ page }) => {
    paymentId = await createPayment(page); // Sets shared state
  });

  test("submits payment", async ({ page }) => {
    await submitPayment(page, paymentId); // Depends on previous test! ❌
  });
});
```

### 4. Test Data Management

**SHOULD** use fixture files for test data.

**PASS**:

```typescript
// tests/fixtures/zakat-test-data.ts
export const zakatTestData = {
  goldAboveNisab: {
    weight: "100.00",
    price: "65.00",
    expectedZakat: "162.50",
  },
  goldBelowNisab: {
    weight: "50.00",
    price: "65.00",
    expectedZakat: "0.00",
  },
};

// tests/e2e/zakat/calculation.spec.ts
import { zakatTestData } from "../../fixtures/zakat-test-data";

test("calculates zakat for gold above nisab", async ({ page }) => {
  const data = zakatTestData.goldAboveNisab;
  // Use test data
});
```

## Related Documentation

**Core Playwright Documentation**:

- [Playwright Framework Index](README.md) - Overview and related documentation
- [Playwright Idioms](ex-soen-aute-to-pl__idioms.md) - Framework-specific patterns
- [Playwright Best Practices](ex-soen-aute-to-pl__best-practices.md) - Production standards
- [Playwright Anti-Patterns](ex-soen-aute-to-pl__anti-patterns.md) - Common mistakes to avoid

**Software Engineering Principles**:

- [Automation Over Manual](../../../../../../governance/principles/software-engineering/automation-over-manual.md)
- [Explicit Over Implicit](../../../../../../governance/principles/software-engineering/explicit-over-implicit.md)
- [Reproducibility](../../../../../../governance/principles/software-engineering/reproducibility.md)

---

**Maintainers**: Platform Documentation Team
**Last Updated**: 2026-02-08
**Playwright Version**: Playwright 1.40+ (TypeScript, Node.js 18+)
