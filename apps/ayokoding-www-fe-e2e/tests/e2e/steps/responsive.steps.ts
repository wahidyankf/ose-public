// @scenario specs/apps/ayokoding/www/behaviours/frontend/app-shell/responsive.feature: Desktop viewport shows sidebar, content, and table of contents
// @scenario specs/apps/ayokoding/www/behaviours/frontend/app-shell/responsive.feature: Laptop viewport shows sidebar and content but hides table of contents
// @scenario specs/apps/ayokoding/www/behaviours/frontend/app-shell/responsive.feature: Mobile viewport shows hamburger menu and hides sidebar
// @scenario specs/apps/ayokoding/www/behaviours/frontend/app-shell/responsive.feature: Mobile hamburger menu opens the sidebar drawer
// @scenario specs/apps/ayokoding/www/behaviours/frontend/app-shell/responsive.feature: The theme toggle switches between light, dark, and system themes
import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";

const { Given, When, Then } = createBdd();

Given(/the viewport is set to "desktop" \(1280x800\)/, async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
});

Given(/the viewport is set to "laptop" \(1024x768\)/, async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
});

Given(/the viewport is set to "mobile" \(375x667\)/, async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
});

Then("the sidebar navigation should be visible", async ({ page }) => {
  const sidebar = page.getByRole("navigation", { name: /sidebar/i });
  await expect(sidebar).toBeVisible();
});

Then("the main content area should be visible", async ({ page }) => {
  const main = page.getByRole("main");
  await expect(main).toBeVisible();
});

Then("the table of contents should be visible", async ({ page }) => {
  const toc = page.getByRole("navigation", { name: /table of contents/i });
  await expect(toc).toBeVisible();
});

Then("the table of contents should not be visible", async ({ page }) => {
  const toc = page.getByRole("navigation", { name: /table of contents/i });
  await expect(toc).toBeHidden();
});

Then("a hamburger menu button should be visible in the header", async ({ page }) => {
  const hamburger = page.getByRole("button", { name: /menu/i });
  await expect(hamburger).toBeVisible();
});

Then("the sidebar navigation should not be visible", async ({ page }) => {
  const sidebar = page.getByRole("navigation", { name: /sidebar/i });
  await expect(sidebar).toBeHidden();
});

Given("a visitor is on a content page", async ({ page }) => {
  // U6 (plan ayokoding-learn-revamp-04): the stable course-root page replaces the retired
  // `/en/learn/overview`.
  await page.goto("/en/learn/courses/backend-essentials/overview");
});

When("the visitor taps the hamburger menu button", async ({ page }) => {
  const hamburger = page.getByRole("button", { name: /menu/i });
  await expect(hamburger).toBeVisible();
  await hamburger.click();
});

Then("a sidebar drawer should slide into view", async ({ page }) => {
  await expect(page.getByRole("dialog")).toBeVisible();
});

Then("the sidebar navigation links should be visible inside the drawer", async ({ page }) => {
  const drawer = page.getByRole("dialog");
  const navigation = drawer.getByRole("navigation", { name: /mobile navigation/i });
  await expect(navigation).toBeVisible();
  expect(await navigation.getByRole("link").count()).toBeGreaterThan(0);
});

// AYW-051: the toggle is the header dropdown; next-themes writes the chosen theme as a class on <html>.
When("the visitor chooses the {string} theme from the theme toggle", async ({ page }, theme: string) => {
  await page.getByRole("button", { name: "Toggle theme" }).click();
  await page.getByRole("menuitem", { name: theme.charAt(0).toUpperCase() + theme.slice(1) }).click();
});

// The browser runs with its default light colour scheme, so the system choice shows the light class.
Then("the page is set to the {string} theme", async ({ page }, theme: string) => {
  const appliedClass = theme === "system" ? "light" : theme;
  await expect(page.locator("html")).toHaveClass(new RegExp(`\\b${appliedClass}\\b`));
});
