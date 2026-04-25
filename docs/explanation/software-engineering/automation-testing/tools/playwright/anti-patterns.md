---
title: "Playwright Anti-Patterns"
description: Authoritative OSE Platform Playwright anti-patterns (common mistakes, problematic patterns to avoid)
category: explanation
subcategory: automation-testing
tags:
  - playwright
  - testing
  - anti-patterns
  - pitfalls
  - typescript
  - playwright-1.40
principles:
  - automation-over-manual
  - explicit-over-implicit
  - reproducibility
created: 2026-02-08
---

# Playwright Anti-Patterns

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Playwright fundamentals from [AyoKoding Playwright Learning Path](../../../../../../apps/ayokoding-web/content/en/learn/software-engineering/automation-testing/tools/playwright/) before using these standards.

**This document is OSE Platform-specific**, not a Playwright tutorial.

**See**: [Programming Language Documentation Separation Convention](../../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **anti-patterns to avoid** in Playwright tests for the OSE Platform.

**Target Audience**: OSE Platform E2E test developers

**Scope**: Common mistakes, problematic patterns

## Anti-Patterns

### 1. Manual Waits

**FAIL**:

```typescript
await page.waitForTimeout(2000);
const text = await page.getByText("Success").textContent();
```

**PASS**:

```typescript
await expect(page.getByText("Success")).toBeVisible();
```

### 2. Fragile CSS Selectors

**FAIL**:

```typescript
page.locator(".btn-primary");
```

**PASS**:

```typescript
page.getByRole("button", { name: "Submit" });
```

### 3. Test Interdependence

**FAIL**:

```typescript
let paymentId: string;

test("creates payment", async ({ page }) => {
  paymentId = await createPayment(page);
});

test("submits payment", async ({ page }) => {
  await submitPayment(page, paymentId); // Depends on previous test!
});
```

**PASS**:

```typescript
test.beforeEach(async ({ page }) => {
  const paymentId = await createPayment(page);
});

test("submits payment", async ({ page }) => {
  // Independent test
});
```

### 4. No Page Objects

**FAIL**:

```typescript
test("login", async ({ page }) => {
  await page.fill("#email", "user@example.com");
  await page.fill("#password", "password");
  await page.click('button[type="submit"]');
});
```

**PASS**:

```typescript
test("login", async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.login("user@example.com", "password");
});
```

## Related Documentation

- [Playwright Framework Index](README.md)
- [Playwright Best Practices](best-practices.md)

---

**Maintainers**: Platform Documentation Team
