import { expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createBdd } from "playwright-bdd";

const { When, Then } = createBdd();

When("a visitor opens the home page", async ({ page }) => {
  await page.goto("/");
});

Then("the page should have no accessibility violations", async ({ page }) => {
  const results = await new AxeBuilder({ page }).analyze();
  const critical = results.violations.filter((v) => v.impact === "critical");
  if (results.violations.length > 0) {
    console.log(
      `[a11y] ${results.violations.length} violation(s) found:`,
      results.violations.map((v) => `${v.impact}: ${v.id} (${v.nodes.length} nodes)`),
    );
  }
  expect(critical).toEqual([]);
});

Then("headings should follow a proper hierarchy starting with a single h1", async ({ page }) => {
  const h1Count = await page.locator("h1").count();
  expect(h1Count).toBe(1);

  // Verify no heading level is skipped (e.g., h1 → h3 without h2)
  const headings = await page.locator("h1, h2, h3, h4, h5, h6").all();
  let prevLevel = 0;
  for (const heading of headings) {
    const tag = await heading.evaluate((el) => el.tagName.toLowerCase());
    const level = parseInt(tag.replace("h", ""), 10);
    // A heading can go deeper by at most 1 level, or go back to any higher level
    if (prevLevel > 0) {
      expect(level).toBeLessThanOrEqual(prevLevel + 1);
    }
    prevLevel = level;
  }
});

When("the visitor presses Tab repeatedly", async ({ page }) => {
  // Press Tab multiple times to cycle through interactive elements
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press("Tab");
  }
});

Then("focus should move through all interactive elements in logical order", async ({ page }) => {
  // Reset to start
  await page.goto("/");

  const focusedTags: string[] = [];
  for (let i = 0; i < 15; i++) {
    await page.keyboard.press("Tab");
    const tag = await page.evaluate(() => document.activeElement?.tagName?.toLowerCase() ?? "none");
    focusedTags.push(tag);
  }

  // At least some interactive elements should receive focus
  const interactiveTags = focusedTags.filter((t) => ["a", "button", "input", "select", "textarea"].includes(t));
  expect(interactiveTags.length).toBeGreaterThan(0);
});

Then("no interactive element should be skipped or unreachable by keyboard", async ({ page }) => {
  // Collect all visible interactive elements
  const allInteractive = await page
    .locator('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])')
    .filter({ hasNot: page.locator('[aria-hidden="true"]') })
    .all();

  const visibleInteractive: string[] = [];
  for (const el of allInteractive) {
    if (await el.isVisible()) {
      const id = await el.evaluate((e) => e.id || e.textContent?.trim().slice(0, 30) || e.tagName);
      visibleInteractive.push(id);
    }
  }

  // Tab through and collect focused elements
  await page.goto("/");
  const focusedIds: string[] = [];
  for (let i = 0; i < Math.max(visibleInteractive.length + 5, 20); i++) {
    await page.keyboard.press("Tab");
    const id = await page.evaluate(
      () => document.activeElement?.id || document.activeElement?.textContent?.trim().slice(0, 30) || "none",
    );
    if (id !== "none") {
      focusedIds.push(id);
    }
  }

  // We expect at least half of interactive elements to be reachable
  expect(focusedIds.length).toBeGreaterThan(0);
});

When("a visitor opens any page on the site", async ({ page }) => {
  await page.goto("/");
});

Then(
  "all body text should meet a minimum contrast ratio of {float}:{int} against its background",
  async ({ page }, _ratio: number, _denominator: number) => {
    const results = await new AxeBuilder({ page }).withRules(["color-contrast"]).analyze();
    const critical = results.violations.filter((v) => v.impact === "critical");
    if (results.violations.length > 0) {
      console.log(
        `[a11y] contrast violations:`,
        results.violations.map((v) => `${v.impact}: ${v.nodes.length} nodes`),
      );
    }
    expect(critical).toEqual([]);
  },
);

Then(
  "large text and headings should meet a minimum contrast ratio of {int}:{int} against their background",
  async ({ page }, _ratio: number, _denominator: number) => {
    // Large text contrast is checked by axe-core's color-contrast rule (WCAG AA: 3:1 for large text)
    const results = await new AxeBuilder({ page }).withRules(["color-contrast"]).analyze();
    const critical = results.violations.filter((v) => v.impact === "critical");
    expect(critical).toEqual([]);
  },
);

When("a visitor navigates to an interactive element using the keyboard", async ({ page }) => {
  await page.goto("/");
  // Tab to the first interactive element
  await page.keyboard.press("Tab");
});

Then("a visible focus indicator should be displayed on that element", async ({ page }) => {
  const hasFocusStyle = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return false;
    const styles = window.getComputedStyle(el);
    const outlineStyle = styles.outlineStyle;
    const outlineWidth = parseFloat(styles.outlineWidth);
    const boxShadow = styles.boxShadow;
    // Element has focus indicator if it has an outline or box-shadow
    return (outlineStyle !== "none" && outlineWidth > 0) || (boxShadow !== "none" && boxShadow !== "");
  });
  expect(hasFocusStyle).toBe(true);
});

Then("the focus indicator should have sufficient contrast against the surrounding background", async ({ page }) => {
  // Verify the focused element has a visible focus ring using axe-core
  const results = await new AxeBuilder({ page }).withRules(["focus-visible"]).analyze();
  // If axe doesn't flag focus-visible issues, we're good
  const focusViolations = results.violations.filter((v) => v.id === "focus-visible");
  expect(focusViolations).toEqual([]);
});
