import { expect, type Page } from "@playwright/test";
import { createBdd } from "playwright-bdd";

// Scenario bindings: each scenario below runs in this file at integration and e2e levels (repo-config.yml).
// @scenario specs/libs/web-ui/behaviours/command/command.feature: A command palette filters items as the user types and runs the chosen item
// @scenario specs/libs/web-ui/behaviours/command/command.feature: A command palette shows its empty message when nothing matches
// @scenario specs/libs/web-ui/behaviours/dropdown-menu/dropdown-menu.feature: A dropdown menu opens from its trigger and moves by keyboard
// @scenario specs/libs/web-ui/behaviours/dropdown-menu/dropdown-menu.feature: Checkbox and radio items show and change their selection
// @scenario specs/libs/web-ui/behaviours/tabs/tabs.feature: Activating a tab shows its panel and hides the others
// @scenario specs/libs/web-ui/behaviours/tooltip/tooltip.feature: A tooltip shows on hover and on keyboard focus
// @scenario specs/libs/web-ui/behaviours/scroll-area/scroll-area.feature: A scroll area scrolls overflowing content
// @scenario specs/libs/web-ui/behaviours/separator/separator.feature: A separator renders horizontal or vertical and decorative by default
// @scenario specs/libs/web-ui/behaviours/table/table.feature: A table exposes header, body, rows, cells, and caption as table semantics
// @scenario specs/libs/web-ui/behaviours/highlight-text/highlight-text.feature: Every case-insensitive match is marked
// @scenario specs/libs/web-ui/behaviours/scroll-to-top/scroll-to-top.feature: The button appears past the threshold and scrolls the page to the top
// @scenario specs/libs/web-ui/behaviours/search-component/search-component.feature: Typing updates the term and URL; Clear search empties both
// @scenario specs/libs/web-ui/behaviours/theme-toggle/theme-toggle.feature: The toggle switches the theme, relabels itself, and remembers the choice

const { Given, When, Then } = createBdd();
const STORYBOOK_ROOT = "#storybook-root";
const HARNESS_ID = "verification-bddharness--default";

async function loadHarness(page: Page, caseName: string, options: Record<string, string> = {}): Promise<void> {
  const parameters = new URLSearchParams({ id: HARNESS_ID, viewMode: "story", case: caseName, ...options });
  await page.goto(`/iframe.html?${parameters.toString()}`);
  await expect(page.locator(STORYBOOK_ROOT)).toBeAttached();
  await page.waitForFunction(
    () =>
      (document.querySelector("#storybook-root")?.childNodes.length ?? 0) > 0 ||
      document.querySelector('[role="dialog"]'),
  );
  await page.evaluate(() => document.fonts.ready);
}

/** A Radix menu closes after an item is chosen, so reopen it when a step needs to read it. */
async function ensureMenuOpen(page: Page): Promise<void> {
  if (!(await page.getByRole("menu").isVisible())) {
    await page.locator('[data-testid="menu-trigger"]').click();
  }
}

// Command palette (command.feature)
Given('a command palette lists the items "Home", "Settings", and "Sign out"', async ({ page }) => {
  await loadHarness(page, "command");
});

When(/^the user types "([^"]*)" into the command palette$/, async ({ page }, text: string) => {
  await page.getByPlaceholder("Type a command...").fill(text);
});

Then(/^only the item "([^"]+)" is listed$/, async ({ page }, item: string) => {
  await expect(page.getByRole("option")).toHaveCount(1);
  await expect(page.getByRole("option", { name: item })).toBeVisible();
});

When(/^the user chooses the item "([^"]+)"$/, async ({ page }, item: string) => {
  await page.getByRole("option", { name: item }).click();
});

Then(/^the chosen item is "([^"]+)"$/, async ({ page }, item: string) => {
  await expect(page.getByTestId("event-probe")).toHaveText(item);
});

Then(/^the empty message "([^"]+)" is shown$/, async ({ page }, message: string) => {
  await expect(page.getByText(message)).toBeVisible();
});

// Dropdown menu (dropdown-menu.feature)
Given(/^a dropdown menu with the items "Profile", "Billing", and "Log out"$/, async ({ page }) => {
  await loadHarness(page, "dropdown-menu");
});

Given(
  /^a dropdown menu with the checkbox item "Show hidden" and the radio items "Small" and "Large"$/,
  async ({ page }) => {
    await loadHarness(page, "dropdown-options");
  },
);

When("the user clicks the menu trigger", async ({ page }) => {
  await page.locator('[data-testid="menu-trigger"]').click();
});

Then(/^the menu lists the items "Profile", "Billing", and "Log out"$/, async ({ page }) => {
  for (const item of ["Profile", "Billing", "Log out"]) {
    await expect(page.getByRole("menuitem", { name: item })).toBeVisible();
  }
});

When("the user presses ArrowDown in the menu", async ({ page }) => {
  await page.keyboard.press("ArrowDown");
});

Then(/^the item "([^"]+)" has keyboard focus$/, async ({ page }, item: string) => {
  await expect(page.getByRole("menuitem", { name: item })).toBeFocused();
});

When(/^the user clicks the checkbox item "([^"]+)"$/, async ({ page }, item: string) => {
  await ensureMenuOpen(page);
  await page.getByRole("menuitemcheckbox", { name: item }).click();
});

Then(/^the checkbox item "([^"]+)" is checked$/, async ({ page }, item: string) => {
  await ensureMenuOpen(page);
  await expect(page.getByRole("menuitemcheckbox", { name: item })).toHaveAttribute("aria-checked", "true");
});

When(/^the user selects the radio item "([^"]+)"$/, async ({ page }, item: string) => {
  await ensureMenuOpen(page);
  await page.getByRole("menuitemradio", { name: item }).click();
});

Then(
  /^the radio item "([^"]+)" is checked and the radio item "([^"]+)" is not checked$/,
  async ({ page }, checked: string, unchecked: string) => {
    await ensureMenuOpen(page);
    await expect(page.getByRole("menuitemradio", { name: checked })).toHaveAttribute("aria-checked", "true");
    await expect(page.getByRole("menuitemradio", { name: unchecked })).toHaveAttribute("aria-checked", "false");
  },
);

// Tabs (tabs.feature)
Given(/^tabs "Overview" and "Details" with the "Overview" panel showing$/, async ({ page }) => {
  await loadHarness(page, "tabs");
});

When(/^the user activates the "([^"]+)" tab$/, async ({ page }, tab: string) => {
  await page.getByRole("tab", { name: tab }).click();
});

Then(/^the "([^"]+)" panel is shown$/, async ({ page }, tab: string) => {
  await expect(page.getByText(`${tab} panel`)).toBeVisible();
});

Then(/^the "([^"]+)" panel is hidden$/, async ({ page }, tab: string) => {
  await expect(page.getByText(`${tab} panel`)).toHaveCount(0);
});

// Tooltip (tooltip.feature)
Given(/^a button labelled "([^"]+)" with the tooltip "([^"]+)"$/, async ({ page }) => {
  await loadHarness(page, "tooltip");
});

When("the user hovers the button", async ({ page }) => {
  await page.getByRole("button", { name: "Save" }).hover();
});

When("the user moves the pointer away and focuses the button with the keyboard", async ({ page }) => {
  await page.mouse.move(0, 0);
  await page.getByRole("button", { name: "Save" }).focus();
});

Then(/^the tooltip "([^"]+)" is shown$/, async ({ page }, text: string) => {
  await expect(page.locator('[data-slot="tooltip-content"]').filter({ hasText: text })).toBeVisible();
});

// Scroll area (scroll-area.feature)
Given("a scroll area 100 pixels tall holding 400 pixels of content", async ({ page }) => {
  await loadHarness(page, "scroll-area");
});

When("the user scrolls the area down by 150 pixels", async ({ page }) => {
  await page.locator('[data-slot="scroll-area-viewport"]').hover();
  await page.mouse.wheel(0, 150);
});

Then("the scroll area is scrolled to 150 pixels", async ({ page }) => {
  await expect
    .poll(() => page.locator('[data-slot="scroll-area-viewport"]').evaluate((element) => element.scrollTop))
    .toBe(150);
});

// Separator (separator.feature)
Given(
  /^a separator with orientation "([^"]+)" and decorative "([^"]+)"$/,
  async ({ page }, orientation, decorative) => {
    await loadHarness(page, "separator", { orientation, decorative });
  },
);

Then(/^the separator has the orientation "([^"]+)"$/, async ({ page }, orientation: string) => {
  await expect(page.locator('[data-slot="separator"]')).toHaveAttribute("data-orientation", orientation);
});

Then(/^the separator has the role "([^"]+)"$/, async ({ page }, role: string) => {
  await expect(page.locator('[data-slot="separator"]')).toHaveAttribute("role", role);
});

// Table (table.feature)
Given(
  /^a table with the caption "([^"]+)", the column header "([^"]+)", and the body row cell "([^"]+)"$/,
  async ({ page }) => {
    await loadHarness(page, "table");
  },
);

Then(/^the table has the caption "([^"]+)"$/, async ({ page }, caption: string) => {
  await expect(page.getByRole("table").locator("caption")).toHaveText(caption);
});

Then(/^the table has the column header "([^"]+)"$/, async ({ page }, header: string) => {
  await expect(page.getByRole("columnheader", { name: header })).toBeVisible();
});

Then(/^the table has a body row with the cell "([^"]+)"$/, async ({ page }, cell: string) => {
  await expect(page.locator("tbody tr").getByRole("cell", { name: cell })).toBeVisible();
});

// Highlight text (highlight-text.feature)
Given(/^the text "([^"]+)" is highlighted for the search "([^"]+)"$/, async ({ page }, text: string, term: string) => {
  await loadHarness(page, "highlight", { text, term });
});

Then(/^the marked parts are "([^"]+)" and "([^"]+)"$/, async ({ page }, first: string, second: string) => {
  await expect(page.locator("mark")).toHaveText([first, second]);
});

// Scroll to top (scroll-to-top.feature)
Given(/^the page is scrolled to (\d+) pixels with a threshold of (\d+) pixels$/, async ({ page }, y: string) => {
  await loadHarness(page, "scroll-to-top");
  await page.evaluate((top) => window.scrollTo(0, top), Number(y));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(Number(y));
});

Then("the scroll to top button is hidden", async ({ page }) => {
  await expect(page.getByRole("button", { name: "Scroll to top" })).toHaveCount(0);
});

When(/^the user scrolls the page to (\d+) pixels$/, async ({ page }, y: string) => {
  await page.evaluate((top) => window.scrollTo(0, top), Number(y));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(Number(y));
});

Then("the scroll to top button is shown", async ({ page }) => {
  await expect(page.getByRole("button", { name: "Scroll to top" })).toBeVisible();
});

When("the user clicks the scroll to top button", async ({ page }) => {
  await page.getByRole("button", { name: "Scroll to top" }).click();
});

Then(/^the page is scrolled to (\d+) pixels$/, async ({ page }, y: string) => {
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(Number(y));
});

// Search component (search-component.feature)
Given("the search box is empty", async ({ page }) => {
  await loadHarness(page, "search");
  await expect(page.getByPlaceholder("Search posts")).toHaveValue("");
});

When(/^the user types "([^"]+)" into the search box$/, async ({ page }, text: string) => {
  await page.getByPlaceholder("Search posts").fill(text);
});

Then(
  /^the search term is "([^"]*)" and the page URL has the query "q" set to "([^"]*)"$/,
  async ({ page }, term: string, query: string) => {
    await expect(page.getByPlaceholder("Search posts")).toHaveValue(term);
    expect(new URL(page.url()).searchParams.get("q")).toBe(query);
  },
);

When("the user clicks Clear search", async ({ page }) => {
  await page.getByRole("button", { name: "Clear search" }).click();
});

Then('the search term is empty and the page URL has no query "q"', async ({ page }) => {
  await expect(page.getByPlaceholder("Search posts")).toHaveValue("");
  expect(new URL(page.url()).searchParams.has("q")).toBe(false);
});

// Theme toggle (theme-toggle.feature)
Given(/^the theme is "([^"]+)"$/, async ({ page }, theme: string) => {
  await page.addInitScript((stored) => localStorage.setItem("theme", stored), theme);
  await loadHarness(page, "theme-toggle");
});

When("the user clicks the theme toggle", async ({ page }) => {
  await page.getByRole("button", { name: /Switch to (light|dark) theme/ }).click();
});

Then(
  /^the page theme is "([^"]+)" and the toggle is labelled "([^"]+)"$/,
  async ({ page }, theme: string, label: string) => {
    await expect(page.getByRole("button", { name: label })).toBeVisible();
    const isLight = await page.evaluate(() => document.documentElement.classList.contains("light-theme"));
    expect(isLight).toBe(theme === "light");
  },
);

Then(/^the stored theme is "([^"]+)"$/, async ({ page }, theme: string) => {
  await expect.poll(() => page.evaluate(() => localStorage.getItem("theme"))).toBe(theme);
});
