---
title: "Playwright Configuration Standards"
description: Authoritative OSE Platform Playwright configuration standards (playwright.config.ts setup, environment-specific configs, CI/CD integration)
category: explanation
subcategory: automation-testing
tags:
  - playwright
  - testing
  - configuration
  - ci-cd
  - typescript
  - playwright-1.40
principles:
  - automation-over-manual
  - explicit-over-implicit
  - reproducibility
created: 2026-02-08
updated: 2026-02-08
---

# Playwright Configuration Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Playwright fundamentals from [AyoKoding Playwright Learning Path](../../../../../../apps/ayokoding-web/content/en/learn/software-engineering/automation-testing/tools/playwright/) before using these standards.

**This document is OSE Platform-specific**, not a Playwright tutorial. We define HOW to configure Playwright in THIS codebase.

**See**: [Programming Language Documentation Separation Convention](../../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative configuration standards** for Playwright in the OSE Platform.

**Target Audience**: OSE Platform E2E test developers, DevOps engineers

**Scope**: playwright.config.ts patterns, CI/CD configuration

## Software Engineering Principles

### 1. Automation Over Manual

**How Configuration Implements**: Automated cross-browser testing, parallel execution, retry strategies

**PASS Example**:

```typescript
export default defineConfig({
  fullyParallel: true, // Automated parallel execution
  retries: process.env.CI ? 2 : 0, // Automated retry in CI
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["html"], ["junit"]] : "html",
});
```

### 2. Explicit Over Implicit

**How Configuration Implements**: Explicit environment variables, explicit browser configurations

**PASS Example**:

```typescript
export default defineConfig({
  testDir: "./tests/e2e",
  forbidOnly: !!process.env.CI,
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
  },
});
```

### 3. Reproducibility

**How Configuration Implements**: Fixed configurations, version locking, deterministic behavior

**PASS Example**:

```json
{
  "devDependencies": {
    "@playwright/test": "1.40.1"
  }
}
```

## Configuration File Structure

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html"], ["junit", { outputFile: "test-results/junit.xml" }]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
  ],
});
```

## BDD Configuration (playwright-bdd)

When the E2E project is driven by Gherkin feature files, replace `testDir` with `defineBddConfig`:

```typescript
import { defineConfig } from "@playwright/test";
import { defineBddConfig } from "playwright-bdd";

const testDir = defineBddConfig({
  featuresRoot: "../../specs/apps/organiclever-be",
  features: "../../specs/apps/organiclever-be/**/*.feature",
  steps: "./tests/steps/**/*.ts",
});

export default defineConfig({
  testDir, // ← returned by defineBddConfig
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html"], ["junit", { outputFile: "test-results/junit.xml" }]],
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:8201",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  // No projects array needed for API-only suites
});
```

**Key differences from standard config:**

- `defineBddConfig()` returns the `testDir` value and registers BDD wiring
- Feature files live in `specs/` at the monorepo root (path relative to project root)
- No `projects` array required for API tests — the default single project suffices
- Always run `npx bddgen` before `npx playwright test` to regenerate `.features-gen/`

**See**: [BDD Integration](ex-soen-aute-to-pl__bdd.md) for full playwright-bdd standards.

## Related Documentation

- [Playwright Framework Index](README.md)
- [BDD Integration](ex-soen-aute-to-pl__bdd.md)
- [Reproducibility](../../../../../../governance/principles/software-engineering/reproducibility.md)

---

**Maintainers**: Platform Documentation Team
**Last Updated**: 2026-02-08
