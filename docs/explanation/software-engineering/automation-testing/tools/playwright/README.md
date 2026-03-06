---
title: Playwright Framework
description: Modern end-to-end testing framework for cross-browser web automation
category: explanation
subcategory: automation-testing
tags:
  - playwright
  - testing
  - automation
  - e2e
  - typescript
  - framework
  - index
principles:
  - automation-over-manual
  - explicit-over-implicit
  - reproducibility
created: 2026-02-08
updated: 2026-02-08
---

# Playwright Framework

**Understanding-oriented documentation** for Playwright framework in the open-sharia-enterprise platform.

## Overview

Playwright is Microsoft's modern end-to-end testing framework that provides reliable cross-browser automation with auto-waiting, trace viewer debugging, and powerful network control. It enables fast, reliable testing across Chromium, Firefox, and WebKit with a single API.

This documentation covers Playwright 1.40+ with TypeScript targeting end-to-end testing, component testing, and cross-browser compatibility validation.

## Prerequisite Knowledge

**REQUIRED Foundation - TypeScript**:

Playwright is written in TypeScript and provides first-class TypeScript support. You MUST understand TypeScript fundamentals before learning Playwright.

**1. Master TypeScript First**:

- **[TypeScript Explanation Docs](../../../programming-languages/typescript/README.md)** - Understand type system, async/await, interfaces
- **[TypeScript Idioms](../../../programming-languages/typescript/ex-soen-prla-ty__idioms.md)** - Core TypeScript patterns and conventions
- **[TypeScript Type Safety](../../../programming-languages/typescript/ex-soen-prla-ty__type-safety.md)** - Type annotations and inference
- **[TypeScript Testing](../../../programming-languages/typescript/ex-soen-prla-ty__testing.md)** - Testing patterns with TypeScript

**2. Learn Playwright Fundamentals**:

You MUST complete the [AyoKoding Playwright Learning Path](../../../../../../apps/ayokoding-web/content/en/learn/software-engineering/automation-testing/tools/playwright/) before using these standards.

- [Playwright Initial Setup](../../../../../../apps/ayokoding-web/content/en/learn/software-engineering/automation-testing/tools/playwright/initial-setup.md) - Environment and tooling setup
- [Playwright Overview](../../../../../../apps/ayokoding-web/content/en/learn/software-engineering/automation-testing/tools/playwright/overview.md) - Auto-waiting, cross-browser support, trace viewer
- [Playwright By Example](../../../../../../apps/ayokoding-web/content/en/learn/software-engineering/automation-testing/tools/playwright/by-example/) (85+ annotated examples) - Hands-on code learning

**Separation of Concerns**: See [Programming Language Documentation Separation Convention](../../../../../../governance/conventions/structure/programming-language-docs-separation.md).

**What this documentation covers**: OSE Platform Playwright standards, test organization, page object patterns, how to apply Playwright knowledge in THIS codebase.

**What this documentation does NOT cover**: Playwright tutorials, basic selectors, generic patterns (those are in ayokoding-web).

**This documentation is OSE Platform-specific explanation**, not Playwright tutorials.

## Framework Standards

**This documentation is the authoritative reference** for Playwright usage standards in the open-sharia-enterprise platform.

All Playwright tests MUST follow the patterns and practices documented here:

1. **[Idioms](ex-soen-aute-to-pl__idioms.md)** - Playwright-specific patterns
2. **[Best Practices](ex-soen-aute-to-pl__best-practices.md)** - Framework standards
3. **[Anti-Patterns](ex-soen-aute-to-pl__anti-patterns.md)** - Common mistakes
4. **[Configuration](ex-soen-aute-to-pl__configuration.md)** - playwright.config.ts setup
5. **[Page Objects](ex-soen-aute-to-pl__page-objects.md)** - Page Object Model patterns
6. **[BDD Integration](ex-soen-aute-to-pl__bdd.md)** — playwright-bdd setup and Gherkin step definitions

**For Agents**: Reference this documentation when writing Playwright tests.

**Language Standards**: Also follow [TypeScript](../../../programming-languages/typescript/README.md) language standards.

### Quick Standards Reference

- **Project Structure**: See [Architecture Integration](#architecture-integration)
- **Test Organization**: See [Test Organization](ex-soen-aute-to-pl__test-organization.md)
- **Selectors**: See [Selectors](ex-soen-aute-to-pl__selectors.md)
- **Assertions**: See [Assertions](ex-soen-aute-to-pl__assertions.md)
- **Debugging**: See [Debugging](ex-soen-aute-to-pl__debugging.md)

## Software Engineering Principles

Playwright usage in this platform follows the the software engineering principles from [governance/principles/software-engineering/](../../../../../../governance/principles/software-engineering/README.md):

1. **[Automation Over Manual](../../../../../../governance/principles/software-engineering/automation-over-manual.md)** - Playwright automates through codegen, trace viewer, auto-waiting, visual regression testing
2. **[Explicit Over Implicit](../../../../../../governance/principles/software-engineering/explicit-over-implicit.md)** - Playwright enforces through explicit locators, test.describe blocks, clear assertions, typed page objects
3. **[Reproducibility First](../../../../../../governance/principles/software-engineering/reproducibility.md)** - Playwright enables through version pinning (package-lock.json), test retries, trace artifacts, CI/CD integration

## Quick Reference

**Jump to:**

- [Overview](#overview) - Playwright in the platform
- [Software Engineering Principles](#software-engineering-principles) - Three core principles
- [Playwright Version Strategy](#playwright-version-strategy) - Version management
- [Documentation Structure](#documentation-structure) - Guide to documentation files
- [Key Capabilities](#key-capabilities) - Framework features
- [Use Cases](#use-cases) - When to use Playwright
- [Architecture Integration](#architecture-integration) - Test organization, page objects
- [Development Workflow](#development-workflow) - Setup, configuration, debugging
- [Learning Path](#learning-path) - Recommended reading order
- [Related Documentation](#related-documentation) - Cross-references

**Core Documentation:**

- [Idioms](ex-soen-aute-to-pl__idioms.md) - Playwright patterns (auto-waiting, test fixtures, page objects)
- [Best Practices](ex-soen-aute-to-pl__best-practices.md) - Framework testing standards
- [Anti-Patterns](ex-soen-aute-to-pl__anti-patterns.md) - Common Playwright mistakes
- [Configuration](ex-soen-aute-to-pl__configuration.md) - playwright.config.ts, CI setup
- [Page Objects](ex-soen-aute-to-pl__page-objects.md) - Page Object Model, component patterns
- [Test Organization](ex-soen-aute-to-pl__test-organization.md) - Test structure, naming, grouping
- [Selectors](ex-soen-aute-to-pl__selectors.md) - Locator strategies, accessibility selectors
- [Assertions](ex-soen-aute-to-pl__assertions.md) - Web-first assertions, soft assertions
- [Debugging](ex-soen-aute-to-pl__debugging.md) - Trace viewer, inspector, debug mode

## Playwright Version Strategy

**Platform Standard**: Playwright 1.40+ is the target version for all E2E testing projects.

**Rationale**:

- Modern auto-waiting and retry mechanisms
- Comprehensive trace viewer for debugging
- Cross-browser support (Chromium, Firefox, WebKit)
- First-class TypeScript integration
- Built-in accessibility testing
- Visual regression testing capabilities

**Key Features**:

- Auto-waiting for elements to be actionable
- Network interception and mocking
- Multiple browser contexts for isolation
- Parallel test execution
- Trace artifacts for CI debugging
- Screenshot and video recording

## Documentation Structure

### [Playwright BDD Integration](ex-soen-aute-to-pl__bdd.md)

Using playwright-bdd to drive Playwright tests from Gherkin feature files.

**Covers**:

- When to use playwright-bdd vs vanilla Playwright spec files
- defineBddConfig setup (replaces testDir)
- bddgen code generation step
- createBdd() step definition patterns
- Cucumber expressions vs regex for URL-path steps
- Fixture parameter pattern (bddgen inspection requirement)
- Module-level response-store for API test state
- Nx project.json integration (bddgen && playwright test)

### [Playwright Idioms](ex-soen-aute-to-pl__idioms.md)

Framework-specific patterns for writing idiomatic Playwright tests.

**Covers**:

- Auto-waiting and actionability checks
- Test fixtures for setup/teardown
- Page Object Model patterns
- Locator strategies (role-based, text-based, CSS/XPath)
- Browser contexts and isolation
- Network interception
- Test retries and timeouts
- Parallel execution with workers

### [Playwright Best Practices](ex-soen-aute-to-pl__best-practices.md)

Proven approaches for building reliable E2E test suites.

**Covers**:

- Test organization and naming conventions
- Page object patterns and component composition
- Selector strategies (prefer accessibility roles)
- Assertion patterns (web-first assertions)
- Test data management
- API testing alongside UI testing
- Visual regression testing
- CI/CD integration and parallelization

### [Playwright Anti-Patterns](ex-soen-aute-to-pl__anti-patterns.md)

Common mistakes and problematic patterns to avoid.

**Covers**:

- Manual waits (sleep, waitForTimeout)
- Overly specific selectors (CSS classes, XPath)
- Sharing state between tests
- Missing test isolation
- Hardcoded test data
- Testing implementation details
- Flaky selectors
- Missing assertions

## Key Capabilities

### Auto-Waiting and Reliability

Playwright automatically waits for elements to be actionable:

- **Visible**: Element is visible in viewport
- **Stable**: Element has stopped moving/animating
- **Enabled**: Element is not disabled
- **Attached**: Element is attached to DOM

This eliminates manual waits and reduces test flakiness.

### Cross-Browser Testing

Single test codebase runs across all major browser engines:

- **Chromium**: Chrome, Edge, Brave
- **Firefox**: Mozilla Firefox
- **WebKit**: Safari engine (macOS/iOS rendering)

Each browser is automatically downloaded and managed.

### Trace Viewer and Debugging

Failed tests provide comprehensive debugging information:

- Complete timeline of actions
- Screenshots before/after each action
- Network activity and API calls
- Console logs and errors
- DOM snapshots at each step

### Parallel Execution

Playwright runs tests in parallel by default:

- **Workers**: Configurable parallel processes
- **Sharding**: Distribute tests across machines
- **Isolation**: Each test gets fresh browser context

## Use Cases

**Use Playwright when you need:**

✅ Cross-browser end-to-end testing
✅ Reliable UI automation with auto-waiting
✅ Comprehensive debugging with trace viewer
✅ Fast parallel test execution
✅ Network interception and API mocking
✅ Visual regression testing
✅ Accessibility testing
✅ TypeScript-first testing framework

**Consider alternatives when:**

✅ BDD-driven acceptance tests (use playwright-bdd)
❌ Mobile native apps (use Appium instead)
❌ Load testing (use k6/Artillery instead)
❌ Unit testing (use Jest/Vitest instead)

## Architecture Integration

### Test Organization

Typical Playwright test structure aligned with repository conventions:

```
apps/[app-name]/
├── tests/
│   ├── e2e/                       # End-to-end tests
│   │   ├── auth/                 # Authentication flows
│   │   │   ├── login.spec.ts
│   │   │   └── register.spec.ts
│   │   ├── payments/             # Payment features
│   │   │   ├── murabaha.spec.ts
│   │   │   └── zakat.spec.ts
│   │   └── navigation.spec.ts
│   ├── page-objects/              # Page Object Models
│   │   ├── pages/
│   │   │   ├── LoginPage.ts
│   │   │   ├── DashboardPage.ts
│   │   │   └── BasePage.ts
│   │   └── components/
│   │       ├── Header.ts
│   │       └── Sidebar.ts
│   ├── fixtures/                  # Test fixtures
│   │   ├── test-data.ts
│   │   └── test-users.ts
│   └── utils/                     # Test utilities
│       ├── api-helpers.ts
│       └── db-helpers.ts
├── playwright.config.ts           # Playwright configuration
└── package.json                   # Dependencies
```

### Page Object Pattern

**Page classes** encapsulate page-specific locators and actions:

```typescript
// LoginPage.ts
import { Page, Locator } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByRole("textbox", { name: "Email" });
    this.passwordInput = page.getByRole("textbox", { name: "Password" });
    this.submitButton = page.getByRole("button", { name: "Sign in" });
    this.errorMessage = page.getByRole("alert");
  }

  async goto() {
    await this.page.goto("/login");
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async expectError(message: string) {
    await expect(this.errorMessage).toHaveText(message);
  }
}
```

**Test specs** use page objects for clean test code:

```typescript
// login.spec.ts
import { test, expect } from "@playwright/test";
import { LoginPage } from "../page-objects/pages/LoginPage";

test.describe("Login", () => {
  test("successful login redirects to dashboard", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login("user@example.com", "password123");

    await expect(page).toHaveURL("/dashboard");
  });

  test("invalid credentials show error", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login("wrong@example.com", "wrongpass");

    await loginPage.expectError("Invalid email or password");
  });
});
```

## Development Workflow

### Project Setup

**Install Playwright in existing project:**

```bash
npm install -D @playwright/test
npx playwright install
```

**Initialize configuration:**

```bash
npx playwright init
```

### Configuration

**playwright.config.ts:**

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["html"], ["junit", { outputFile: "test-results/junit.xml" }]] : "html",
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
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

### Running Tests

```bash
# Run all tests
npx playwright test

# Run specific file
npx playwright test login.spec.ts

# Run in headed mode
npx playwright test --headed

# Run in debug mode
npx playwright test --debug

# Run with UI mode
npx playwright test --ui

# Generate test code
npx playwright codegen http://localhost:3000
```

### Debugging

**Trace viewer:**

```bash
# Show trace for failed tests
npx playwright show-trace trace.zip
```

**Inspector:**

```bash
# Step through tests interactively
npx playwright test --debug
```

## Learning Path

### 1. Start with Idioms

Read [Playwright Idioms](ex-soen-aute-to-pl__idioms.md) to understand framework patterns:

- Auto-waiting and actionability
- Test fixtures and contexts
- Locator strategies
- Browser isolation
- Network interception

### 2. Apply Best Practices

Read [Playwright Best Practices](ex-soen-aute-to-pl__best-practices.md) for production standards:

- Test organization and naming
- Page object patterns
- Selector strategies (accessibility-first)
- Test data management
- CI/CD integration

### 3. Avoid Anti-Patterns

Read [Playwright Anti-Patterns](ex-soen-aute-to-pl__anti-patterns.md) to prevent common mistakes:

- Manual waits and sleeps
- Overly specific selectors
- Test interdependencies
- Missing test isolation
- Flaky patterns

### 4. Integrate with Platform

Read complementary documentation:

- [TypeScript Standards](../../../programming-languages/typescript/README.md)
- [Testing Principles](../../../../../../governance/development/quality/code.md)
- [CI/CD Workflows](../../../../../../governance/development/workflow/implementation.md)

## Related Documentation

### Core Playwright Documentation

- **[Playwright Idioms](ex-soen-aute-to-pl__idioms.md)** - Framework patterns
- **[Playwright Best Practices](ex-soen-aute-to-pl__best-practices.md)** - Production standards
- **[Playwright Anti-Patterns](ex-soen-aute-to-pl__anti-patterns.md)** - Common mistakes

### Testing Documentation

- **[Configuration](ex-soen-aute-to-pl__configuration.md)** - Configuration management
- **[Page Objects](ex-soen-aute-to-pl__page-objects.md)** - Page Object Model
- **[Test Organization](ex-soen-aute-to-pl__test-organization.md)** - Test structure
- **[Selectors](ex-soen-aute-to-pl__selectors.md)** - Locator strategies

### Debugging Documentation

- **[Assertions](ex-soen-aute-to-pl__assertions.md)** - Assertion patterns
- **[Debugging](ex-soen-aute-to-pl__debugging.md)** - Debugging strategies

### Platform Documentation

- **[Automation Testing Index](../README.md)** - Parent testing documentation
- **[TypeScript Programming Language](../../../programming-languages/typescript/README.md)** - TypeScript idioms and standards
- **[Software Engineering Index](../../README.md)** - Software documentation root
- **[Monorepo Structure](../../../../../reference/re__monorepo-structure.md)** - Nx workspace organization

---

**Last Updated**: 2026-02-08
**Playwright Version**: 1.40+ (TypeScript, Node.js 18+)
**Maintainers**: Platform Documentation Team
