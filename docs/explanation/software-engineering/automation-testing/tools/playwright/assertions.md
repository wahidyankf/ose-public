---
title: "Playwright Assertion Standards"
description: Authoritative OSE Platform Playwright assertion standards (web-first assertions, auto-waiting, assertion patterns)
category: explanation
subcategory: automation-testing
tags:
  - playwright
  - testing
  - assertions
  - expect
  - auto-waiting
  - typescript
  - playwright-1.40
principles:
  - automation-over-manual
  - explicit-over-implicit
  - reproducibility
created: 2026-02-08
---

# Playwright Assertion Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Playwright fundamentals from [AyoKoding Playwright Learning Path](../../../../../../apps/ayokoding-web/content/en/learn/software-engineering/automation-testing/tools/playwright/) before using these standards.

**This document is OSE Platform-specific**, not a Playwright tutorial. We define HOW to write assertions in THIS codebase, not WHAT Playwright assertions are.

**See**: [Programming Language Documentation Separation Convention](../../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative assertion standards** for Playwright end-to-end testing in the OSE Platform. These are prescriptive rules that MUST be followed to ensure reliable, maintainable, and expressive test assertions.

**Target Audience**: OSE Platform E2E test developers, technical reviewers, automated test quality tools

**Scope**: OSE Platform assertion patterns, web-first assertions, auto-waiting behavior, and assertion best practices

## Software Engineering Principles

### 1. Automation Over Manual

**Principle**: Automate repetitive tasks with tools, scripts, and CI/CD to reduce human error and increase consistency.

**How Playwright Assertions Implement**:

- Auto-waiting assertions retry automatically until timeout
- `expect().toPass()` for automatic retry of flaky assertions
- `expect().poll()` for polling-based assertions
- Soft assertions for collecting multiple failures without stopping test
- Built-in assertion messages reduce manual error reporting

**PASS Example** (Automated Zakat Calculation Verification):

```typescript
// tests/e2e/zakat/calculation.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Zakat Calculation Auto-Verification", () => {
  test("automatically retries until calculation completes", async ({ page }) => {
    await page.goto("/zakat/calculator");

    // Auto-waiting form fill
    await page.getByRole("textbox", { name: "Wealth Amount" }).fill("10000");
    await page.getByRole("button", { name: "Calculate Zakat" }).click();

    // ✅ CORRECT: Auto-waiting assertion retries until element appears
    await expect(page.getByText("Zakat Amount: $250.00")).toBeVisible();

    // ✅ Automatic retry for dynamic content
    const result = page.getByRole("heading", { name: "Result" });
    await expect(result).toContainText("$250.00");
  });

  test("uses toPass for complex validation", async ({ page }) => {
    await page.goto("/zakat/calculator");

    // ✅ CORRECT: toPass retries entire assertion block
    await expect(async () => {
      const calculationStatus = page.getByTestId("calculation-status");
      await expect(calculationStatus).toHaveText("Complete");

      const zakatAmount = page.getByTestId("zakat-amount");
      await expect(zakatAmount).toContainText("$250.00");
    }).toPass({
      timeout: 5000,
      intervals: [100, 250, 500],
    });
  });

  test("collects multiple validation failures with soft assertions", async ({ page }) => {
    await page.goto("/zakat/calculator/validation");

    // ✅ Soft assertions - collect all failures
    await expect.soft(page.getByLabel("Gold Weight")).toHaveValue("100");
    await expect.soft(page.getByLabel("Gold Price")).toHaveValue("65");
    await expect.soft(page.getByLabel("Nisab Threshold")).toHaveValue("85");

    // Test continues even if soft assertions fail
    // All failures reported at end
  });
});
```

**See**: [Automation Over Manual Principle](../../../../../../governance/principles/software-engineering/automation-over-manual.md)

### 2. Explicit Over Implicit

**Principle**: Choose explicit composition and configuration over magic, convenience, and hidden behavior.

**How Playwright Assertions Implement**:

- Explicit assertion matchers (`toBeVisible()` vs generic `toBe()`)
- Explicit timeout configuration per assertion
- Explicit negation with `.not`
- Explicit soft assertions with `expect.soft()`
- Explicit assertion messages

**PASS Example** (Explicit Murabaha Contract Assertions):

```typescript
// tests/e2e/murabaha/contract-validation.spec.ts
test("validates Murabaha profit margin explicitly", async ({ page }) => {
  await page.goto("/murabaha/create-contract");

  // ✅ CORRECT: Explicit input validation
  const profitMarginInput = page.getByRole("textbox", { name: "Profit Margin" });
  await profitMarginInput.fill("50");

  // ✅ Explicit error message assertion
  const errorAlert = page.getByRole("alert");
  await expect(errorAlert).toBeVisible();
  await expect(errorAlert).toContainText("Profit margin exceeds 30% Shariah limit");

  // ✅ Explicit button state assertion
  const submitButton = page.getByRole("button", { name: "Create Contract" });
  await expect(submitButton).toBeDisabled();

  // ✅ Explicit negation - not visible
  const successMessage = page.getByRole("status");
  await expect(successMessage).not.toBeVisible();

  // ✅ Explicit timeout override
  await expect(errorAlert).toBeVisible({ timeout: 10000 });

  // ✅ Explicit custom message
  await expect(profitMarginInput).toHaveValue("50", {
    message: "Profit margin input should retain invalid value for user correction",
  });
});
```

**See**: [Explicit Over Implicit Principle](../../../../../../governance/principles/software-engineering/explicit-over-implicit.md)

### 3. Reproducibility First

**Principle**: Ensure builds, tests, and deployments are reproducible across environments and time.

**How Playwright Assertions Implement**:

- Deterministic assertion behavior (no random timeouts)
- Consistent auto-waiting across environments
- Exact value matching for reproducibility
- Snapshot assertions for consistent UI validation
- Explicit timeout configuration ensures reproducible behavior

**PASS Example** (Reproducible Zakat Payment Assertions):

```typescript
// tests/e2e/zakat/payment-reproducibility.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Zakat Payment Reproducible Assertions", () => {
  test("verifies exact payment amounts reproducibly", async ({ page }) => {
    await page.goto("/zakat/payment");

    // ✅ CORRECT: Exact value assertions for reproducibility
    const zakatAmount = page.getByRole("textbox", { name: "Zakat Amount" });
    await zakatAmount.fill("250.00");

    // ✅ Exact text match - no fuzzy matching
    await expect(zakatAmount).toHaveValue("250.00");

    await page.getByRole("button", { name: "Submit Payment" }).click();

    // ✅ Exact confirmation message
    const confirmation = page.getByRole("status");
    await expect(confirmation).toHaveText("Payment of $250.00 submitted successfully");

    // ✅ Reproducible attribute check
    await expect(confirmation).toHaveAttribute("data-payment-status", "submitted");
  });

  test("uses snapshot for consistent UI validation", async ({ page }) => {
    await page.goto("/zakat/calculator/result");

    // ✅ CORRECT: Snapshot assertion for reproducible UI validation
    const resultPanel = page.getByTestId("zakat-result-panel");
    await expect(resultPanel).toHaveScreenshot("zakat-result-250.png", {
      maxDiffPixels: 100, // Allow minor rendering differences
    });
  });

  test("validates calculation with deterministic precision", async ({ page }) => {
    await page.goto("/zakat/calculator");

    await page.getByRole("textbox", { name: "Wealth" }).fill("10000.00");
    await page.getByRole("button", { name: "Calculate" }).click();

    // ✅ Deterministic decimal assertion
    const result = await page.getByTestId("zakat-amount").textContent();
    expect(result).toBe("$250.00"); // Exact match - no rounding issues
  });
});
```

**See**: [Reproducibility Principle](../../../../../../governance/principles/software-engineering/reproducibility.md)

## Web-First Assertions

**MUST** use Playwright's web-first assertions that auto-wait and retry.

### Visibility Assertions

```typescript
// Element is visible
await expect(page.getByText("Success")).toBeVisible();

// Element is hidden
await expect(page.getByText("Loading")).toBeHidden();

// Element is not visible (includes hidden and non-existent)
await expect(page.getByText("Error")).not.toBeVisible();
```

### Text Content Assertions

```typescript
// Exact text match
await expect(page.getByRole("heading")).toHaveText("Zakat Calculator");

// Partial text match
await expect(page.getByRole("alert")).toContainText("exceeds");

// Regex match
await expect(page.getByText(/Transaction #\d{5}/)).toBeVisible();

// Array of texts (multiple elements)
await expect(page.getByRole("listitem")).toHaveText(["Gold", "Silver", "Cash"]);
```

### Value Assertions

```typescript
// Input value
await expect(page.getByLabel("Email")).toHaveValue("user@example.com");

// Checkbox/radio checked state
await expect(page.getByRole("checkbox", { name: "Accept Terms" })).toBeChecked();
await expect(page.getByRole("checkbox", { name: "Reject" })).not.toBeChecked();

// Select value
await expect(page.getByRole("combobox", { name: "Currency" })).toHaveValue("USD");
```

### Attribute Assertions

```typescript
// Has attribute
await expect(page.getByRole("button")).toHaveAttribute("disabled");

// Attribute with specific value
await expect(page.getByRole("link")).toHaveAttribute("href", "/dashboard");

// Attribute with regex
await expect(page.getByRole("img")).toHaveAttribute("src", /\.png$/);
```

### State Assertions

```typescript
// Enabled/disabled
await expect(page.getByRole("button", { name: "Submit" })).toBeEnabled();
await expect(page.getByRole("button", { name: "Delete" })).toBeDisabled();

// Editable
await expect(page.getByRole("textbox")).toBeEditable();

// Focused
await expect(page.getByRole("textbox", { name: "Email" })).toBeFocused();
```

### Count Assertions

```typescript
// Exact count
await expect(page.getByRole("row")).toHaveCount(10);

// At least/at most
await expect(page.getByRole("button", { name: "Edit" })).toHaveCount(5);
```

## OSE Platform Assertion Patterns

### Financial Amount Assertions

**MUST** use exact decimal matching for financial calculations.

```typescript
// ✅ CORRECT: Exact financial amount
await expect(page.getByTestId("zakat-amount")).toHaveText("$250.00");

// ✅ Verify decimal precision
const amount = await page.getByTestId("profit-amount").textContent();
expect(amount).toMatch(/^\$\d+\.\d{2}$/); // Always 2 decimal places

// ❌ WRONG: Fuzzy matching for financial data
await expect(page.getByText(/250/)).toBeVisible(); // Too vague!
```

### Shariah Compliance Assertions

**MUST** explicitly verify Shariah compliance indicators.

```typescript
// ✅ CORRECT: Explicit compliance validation
await expect(page.getByRole("status", { name: "Shariah Compliant" })).toBeVisible();

// ✅ Verify no interest (riba) warnings
await expect(page.getByText(/interest|riba/i)).not.toBeVisible();

// ✅ Profit margin within limits
const profitMargin = page.getByTestId("profit-margin-percentage");
const value = await profitMargin.textContent();
const percentage = parseFloat(value!.replace("%", ""));
expect(percentage).toBeLessThanOrEqual(30); // 30% Shariah limit
```

### Multi-Language Assertions

**MUST** support bilingual (English/Indonesian) assertions.

```typescript
// Page object with locale support
export class ZakatCalculatorPage {
  constructor(
    private page: Page,
    private locale: "en" | "id" = "en",
  ) {}

  async expectCalculationSuccess(): Promise<void> {
    const messages = {
      en: "Zakat calculation complete",
      id: "Perhitungan zakat selesai",
    };

    await expect(this.page.getByRole("status")).toContainText(messages[this.locale]);
  }

  async expectProfitMarginError(): Promise<void> {
    const messages = {
      en: "Profit margin exceeds Shariah limit",
      id: "Margin keuntungan melebihi batas syariah",
    };

    await expect(this.page.getByRole("alert")).toContainText(messages[this.locale]);
  }
}
```

## Soft Assertions

**MAY** use soft assertions to collect multiple failures.

```typescript
test("validates complete Murabaha contract form", async ({ page }) => {
  await page.goto("/murabaha/contract");

  // Soft assertions - collect all failures
  await expect.soft(page.getByLabel("Asset Name")).toBeVisible();
  await expect.soft(page.getByLabel("Cost Price")).toBeVisible();
  await expect.soft(page.getByLabel("Profit Margin")).toBeVisible();
  await expect.soft(page.getByLabel("Installments")).toBeVisible();

  // Test continues even if some assertions fail
  // All failures reported at test end
});
```

## Custom Assertions

**MAY** create custom assertion functions for domain-specific validation.

```typescript
// tests/utils/custom-assertions.ts
import { Page, expect } from "@playwright/test";

export async function expectZakatAmountToBeValid(page: Page, expectedAmount: string) {
  const amountElement = page.getByTestId("zakat-amount");

  // Multiple related assertions
  await expect(amountElement).toBeVisible();
  await expect(amountElement).toHaveText(expectedAmount);
  await expect(amountElement).toHaveAttribute("data-validated", "true");

  // Verify format (always 2 decimals)
  const text = await amountElement.textContent();
  expect(text).toMatch(/^\$\d+\.\d{2}$/);
}

// Usage
test("calculates zakat correctly", async ({ page }) => {
  await page.goto("/zakat/calculator");
  await page.getByLabel("Wealth").fill("10000");
  await page.getByRole("button", { name: "Calculate" }).click();

  await expectZakatAmountToBeValid(page, "$250.00");
});
```

## Anti-Patterns

### 1. Not Using Auto-Waiting Assertions

**FAIL**:

```typescript
// ❌ WRONG: Manual wait before assertion
await page.waitForTimeout(2000);
const text = await page.getByText("Success").textContent();
expect(text).toBe("Success");
```

**PASS**:

```typescript
// ✅ CORRECT: Auto-waiting assertion
await expect(page.getByText("Success")).toHaveText("Success");
```

### 2. Using Generic Assertions for Web Elements

**FAIL**:

```typescript
// ❌ WRONG: Generic Jest assertions
const isVisible = await page.getByText("Success").isVisible();
expect(isVisible).toBe(true);
```

**PASS**:

```typescript
// ✅ CORRECT: Web-first assertion
await expect(page.getByText("Success")).toBeVisible();
```

### 3. Fuzzy Financial Assertions

**FAIL**:

```typescript
// ❌ WRONG: Fuzzy matching for money
await expect(page.getByText(/250/)).toBeVisible();
```

**PASS**:

```typescript
// ✅ CORRECT: Exact financial assertion
await expect(page.getByTestId("zakat-amount")).toHaveText("$250.00");
```

## Related Documentation

**Core Playwright Documentation**:

- [Playwright Framework Index](README.md) - Overview and related documentation
- [Playwright Test Organization](test-organization.md) - Test structure standards
- [Playwright Selectors](selectors.md) - Selector strategies for assertions
- [Playwright Anti-Patterns](anti-patterns.md) - Common assertion mistakes

**Principles**:

- [Automation Over Manual](../../../../../../governance/principles/software-engineering/automation-over-manual.md)
- [Explicit Over Implicit](../../../../../../governance/principles/software-engineering/explicit-over-implicit.md)
- [Reproducibility](../../../../../../governance/principles/software-engineering/reproducibility.md)

---

**Maintainers**: Platform Documentation Team

**Playwright Version**: Playwright 1.40+ (TypeScript, Node.js 18+)
