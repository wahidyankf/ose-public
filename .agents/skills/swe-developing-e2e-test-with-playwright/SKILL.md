---
name: swe-developing-e2e-test-with-playwright
description: Playwright E2E testing standards from authoritative docs/explanation/software-engineering/automation-testing/tools/playwright/ documentation
---

# Playwright E2E Testing Standards

## Purpose

Progressive disclosure of Playwright end-to-end testing standards for agents writing E2E tests.

**Authoritative Source**: [docs/explanation/software-engineering/automation-testing/tools/playwright/README.md](../../../docs/explanation/software-engineering/automation-testing/tools/playwright/README.md)

**Usage**: Auto-loaded for agents when writing Playwright E2E tests. Provides quick reference to test organization, selectors, assertions, page objects, and debugging patterns.

## Quick Standards Reference

- [Test Organization, Selectors, Assertions](./reference/test-org-selectors-assertions.md) — file structure, naming, accessibility-first selector priority, web-first assertions
- [Page Object Model and Configuration](./reference/page-objects-config.md) — class-based POM pattern, playwright.config.ts standards
- [Best Practices, Anti-Patterns, Debugging](./reference/best-practices-antipatterns-debugging.md) — test isolation, API+UI combination, common anti-patterns, trace viewer/inspector

## OSE Platform Context

### Islamic Finance Testing

**Zakat Calculator Tests**:

```typescript
test("calculates zakat correctly", async ({ page }) => {
  await page.goto("/zakat-calculator");
  await page.getByLabel("Wealth Amount").fill("100000");
  await page.getByRole("button", { name: "Calculate" }).click();

  // Verify 2.5% calculation
  await expect(page.getByTestId("zakat-amount")).toHaveText("RM 2,500.00");
});
```

**Murabaha Contract Tests**:

```typescript
test("murabaha contract workflow", async ({ page }) => {
  const murabaha = new MurabahaPage(page);
  await murabaha.goto();
  await murabaha.createContract({
    asset: "Vehicle",
    cost: 50000,
    profitRate: 5,
  });

  await expect(page.getByText("Contract Created")).toBeVisible();
  await expect(page.getByTestId("total-payment")).toContainText("52,500");
});
```

## Test-Driven Development for E2E

TDD applies to E2E test authoring: write the failing Playwright spec — or a failing Playwright-MCP
manual verification script — **before** the feature implementation exists. Both forms follow
Red→Green→Refactor:

- **Red**: Author the `.spec.ts` or manual verification script and run it. It must fail because the
  feature does not yet exist, not because of a misconfigured test environment.
- **Green**: The feature implementation makes every Playwright assertion or manual observation pass.
- **Refactor**: Improve locators, page objects, and fixture composition while keeping all assertions
  green.

Manual verification scripts are TDD-compliant when they are written, dated, repeatable, and contain
discrete expected observations (e.g., "Navigate to /products → snapshot shows product list with 3
items"). Informal "tested manually" notes are not TDD-compliant. Promote manual scripts to
automated Playwright specs whenever the behaviour recurs.

**Canonical references**:

- [Test-Driven Development Convention](../../../repo-governance/development/workflow/test-driven-development.md)
  — full Red→Green→Refactor rules, "Manual verification is part of TDD" subsection, and all test
  levels covered.
- [Manual Behavioural Verification](../../../repo-governance/development/quality/manual-behavioural-verification.md)
  — real-browser checklists, `rtk curl` for HTTP APIs, and protocol-native clients for non-HTTP APIs.

## Related Standards

**See Authoritative Documentation**:

- [Test Organization](../../../docs/explanation/software-engineering/automation-testing/tools/playwright/test-organization.md) - Test structure, fixtures, grouping
- [Selectors](../../../docs/explanation/software-engineering/automation-testing/tools/playwright/selectors.md) - Accessibility-first selector strategies
- [Assertions](../../../docs/explanation/software-engineering/automation-testing/tools/playwright/assertions.md) - Web-first assertions
- [Page Objects](../../../docs/explanation/software-engineering/automation-testing/tools/playwright/page-objects.md) - Page Object Model patterns
- [Configuration](../../../docs/explanation/software-engineering/automation-testing/tools/playwright/configuration.md) - playwright.config.ts setup
- [Best Practices](../../../docs/explanation/software-engineering/automation-testing/tools/playwright/best-practices.md) - Production testing standards
- [Anti-Patterns](../../../docs/explanation/software-engineering/automation-testing/tools/playwright/anti-patterns.md) - Common mistakes
- [Idioms](../../../docs/explanation/software-engineering/automation-testing/tools/playwright/idioms.md) - Playwright-specific patterns
- [Debugging](../../../docs/explanation/software-engineering/automation-testing/tools/playwright/debugging.md) - Trace viewer, inspector
