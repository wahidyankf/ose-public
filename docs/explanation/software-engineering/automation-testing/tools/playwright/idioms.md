---
title: "Playwright Idioms"
description: Authoritative OSE Platform Playwright idioms (framework-specific patterns, auto-waiting, fixture patterns, locator chaining)
category: explanation
subcategory: automation-testing
tags:
  - playwright
  - testing
  - idioms
  - patterns
  - typescript
  - playwright-1.40
principles:
  - automation-over-manual
  - explicit-over-implicit
  - reproducibility
created: 2026-02-08
---

# Playwright Idioms

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Playwright fundamentals from [AyoKoding Playwright Learning Path](../../../../../../apps/ayokoding-web/content/en/learn/software-engineering/automation-testing/tools/playwright/) before using these standards.

**This document is OSE Platform-specific**, not a Playwright tutorial.

**See**: [Programming Language Documentation Separation Convention](../../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **Playwright-specific idioms** for the OSE Platform.

**Target Audience**: OSE Platform E2E test developers

**Scope**: Framework patterns, auto-waiting, fixtures

## Idioms

### 1. Auto-Waiting Pattern

**Playwright automatically waits** for elements to be actionable.

```typescript
// Playwright waits for element to be visible, enabled, stable
await page.getByRole("button", { name: "Submit" }).click();

// Playwright waits for assertion to pass
await expect(page.getByText("Success")).toBeVisible();
```

### 2. Locator Chaining

**Chain locators** for precise targeting.

```typescript
const alert = page.getByRole("alert");
const errorMsg = alert.getByText("Invalid profit margin");

const table = page.getByRole("table", { name: "Payments" });
const row = table.getByRole("row", { name: /Transaction #12345/ });
const cell = row.getByRole("cell", { name: "$250.00" });
```

### 3. Fixture Pattern

**Use fixtures** for reusable test setup.

```typescript
import { test as base } from "@playwright/test";

export const test = base.extend({
  authenticatedPage: async ({ page }, use) => {
    await page.goto("/login");
    await page.getByRole("textbox", { name: "Email" }).fill("user@example.com");
    await page.getByRole("button", { name: "Sign In" }).click();
    await use(page);
  },
});

test("dashboard", async ({ authenticatedPage }) => {
  await authenticatedPage.goto("/dashboard");
});
```

### 4. Page Object Composition

**Compose page objects** for reusable components.

```typescript
export class DashboardPage {
  readonly page: Page;
  readonly header: Header;

  constructor(page: Page) {
    this.page = page;
    this.header = new Header(page);
  }
}
```

## Related Documentation

- [Playwright Framework Index](README.md)
- [Playwright Test Organization](test-organization.md)

---

**Maintainers**: Platform Documentation Team
