---
title: "Playwright Best Practices"
description: Authoritative OSE Platform Playwright best practices (test isolation, idempotency, deterministic tests)
category: explanation
subcategory: automation-testing
tags:
  - playwright
  - testing
  - best-practices
  - reliability
  - typescript
  - playwright-1.40
principles:
  - automation-over-manual
  - explicit-over-implicit
  - reproducibility
created: 2026-02-08
---

# Playwright Best Practices

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Playwright fundamentals from [AyoKoding Playwright Learning Path](../../../../../../apps/ayokoding-web/content/en/learn/software-engineering/automation-testing/tools/playwright/) before using these standards.

**This document is OSE Platform-specific**, not a Playwright tutorial.

**See**: [Programming Language Documentation Separation Convention](../../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **best practices** for reliable Playwright tests in the OSE Platform.

**Target Audience**: OSE Platform E2E test developers

**Scope**: Test isolation, idempotency, reliability patterns

## Best Practices

### 1. Test Isolation

**MUST** ensure tests are independent and can run in any order.

**PASS Example**:

```typescript
test.beforeEach(async ({ page }) => {
  await createTestZakatRecord(page);
});

test("submits payment", async ({ page }) => {
  // Independent test
});

test.afterEach(async ({ page }) => {
  await deleteTestZakatRecord(page);
});
```

### 2. Use Auto-Waiting

**MUST** rely on Playwright's auto-waiting instead of manual waits.

**PASS Example**:

```typescript
await expect(page.getByText("Success")).toBeVisible();
```

**FAIL Example**:

```typescript
await page.waitForTimeout(2000); // ❌ WRONG
```

### 3. Accessibility-First Selectors

**MUST** use role-based selectors.

**PASS Example**:

```typescript
page.getByRole("button", { name: "Calculate Zakat" });
```

## Related Documentation

- [Playwright Framework Index](README.md)
- [Playwright Test Organization](test-organization.md)

---

**Maintainers**: Platform Documentation Team
