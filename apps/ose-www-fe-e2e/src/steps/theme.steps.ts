import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";

// @scenario specs/apps/ose/www/behaviours/frontend/app-shell/theme.feature: Default theme is light mode
// @scenario specs/apps/ose/www/behaviours/frontend/app-shell/theme.feature: Theme toggle switches between modes
// @scenario specs/apps/ose/www/behaviours/frontend/app-shell/theme.feature: The chosen theme is kept when the visitor reloads the page

const { Given, When, Then } = createBdd();

When("the visitor reloads the page", async ({ page }) => {
  await page.reload();
});

When("the site loads without a stored theme preference", async ({ page }) => {
  await page.goto("/");
});

Then("the theme is set to light mode", async ({ page }) => {
  const html = page.locator("html");
  const className = await html.getAttribute("class");
  // next-themes uses class="light" or absence of "dark"
  expect(className).not.toContain("dark");
});

Given("the site is in light mode", async ({ page }) => {
  await page.goto("/");
});

When("the user clicks the theme toggle and selects dark mode", async ({ page }) => {
  const themeToggle = page.getByRole("button", { name: /theme|mode|toggle/i });
  await themeToggle.click();
  // After clicking the toggle, look for dark mode option if it's a dropdown
  const darkOption = page.getByRole("menuitem", { name: /dark/i });
  if ((await darkOption.count()) > 0) {
    await darkOption.click();
  }
});

Then("the site switches to dark mode", async ({ page }) => {
  const html = page.locator("html");
  await expect(html).toHaveClass(/dark/);
});
