---
title: "Playwright Selector Standards"
description: Authoritative OSE Platform Playwright selector standards (locator strategies, accessibility-first selectors, selector resilience)
category: explanation
subcategory: automation-testing
tags:
  - playwright
  - testing
  - selectors
  - locators
  - accessibility
  - typescript
  - playwright-1.40
principles:
  - automation-over-manual
  - explicit-over-implicit
  - accessibility-first
created: 2026-02-08
---

# Playwright Selector Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Playwright fundamentals from [AyoKoding Playwright Learning Path](../../../../../../apps/ayokoding-web/content/en/learn/software-engineering/automation-testing/tools/playwright/) before using these standards.

**This document is OSE Platform-specific**, not a Playwright tutorial. We define HOW to select elements in THIS codebase, not WHAT Playwright selectors are.

**See**: [Programming Language Documentation Separation Convention](../../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative selector standards** for Playwright end-to-end testing in the OSE Platform. These are prescriptive rules that MUST be followed to ensure accessible, maintainable, and resilient test selectors.

**Target Audience**: OSE Platform E2E test developers, technical reviewers, automated test quality tools

**Scope**: OSE Platform selector strategies, locator patterns, accessibility-first approaches, and selector resilience standards

## Software Engineering Principles

These standards enforce software engineering principles from `governance/principles/`:

### 1. Accessibility First

**Principle**: Design for all users from the start, not as an afterthought. Accessibility is a requirement, not an optional feature.

**How Playwright Selectors Implement**:

- `getByRole()` selector encourages semantic HTML with ARIA roles
- `getByLabel()` requires proper form labeling for screen readers
- `getByText()` enforces visible, readable content
- Avoiding fragile CSS selectors improves maintainability for accessibility refactors
- Testing with screen reader-like queries ensures real accessibility

**PASS Example** (Accessibility-First Zakat Calculator):

```typescript
// tests/e2e/zakat/calculation.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Zakat Calculator Accessibility", () => {
  test("screen reader users can access calculator", async ({ page }) => {
    await page.goto("/zakat/calculator");

    // ✅ CORRECT: Role-based selectors encourage proper ARIA
    const wealthInput = page.getByRole("textbox", { name: "Total Wealth (USD)" });
    const nisabInput = page.getByRole("textbox", { name: "Nisab Threshold (USD)" });
    const calculateButton = page.getByRole("button", { name: "Calculate Zakat" });
    const resultHeading = page.getByRole("heading", { name: "Zakat Amount" });

    // ✅ Fill form using accessible selectors
    await wealthInput.fill("10000");
    await nisabInput.fill("5000");
    await calculateButton.click();

    // ✅ Verify result is accessible to screen readers
    const result = page.getByText("$250.00");
    await expect(result).toBeVisible();

    // ✅ Verify semantic structure
    await expect(resultHeading).toBeVisible();
  });
});
```

**FAIL Example**:

```typescript
// ❌ WRONG: CSS class selectors - not accessible
test("calculates zakat", async ({ page }) => {
  await page.goto("/zakat/calculator");

  // ❌ Fragile CSS selectors - break on styling changes
  await page.locator(".wealth-input").fill("10000");
  await page.locator(".nisab-input").fill("5000");
  await page.locator(".calc-btn").click();

  // ❌ No verification of accessibility structure
  await expect(page.locator(".result-amount")).toContainText("250");
});
```

**Why it fails**: CSS class selectors don't verify accessibility, break easily on styling changes, and don't encourage semantic HTML.

**See**: [Accessibility First Principle](../../../../../../governance/principles/content/accessibility-first.md)

### 2. Explicit Over Implicit

**Principle**: Choose explicit composition and configuration over magic, convenience, and hidden behavior.

**How Playwright Selectors Implement**:

- Explicit locator names (`getByRole` vs implicit CSS)
- Explicit accessible names in selectors
- Explicit locator chaining for specificity
- Explicit error messages from failed locators

**PASS Example** (Explicit Murabaha Contract Selectors):

```typescript
// tests/page-objects/pages/MurabahaContractPage.ts
import { Page, Locator } from "@playwright/test";

export class MurabahaContractPage {
  readonly page: Page;

  // ✅ CORRECT: Explicit locators with semantic selectors
  readonly costPriceInput: Locator;
  readonly profitMarginInput: Locator;
  readonly installmentCountInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    this.page = page;

    // ✅ Explicit role-based selectors with accessible names
    this.costPriceInput = page.getByRole("textbox", { name: "Cost Price (USD)" });
    this.profitMarginInput = page.getByRole("textbox", { name: "Profit Margin (USD)" });
    this.installmentCountInput = page.getByRole("spinbutton", { name: "Number of Installments" });
    this.submitButton = page.getByRole("button", { name: "Create Contract" });

    // ✅ Explicit alert/status role for messages
    this.errorMessage = page.getByRole("alert").filter({ hasText: "Error" });
    this.successMessage = page.getByRole("status").filter({ hasText: "Success" });
  }

  // ✅ Explicit locator methods
  async enterCostPrice(amount: string): Promise<void> {
    await this.costPriceInput.fill(amount);
  }

  async enterProfitMargin(amount: string): Promise<void> {
    await this.profitMarginInput.fill(amount);
  }

  async submitContract(): Promise<void> {
    await this.submitButton.click();
  }
}
```

**See**: [Explicit Over Implicit Principle](../../../../../../governance/principles/software-engineering/explicit-over-implicit.md)

## Selector Strategy Priority

**MUST** follow this priority order when choosing selectors:

### 1. Role-Based Selectors (HIGHEST PRIORITY)

**Use**: `page.getByRole()` for all interactive elements

**Why**: Mirrors how screen readers and accessibility tools navigate, encourages semantic HTML, resilient to styling changes

**PASS Examples**:

```typescript
// Buttons
page.getByRole("button", { name: "Submit Payment" });
page.getByRole("button", { name: /submit/i }); // Case-insensitive regex

// Text inputs
page.getByRole("textbox", { name: "Email Address" });
page.getByRole("textbox", { name: "Zakat Amount" });

// Number inputs
page.getByRole("spinbutton", { name: "Installment Count" });

// Checkboxes
page.getByRole("checkbox", { name: "Accept Terms and Conditions" });

// Radio buttons
page.getByRole("radio", { name: "Bank Transfer" });
page.getByRole("radio", { name: "Credit Card" });

// Links
page.getByRole("link", { name: "View Transaction History" });

// Headings
page.getByRole("heading", { name: "Murabaha Contract Details" });
page.getByRole("heading", { name: "Zakat Calculator", level: 1 });

// Tables
const table = page.getByRole("table", { name: "Payment History" });
const row = table.getByRole("row", { name: /Transaction #12345/ });
const cell = row.getByRole("cell", { name: "$250.00" });
```

### 2. Label-Based Selectors

**Use**: `page.getByLabel()` for form fields with labels

**Why**: Requires proper label association (for screen readers), more resilient than CSS

**PASS Examples**:

```typescript
// Form inputs with labels
page.getByLabel("Full Name");
page.getByLabel("Email Address");
page.getByLabel("Phone Number");

// Case-insensitive
page.getByLabel(/email address/i);

// Exact match
page.getByLabel("Email", { exact: true });
```

### 3. Text-Based Selectors

**Use**: `page.getByText()` for visible text content

**Why**: Matches what users see, resilient to structural changes

**PASS Examples**:

```typescript
// Exact text match
page.getByText("Zakat Payment Successful");
page.getByText("Transaction #12345");

// Partial text match
page.getByText("Payment", { exact: false });

// Regex match
page.getByText(/zakat payment/i);

// Within specific context
const alert = page.getByRole("alert");
alert.getByText("Profit margin exceeds Shariah limit");
```

### 4. Test ID Selectors (LAST RESORT)

**Use**: `page.getByTestId()` ONLY when semantic selectors impossible

**Why**: Not visible to users, requires extra attributes, but stable across refactors

**When to use**: Complex components, dynamic content, third-party libraries

**PASS Examples**:

```typescript
// When semantic selector not available
page.getByTestId("zakat-calculator-widget");
page.getByTestId("murabaha-contract-form");

// Complex table cells
page.getByTestId("payment-amount-cell-12345");
```

**HTML Requirements**:

```html
<!-- Add data-testid attribute -->
<div data-testid="zakat-calculator-widget">
  <!-- Component content -->
</div>
```

### 5. CSS Selectors (AVOID)

**Use**: NEVER use CSS selectors unless absolutely necessary

**Why**: Fragile, break on styling changes, don't verify accessibility, hard to maintain

**FAIL Examples**:

```typescript
// ❌ WRONG: CSS class selectors
page.locator(".btn-primary");
page.locator(".form-input");
page.locator("#submit-button");

// ❌ WRONG: Complex CSS selectors
page.locator('div.container > form > input[type="text"]');
```

**Exception**: CSS selectors allowed ONLY for:

- Non-interactive styling verification (`expect(locator).toHaveCSS('color', 'rgb(255, 0, 0)')`)
- Third-party components with no test IDs

## Locator Patterns

### Chaining Locators

**SHOULD** chain locators for specificity.

**PASS Examples**:

```typescript
// Chain by role + text
const alert = page.getByRole("alert");
const errorMsg = alert.getByText("Invalid profit margin");

// Chain within container
const form = page.getByRole("form", { name: "Murabaha Contract" });
const costInput = form.getByRole("textbox", { name: "Cost Price" });

// Chain table navigation
const table = page.getByRole("table", { name: "Payments" });
const row = table.getByRole("row", { name: /Transaction #12345/ });
const amountCell = row.getByRole("cell", { name: "$250.00" });
```

### Filtering Locators

**SHOULD** use filters for precise targeting.

**PASS Examples**:

```typescript
// Filter by text content
page.getByRole("button").filter({ hasText: "Submit" });

// Filter by not having text
page.getByRole("button").filter({ hasNotText: "Cancel" });

// Filter by child element
page.getByRole("listitem").filter({ has: page.getByText("Active") });

// Filter by not having child
page.getByRole("listitem").filter({ hasNot: page.getByText("Inactive") });
```

### Nth Locator Selection

**MAY** use `nth()` when multiple elements match, but prefer more specific selectors.

**PASS Examples**:

```typescript
// Get first match
page.getByRole("button", { name: "Edit" }).first();

// Get last match
page.getByRole("button", { name: "Delete" }).last();

// Get nth match (0-indexed)
page.getByRole("row").nth(2); // Third row

// Get all matches
const allButtons = await page.getByRole("button", { name: "Edit" }).all();
```

**BETTER**:

```typescript
// ✅ Prefer more specific selector over nth()
page.getByRole("row", { name: /Transaction #12345/ }).getByRole("button", { name: "Edit" });
```

## OSE Platform Selector Conventions

### Islamic Finance Domain Selectors

**MUST** use domain-specific accessible names.

**PASS Examples**:

```typescript
// Zakat (Islamic wealth tax)
page.getByRole("textbox", { name: "Wealth Subject to Zakat (USD)" });
page.getByRole("textbox", { name: "Nisab Threshold (85g gold equivalent)" });
page.getByRole("button", { name: "Calculate Zakat (2.5%)" });

// Murabaha (Islamic financing)
page.getByRole("textbox", { name: "Asset Cost Price" });
page.getByRole("textbox", { name: "Profit Margin (max 30%)" });
page.getByRole("button", { name: "Create Murabaha Contract" });

// Waqf (Islamic endowment)
page.getByRole("textbox", { name: "Waqf Donation Amount" });
page.getByRole("combobox", { name: "Beneficiary Category" });
page.getByRole("button", { name: "Submit Waqf Donation" });
```

### Multi-Language Support

**MUST** support English and Indonesian selectors for bilingual platform.

**PASS Example**:

```typescript
// tests/page-objects/pages/ZakatCalculatorPage.ts
export class ZakatCalculatorPage {
  constructor(
    private page: Page,
    private locale: "en" | "id" = "en",
  ) {}

  get wealthInput(): Locator {
    const labels = {
      en: "Total Wealth (USD)",
      id: "Total Kekayaan (USD)",
    };
    return this.page.getByRole("textbox", { name: labels[this.locale] });
  }

  get calculateButton(): Locator {
    const labels = {
      en: "Calculate Zakat",
      id: "Hitung Zakat",
    };
    return this.page.getByRole("button", { name: labels[this.locale] });
  }
}

// Usage
test("calculates zakat in English", async ({ page }) => {
  const calculator = new ZakatCalculatorPage(page, "en");
  await calculator.wealthInput.fill("10000");
  await calculator.calculateButton.click();
});

test("calculates zakat in Indonesian", async ({ page }) => {
  const calculator = new ZakatCalculatorPage(page, "id");
  await calculator.wealthInput.fill("10000");
  await calculator.calculateButton.click();
});
```

## Anti-Patterns

### 1. Fragile CSS Selectors

**FAIL**:

```typescript
// ❌ WRONG: CSS class names break on styling
page.locator(".btn-primary");
page.locator(".form-control");
page.locator("#zakatCalculator");

// ❌ WRONG: Complex CSS paths
page.locator("div.container > form.zakat-form > input.amount-field");
```

**PASS**:

```typescript
// ✅ CORRECT: Semantic role-based selectors
page.getByRole("button", { name: "Calculate Zakat" });
page.getByRole("textbox", { name: "Zakat Amount" });
```

### 2. XPath Selectors

**FAIL**:

```typescript
// ❌ WRONG: XPath selectors are fragile
page.locator('//button[@class="btn-primary"]');
page.locator('//div[@id="container"]/form/input[1]');
```

**PASS**:

```typescript
// ✅ CORRECT: Use built-in Playwright locators
page.getByRole("button", { name: "Submit" });
page.getByRole("form").getByRole("textbox").first();
```

### 3. Overly Specific Selectors

**FAIL**:

```typescript
// ❌ WRONG: Too specific - breaks on minor changes
page.locator(
  "div#main-container > section.content > form.zakat-form > div.form-group:nth-child(1) > input.form-control",
);
```

**PASS**:

```typescript
// ✅ CORRECT: Semantic and resilient
page.getByRole("textbox", { name: "Zakat Amount" });
```

### 4. Index-Based Selection Without Context

**FAIL**:

```typescript
// ❌ WRONG: Fragile nth selection
page.locator("input").nth(2);
page.locator("button").first();
```

**PASS**:

```typescript
// ✅ CORRECT: Contextual nth selection
const form = page.getByRole("form", { name: "Zakat Calculator" });
form.getByRole("textbox").nth(2); // Third textbox within specific form
```

## Related Documentation

**Core Playwright Documentation**:

- [Playwright Framework Index](README.md) - Overview and related documentation
- [Playwright Test Organization](test-organization.md) - Test structure standards
- [Playwright Page Objects](page-objects.md) - Page object patterns with selectors
- [Playwright Anti-Patterns](anti-patterns.md) - Common selector mistakes

**Principles**:

- [Accessibility First](../../../../../../governance/principles/content/accessibility-first.md)
- [Explicit Over Implicit](../../../../../../governance/principles/software-engineering/explicit-over-implicit.md)

---

**Maintainers**: Platform Documentation Team

**Playwright Version**: Playwright 1.40+ (TypeScript, Node.js 18+)
