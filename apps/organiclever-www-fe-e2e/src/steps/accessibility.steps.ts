// @scenario specs/apps/organiclever/www/behaviours/frontend/accessibility/accessibility.feature: Pages have proper heading hierarchy
// @scenario specs/apps/organiclever/www/behaviours/frontend/accessibility/accessibility.feature: Keyboard navigation works throughout the app
// @scenario specs/apps/organiclever/www/behaviours/frontend/accessibility/accessibility.feature: Color contrast meets WCAG AA requirements
// @scenario specs/apps/organiclever/www/behaviours/frontend/accessibility/accessibility.feature: Images have text alternatives
// @scenario specs/apps/organiclever/www/behaviours/frontend/accessibility/accessibility.feature: Navigation landmarks are labeled

/**
 * Step definitions for the Accessibility Compliance feature.
 *
 * Covers: specs/apps/organiclever/app-web/behaviours/layout/accessibility.feature
 *
 * Uses axe-core via @axe-core/playwright to validate WCAG AA compliance and
 * supplements automated scanning with targeted assertions for heading hierarchy,
 * keyboard navigation, and ARIA usage.
 */
import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const { Given, When, Then } = createBdd();
let keyboardFocusOrderIsComplete = false;

Given("the app is running", async ({ request }) => {
  const response = await request.get("/");
  expect(response.status(), "the public landing page must be reachable").toBeLessThan(400);
});

When("I navigate to any page", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("load");
});

When("I navigate to the landing page", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("load");
  keyboardFocusOrderIsComplete = false;
});

Then("each page should have exactly one h1 element", async ({ page }) => {
  const h1Count = await page.locator("h1").count();
  expect(h1Count).toBe(1);
});

Then(/^heading levels should not skip \(no h1 followed by h3\)$/, async ({ page }) => {
  // Collect all heading levels in document order and verify no level is skipped.
  const headingLevels = await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6"));
    return headings.map((h) => parseInt(h.tagName.replace("H", ""), 10));
  });

  for (let i = 1; i < headingLevels.length; i++) {
    const prev = headingLevels[i - 1];
    const curr = headingLevels[i];
    if (prev !== undefined && curr !== undefined && curr > prev) {
      expect(curr - prev, `Heading level jumped from h${prev} to h${curr}`).toBeLessThanOrEqual(1);
    }
  }
});

Then("I should be able to tab to all interactive elements", async ({ page, browserName }) => {
  const interactive = page.locator(
    'a[href]:visible, button:not([disabled]):visible, input:not([disabled]):visible, select:not([disabled]):visible, textarea:not([disabled]):visible, [tabindex]:not([tabindex="-1"]):visible',
  );
  const count = await interactive.count();
  expect(count).toBeGreaterThan(0);
  await page.locator("body").evaluate((body) => {
    body.tabIndex = -1;
    body.focus();
  });
  const tabKey = browserName === "webkit" ? "Alt+Tab" : "Tab";
  for (let index = 0; index < count; index += 1) {
    await page.keyboard.press(tabKey);
    expect(
      await interactive.nth(index).evaluate((element) => element === document.activeElement),
      `interactive element ${index + 1} should receive focus in document order`,
    ).toBe(true);
  }
  keyboardFocusOrderIsComplete = true;
});

Then("focus indicators should be visible", async ({ page }) => {
  expect(keyboardFocusOrderIsComplete).toBe(true);
  const hasFocused = await page
    .locator(":focus")
    .count()
    .catch(() => 0);
  expect(hasFocused, "keyboard navigation must leave a visible element focused").toBeGreaterThan(0);
  // Use .first() to handle Next.js Shadow DOM exposing multiple :focus matches.
  const outline = await page
    .locator(":focus")
    .first()
    .evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.outline !== "none" || style.outlineWidth !== "0px";
    });
  expect(outline).toBe(true);
});

Then(/^all text should meet WCAG AA contrast ratio \(4\.5:1 for normal text\)$/, async ({ page }) => {
  const results = await new AxeBuilder({ page }).withRules(["color-contrast"]).analyze();
  expect(results.violations).toHaveLength(0);
});

Then("all interactive elements should have sufficient contrast", async ({ page }) => {
  const results = await new AxeBuilder({ page }).withRules(["color-contrast"]).analyze();
  expect(results.violations).toHaveLength(0);
});

Then("images should have alt attributes", async ({ page }) => {
  const images = await page.locator("img").all();
  for (const img of images) {
    const alt = await img.getAttribute("alt");
    // alt="" is valid for decorative images; only null is invalid.
    expect(alt, "Image must have an alt attribute").not.toBeNull();
  }
});

Then("navigation landmarks should be properly labeled", async ({ page }) => {
  const navElements = await page.getByRole("navigation").all();
  expect(navElements.length).toBeGreaterThan(0);
  for (const nav of navElements) {
    const ariaLabel = await nav.getAttribute("aria-label");
    const ariaLabelledBy = await nav.getAttribute("aria-labelledby");
    expect(Boolean(ariaLabel ?? ariaLabelledBy), "Navigation landmark must expose an accessible label").toBe(true);
  }
});
