---
title: "Playwright Page Object Standards"
description: Authoritative OSE Platform Playwright Page Object Model standards (class-based patterns, locator composition, TypeScript typing)
category: explanation
subcategory: automation-testing
tags:
  - playwright
  - testing
  - page-objects
  - pom
  - typescript
  - oop
  - playwright-1.40
principles:
  - explicit-over-implicit
  - immutability
  - pure-functions
created: 2026-02-08
---

# Playwright Page Object Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Playwright fundamentals from [AyoKoding Playwright Learning Path](../../../../../../apps/ayokoding-web/content/en/learn/software-engineering/automation-testing/tools/playwright/) before using these standards.

**This document is OSE Platform-specific**, not a Playwright tutorial. We define HOW to write Page Objects in THIS codebase, not WHAT Page Object Model is.

**See**: [Programming Language Documentation Separation Convention](../../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative Page Object Model standards** for Playwright end-to-end testing in the OSE Platform.

**Target Audience**: OSE Platform E2E test developers, technical reviewers

**Scope**: Page object patterns, class structure, locator encapsulation

## Software Engineering Principles

### 1. Explicit Over Implicit

**How Page Objects Implement**: Explicit locators, typed parameters, clear return types

**PASS Example**:

```typescript
export class ZakatCalculatorPage {
  readonly page: Page;
  readonly wealthInput: Locator;
  readonly calculateButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.wealthInput = page.getByRole("textbox", { name: "Total Wealth" });
    this.calculateButton = page.getByRole("button", { name: "Calculate" });
  }

  async calculateZakat(wealth: string): Promise<void> {
    await this.wealthInput.fill(wealth);
    await this.calculateButton.click();
  }
}
```

### 2. Immutability

**How Page Objects Implement**: Readonly properties

**PASS Example**:

```typescript
export class MurabahaPage {
  readonly page: Page;
  readonly costInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.costInput = page.getByRole("textbox", { name: "Cost" });
  }
}
```

### 3. Pure Functions

**How Page Objects Implement**: Query methods without side effects

**PASS Example**:

```typescript
async getTransactionCount(): Promise<number> {
  return await this.transactionTable.getByRole('row').count();
}
```

## Standards

### Class-Based Structure

```typescript
export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByRole("textbox", { name: "Email" });
    this.submitButton = page.getByRole("button", { name: "Sign In" });
  }

  async goto(): Promise<void> {
    await this.page.goto("/login");
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.submitButton.click();
  }
}
```

## Related Documentation

- [Playwright Framework Index](README.md)
- [Explicit Over Implicit](../../../../../../governance/principles/software-engineering/explicit-over-implicit.md)

---

**Maintainers**: Platform Documentation Team
