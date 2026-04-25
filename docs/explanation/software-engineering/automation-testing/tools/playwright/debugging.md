---
title: "Playwright Debugging Standards"
description: Authoritative OSE Platform Playwright debugging standards (trace viewer, inspector, debug mode, screenshot on failure)
category: explanation
subcategory: automation-testing
tags:
  - playwright
  - testing
  - debugging
  - trace-viewer
  - inspector
  - typescript
  - playwright-1.40
principles:
  - automation-over-manual
  - explicit-over-implicit
  - reproducibility
created: 2026-02-08
---

# Playwright Debugging Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Playwright fundamentals from [AyoKoding Playwright Learning Path](../../../../../../apps/ayokoding-web/content/en/learn/software-engineering/automation-testing/tools/playwright/) before using these standards.

**This document is OSE Platform-specific**, not a Playwright tutorial.

**See**: [Programming Language Documentation Separation Convention](../../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **debugging strategies** for Playwright tests in the OSE Platform.

**Target Audience**: OSE Platform E2E test developers

**Scope**: Trace viewer, inspector, debug mode

## Debugging Tools

### 1. Trace Viewer

**View test execution** with comprehensive debugging information.

```bash
# Run with trace
npx playwright test --trace on

# View trace
npx playwright show-trace trace.zip
```

**Configuration**:

```typescript
export default defineConfig({
  use: {
    trace: "on-first-retry",
  },
});
```

### 2. Inspector

**Step through tests** interactively.

```bash
npx playwright test --debug
```

### 3. Headed Mode

**Run with visible browser**:

```bash
npx playwright test --headed
```

### 4. Screenshot on Failure

```typescript
export default defineConfig({
  use: {
    screenshot: "only-on-failure",
  },
});
```

### 5. Console Logs

```typescript
test("debug zakat calculation", async ({ page }) => {
  page.on("console", (msg) => console.log("Browser console:", msg.text()));

  await page.goto("/zakat/calculator");
  await page.getByRole("textbox", { name: "Wealth" }).fill("10000");
  await page.getByRole("button", { name: "Calculate" }).click();
});
```

### 6. Pause Execution

```typescript
test("debug flow", async ({ page }) => {
  await page.goto("/login");
  await page.pause(); // Pauses execution for inspection
  await page.getByRole("button", { name: "Sign In" }).click();
});
```

## Best Debugging Practices

### Isolate Failing Test

```bash
npx playwright test login.spec.ts --debug
```

### Use --headed for Visual Debugging

```bash
npx playwright test --headed --workers=1
```

### Check Network Activity

```typescript
test("debug API calls", async ({ page }) => {
  page.on("request", (request) => console.log(">>", request.method(), request.url()));
  page.on("response", (response) => console.log("<<", response.status(), response.url()));

  await page.goto("/zakat/calculator");
});
```

## Related Documentation

- [Playwright Framework Index](README.md)
- [Playwright Test Organization](test-organization.md)

---

**Maintainers**: Platform Documentation Team
