// @scenario specs/apps/ayokoding/www/behaviours/frontend/app-shell/accessibility.feature: Keyboard navigation moves through all interactive elements
// @scenario specs/apps/ayokoding/www/behaviours/frontend/app-shell/accessibility.feature: Buttons and interactive elements have ARIA labels
// @scenario specs/apps/ayokoding/www/behaviours/frontend/app-shell/accessibility.feature: Skip to content link is present
// @scenario specs/apps/ayokoding/www/behaviours/frontend/app-shell/accessibility.feature: Text color contrast meets WCAG AA standard
// @scenario specs/apps/ayokoding/www/behaviours/frontend/app-shell/accessibility.feature: Focus indicators are visible on interactive elements
import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const { When, Then } = createBdd();

// Gherkin "And" following a "When" is registered with When
When("the visitor presses Tab repeatedly", async ({ page, browserName }) => {
  const interactive = page.locator('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
  const expected: string[] = [];
  for (let index = 0; index < (await interactive.count()); index += 1) {
    const element = interactive.nth(index);
    const isTabbable = await element.evaluate((node) => {
      const control = node as HTMLElement & { disabled?: boolean };
      return (
        !control.disabled &&
        control.getAttribute("aria-disabled") !== "true" &&
        !control.closest("[inert]") &&
        control.tabIndex >= 0
      );
    });
    if ((await element.isVisible()) && isTabbable) {
      const marker = `keyboard-order-${index}`;
      await element.evaluate((node, value) => node.setAttribute("data-e2e-keyboard-order", value), marker);
      expected.push(marker);
    }
  }
  expect(expected.length).toBeGreaterThan(0);

  await page.evaluate(() => {
    const sentinel = document.createElement("span");
    sentinel.tabIndex = 0;
    sentinel.dataset.e2eKeyboardSentinel = "true";
    document.body.prepend(sentinel);
    sentinel.focus();
  });
  const reached: string[] = [];
  const tabKey = browserName === "webkit" ? "Alt+Tab" : "Tab";
  for (let index = 0; index < expected.length; index += 1) {
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
  await page.locator('[data-e2e-keyboard-sentinel="true"]').evaluate((node) => node.remove());
});

Then("focus should move through all interactive elements in a logical order", async ({ page }) => {
  const traversal = await page.locator("body").evaluate((body) => JSON.parse(body.dataset.keyboardTraversal ?? "{}"));
  expect(traversal.reached).toEqual(traversal.expected);
});

Then("no interactive element should be skipped or unreachable by keyboard", async ({ page }) => {
  const traversal = await page.locator("body").evaluate((body) => JSON.parse(body.dataset.keyboardTraversal ?? "{}"));
  expect(new Set(traversal.reached).size).toBe(traversal.expected.length);
});

When(
  "a visitor opens a content page with interactive controls such as the hamburger menu and search button",
  async ({ page }) => {
    await page.goto("/en");
  },
);

Then("each button should have an accessible name via an aria-label or visible label", async ({ page }) => {
  const buttons = page.getByRole("button");
  const count = await buttons.count();

  for (let i = 0; i < count; i++) {
    const button = buttons.nth(i);
    const ariaLabel = await button.getAttribute("aria-label");
    const ariaLabelledBy = await button.getAttribute("aria-labelledby");
    const innerText = await button.innerText();

    const hasAccessibleName =
      (ariaLabel !== null && ariaLabel.trim().length > 0) ||
      (ariaLabelledBy !== null && ariaLabelledBy.trim().length > 0) ||
      innerText.trim().length > 0;

    expect(hasAccessibleName, `Button at index ${i} lacks an accessible name`).toBe(true);
  }
});

Then("each interactive element should be identifiable by assistive technologies", async ({ page }) => {
  // All links should have accessible text
  const links = page.getByRole("link");
  const count = await links.count();

  for (let i = 0; i < count; i++) {
    const link = links.nth(i);
    const ariaLabel = await link.getAttribute("aria-label");
    const innerText = await link.innerText();
    const ariaHidden = await link.getAttribute("aria-hidden");

    // Skip decorative/hidden links
    if (ariaHidden === "true") continue;

    const hasAccessibleName = (ariaLabel !== null && ariaLabel.trim().length > 0) || innerText.trim().length > 0;

    expect(hasAccessibleName, `Link at index ${i} lacks an accessible name`).toBe(true);
  }
});

When("a visitor opens any page on the site", async ({ page }) => {
  await page.goto("/en");
});

Then("a skip to content link should be present in the page", async ({ page }) => {
  const skipLink = page.getByRole("link", {
    name: /skip.*(to |to main )?content/i,
  });
  await expect(skipLink).toBeAttached();
});

Then("the link should become visible when it receives keyboard focus", async ({ page }) => {
  // Focus the skip link directly then verify it becomes visible (removes sr-only).
  const skipLink = page.getByRole("link", {
    name: /skip.*(to |to main )?content/i,
  });
  await skipLink.focus();
  await expect(skipLink).toBeVisible();
});

Then("activating the link should move focus to the main content area", async ({ page }) => {
  const skipLink = page.getByRole("link", {
    name: /skip.*(to |to main )?content/i,
  });
  await skipLink.press("Enter");
  const main = page.getByRole("main");
  await expect(main).toBeFocused();
  await expect(page).toHaveURL(/#main-content$/u);
});

Then("all body text should meet a minimum contrast ratio of 4.5:1 against its background", async ({ page }) => {
  const results = await new AxeBuilder({ page }).withRules(["color-contrast"]).analyze();
  expect(results.violations).toEqual([]);
});

Then(
  "large text and headings should meet a minimum contrast ratio of 3:1 against their background",
  async ({ page }) => {
    const results = await new AxeBuilder({ page }).withRules(["color-contrast"]).analyze();
    expect(results.violations).toEqual([]);
  },
);

When("a visitor navigates to an interactive element using the keyboard", async ({ page, browserName }) => {
  await page.goto("/en");
  await page.evaluate(() => {
    const sentinel = document.createElement("span");
    sentinel.tabIndex = 0;
    sentinel.dataset.e2eFocusSentinel = "true";
    document.body.prepend(sentinel);
    sentinel.focus();
  });
  await page.keyboard.press(browserName === "webkit" ? "Alt+Tab" : "Tab");
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const focusMoved = await page.evaluate(
      () =>
        document.activeElement !== document.body && !document.activeElement?.hasAttribute("data-e2e-focus-sentinel"),
    );
    if (focusMoved) break;
    await page.keyboard.press("Tab");
  }
  await page.locator('[data-e2e-focus-sentinel="true"]').evaluate((node) => node.remove());
});

Then("a visible focus indicator should be displayed on that element", async ({ page }) => {
  // After Tab, a focusable element (link or button) should have focus.
  const focusedLink = page.locator("a:focus, button:focus, input:focus, [tabindex]:focus").first();
  // Fallback: use any :focus element
  const fallback = page.locator(":focus").first();
  const focused = (await focusedLink.count()) > 0 ? focusedLink : fallback;
  await expect(focused).toBeAttached({ timeout: 5000 });
  await expect(focused).toBeVisible({ timeout: 5000 });
});

Then("the focus indicator should have sufficient contrast against the surrounding background", async ({ page }) => {
  const result = await page.evaluate(() => {
    const element = document.activeElement;
    if (!(element instanceof HTMLElement) || element === document.body) {
      return { ratio: 0, element: "body", outline: "", boxShadow: "", background: "" };
    }
    const rgb = (value: string): [number, number, number] | undefined => {
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) return undefined;
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = value;
      context.fillRect(0, 0, 1, 1);
      const [red, green, blue, alpha] = context.getImageData(0, 0, 1, 1).data;
      return alpha === 0 ? undefined : [red!, green!, blue!];
    };
    const luminance = (channels: [number, number, number]): number => {
      const linear = channels.map((channel) => {
        const value = channel / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * linear[0]! + 0.7152 * linear[1]! + 0.0722 * linear[2]!;
    };
    const styles = getComputedStyle(element);
    const indicator =
      parseFloat(styles.outlineWidth) > 0 && styles.outlineStyle !== "none"
        ? rgb(styles.outlineColor)
        : styles.boxShadow === "none"
          ? undefined
          : rgb(styles.boxShadow);
    let ancestor: HTMLElement | null = element.parentElement;
    let background: [number, number, number] | undefined;
    while (ancestor && !background) {
      const candidate = getComputedStyle(ancestor).backgroundColor;
      if (candidate !== "transparent" && !candidate.endsWith(", 0)")) background = rgb(candidate);
      ancestor = ancestor.parentElement;
    }
    if (!indicator || !background) {
      return {
        ratio: 0,
        element: element.outerHTML,
        outline: `${styles.outlineWidth} ${styles.outlineStyle} ${styles.outlineColor}`,
        boxShadow: styles.boxShadow,
        background: background?.join(",") ?? "",
      };
    }
    const values = [luminance(indicator), luminance(background)].sort((a, b) => b - a);
    return {
      ratio: (values[0]! + 0.05) / (values[1]! + 0.05),
      element: element.outerHTML,
      outline: `${styles.outlineWidth} ${styles.outlineStyle} ${styles.outlineColor}`,
      boxShadow: styles.boxShadow,
      background: background.join(","),
    };
  });
  expect(result.ratio, JSON.stringify(result)).toBeGreaterThanOrEqual(3);
});
