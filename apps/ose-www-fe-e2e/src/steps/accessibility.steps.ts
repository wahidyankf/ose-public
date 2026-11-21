import { expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createBdd } from "playwright-bdd";

// @scenario specs/apps/ose/www/behaviours/frontend/app-shell/accessibility.feature: Home page has no accessibility violations
// @scenario specs/apps/ose/www/behaviours/frontend/app-shell/accessibility.feature: Headings follow a proper hierarchy
// @scenario specs/apps/ose/www/behaviours/frontend/app-shell/accessibility.feature: All interactive elements are keyboard accessible
// @scenario specs/apps/ose/www/behaviours/frontend/app-shell/accessibility.feature: Text color contrast meets WCAG AA standard
// @scenario specs/apps/ose/www/behaviours/frontend/app-shell/accessibility.feature: Focus indicators are visible on interactive elements

const { When, Then } = createBdd();

When("a visitor opens the home page", async ({ page }) => {
  await page.goto("/");
});

Then("the page should have no accessibility violations", async ({ page }) => {
  const results = await new AxeBuilder({ page }).analyze();
  if (results.violations.length > 0) {
    console.log(
      `[a11y] ${results.violations.length} violation(s) found:`,
      results.violations.map((violation) => ({
        rule: `${violation.impact}: ${violation.id}`,
        targets: violation.nodes.map(({ target }) => target),
      })),
    );
  }
  expect(results.violations).toEqual([]);
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

When("the visitor presses Tab repeatedly", async ({ page, browserName }) => {
  const interactive = page.locator('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
  const expected: string[] = [];
  for (let index = 0; index < (await interactive.count()); index += 1) {
    const element = interactive.nth(index);
    if (await element.isVisible()) {
      const marker = `keyboard-order-${index}`;
      await element.evaluate((node, value) => node.setAttribute("data-e2e-keyboard-order", value), marker);
      expected.push(marker);
    }
  }
  expect(expected.length).toBeGreaterThan(0);

  await page.locator("body").evaluate((body) => {
    body.tabIndex = -1;
    body.focus();
  });
  const reached: string[] = [];
  const tabKey = browserName === "webkit" ? "Alt+Tab" : "Tab";
  for (let index = 0; index < expected.length + 5; index += 1) {
    await page.keyboard.press(tabKey);
    const marker = await page.evaluate(() => document.activeElement?.getAttribute("data-e2e-keyboard-order"));
    if (marker && !reached.includes(marker)) reached.push(marker);
  }
  await page.locator("body").evaluate(
    (body, traversal) => {
      body.dataset.keyboardTraversal = JSON.stringify(traversal);
    },
    { expected, reached },
  );
});

Then("focus should move through all interactive elements in logical order", async ({ page }) => {
  const traversal = await page.locator("body").evaluate((body) => JSON.parse(body.dataset.keyboardTraversal ?? "{}"));
  expect(traversal.reached).toEqual(traversal.expected);
});

Then("no interactive element should be skipped or unreachable by keyboard", async ({ page }) => {
  const traversal = await page.locator("body").evaluate((body) => JSON.parse(body.dataset.keyboardTraversal ?? "{}"));
  expect(new Set(traversal.reached).size).toBe(traversal.expected.length);
});

When("a visitor opens any page on the site", async ({ page }) => {
  await page.goto("/");
});

Then(
  "all body text should meet a minimum contrast ratio of {float}:{int} against its background",
  async ({ page }, _ratio: number, _denominator: number) => {
    const results = await new AxeBuilder({ page }).withRules(["color-contrast"]).analyze();
    if (results.violations.length > 0) {
      console.log(
        `[a11y] contrast violations:`,
        results.violations.map((v) => `${v.impact}: ${v.nodes.length} nodes`),
      );
    }
    expect(results.violations).toEqual([]);
  },
);

Then(
  "large text and headings should meet a minimum contrast ratio of {int}:{int} against their background",
  async ({ page }, _ratio: number, _denominator: number) => {
    // Large text contrast is checked by axe-core's color-contrast rule (WCAG AA: 3:1 for large text)
    const results = await new AxeBuilder({ page }).withRules(["color-contrast"]).analyze();
    expect(results.violations).toEqual([]);
  },
);

When("a visitor navigates to an interactive element using the keyboard", async ({ page, browserName }) => {
  await page.goto("/");
  await page.locator("body").evaluate((body) => {
    body.tabIndex = -1;
    body.focus();
  });
  const tabKey = browserName === "webkit" ? "Alt+Tab" : "Tab";
  for (let index = 0; index < 10; index += 1) {
    await page.keyboard.press(tabKey);
    if (await page.evaluate(() => document.activeElement !== document.body)) break;
  }
});

Then("a visible focus indicator should be displayed on that element", async ({ page }) => {
  // Verify an interactive element has keyboard focus — CSS focus-ring rendering is browser/OS
  // dependent (especially on webkit), so we assert focus placement, not computed outline style.
  const hasFocusedElement = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return false;
    const tag = el.tagName.toLowerCase();
    const tabIndex = el.getAttribute("tabindex");
    return ["a", "button", "input", "select", "textarea"].includes(tag) || (tabIndex !== null && tabIndex !== "-1");
  });
  expect(hasFocusedElement).toBe(true);
});

Then("the focus indicator should have sufficient contrast against the surrounding background", async ({ page }) => {
  const contrastResult = await page.evaluate(() => {
    const element = document.activeElement;
    if (!(element instanceof HTMLElement) || element === document.body) {
      return { contrast: 0, element: element?.tagName ?? "none", indicator: "none", background: "none" };
    }

    const parseColour = (value: string): { channels: [number, number, number]; alpha: number } | undefined => {
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      const context = canvas.getContext("2d");
      if (!context) return undefined;
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = value;
      context.fillRect(0, 0, 1, 1);
      const [red = 0, green = 0, blue = 0, alpha = 0] = context.getImageData(0, 0, 1, 1).data;
      return { channels: [red, green, blue], alpha };
    };
    const luminance = (channels: [number, number, number]): number => {
      const linear = channels.map((channel) => {
        const value = channel / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * (linear[0] ?? 0) + 0.7152 * (linear[1] ?? 0) + 0.0722 * (linear[2] ?? 0);
    };

    const styles = window.getComputedStyle(element);
    const hasOutline = parseFloat(styles.outlineWidth) > 0 && styles.outlineStyle !== "none";
    const shadowColour = styles.boxShadow.match(/(?:rgba?|hsla?|oklab|lab)\([^)]*\)/u)?.[0];
    const indicator = parseColour(hasOutline ? styles.outlineColor : (shadowColour ?? "transparent"));
    let ancestor: HTMLElement | null = element;
    let background: [number, number, number] | undefined;
    while (ancestor && !background) {
      const candidate = window.getComputedStyle(ancestor).backgroundColor;
      const parsed = parseColour(candidate);
      if (parsed?.alpha === 255) background = parsed.channels;
      ancestor = ancestor.parentElement;
    }
    if (!indicator || indicator.alpha !== 255 || !background) {
      return {
        contrast: 0,
        element: element.tagName,
        indicator: hasOutline ? styles.outlineColor : styles.boxShadow,
        background: background?.join(",") ?? "none",
      };
    }
    const [lighter, darker] = [luminance(indicator.channels), luminance(background)].sort((a, b) => b - a);
    return {
      contrast: ((lighter ?? 0) + 0.05) / ((darker ?? 0) + 0.05),
      element: element.tagName,
      indicator: hasOutline ? styles.outlineColor : styles.boxShadow,
      background: background.join(","),
    };
  });
  expect(contrastResult.contrast, JSON.stringify(contrastResult)).toBeGreaterThanOrEqual(3);
});
