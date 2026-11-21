// @scenario specs/apps/ayokoding/www/behaviours/frontend/i18n/i18n.feature: Language switcher displays the current locale
// @scenario specs/apps/ayokoding/www/behaviours/frontend/i18n/i18n.feature: Switching language redirects to the locale-specific URL
// @scenario specs/apps/ayokoding/www/behaviours/frontend/i18n/i18n.feature: UI labels change to the selected language
import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";

const { Given, When, Then } = createBdd();

When(/a visitor is on a page under the \/en locale/, async ({ page }) => {
  await page.goto("/en");
});

Then('the language switcher should display "English" as the current language', async ({ page }) => {
  const langButton = page.getByRole("button", { name: /switch language|english/i });
  await expect(langButton).toBeVisible();
  await expect(langButton).toContainText("English");
});

Given(/a visitor is on the English AI benchmark page at \/en\/tools\/ai-benchmark/, async ({ page }) => {
  await page.goto("/en/tools/ai-benchmark");
});

When("the visitor selects Indonesian from the language switcher", async ({ page }) => {
  const langButton = page.getByRole("button", { name: /switch language/i });
  await langButton.click();

  const idOption = page.getByRole("menuitem", { name: /bahasa indonesia/i });
  await idOption.click();
});

Then(
  /the visitor should be redirected to the Indonesian AI benchmark page at \/id\/tools\/ai-benchmark/,
  async ({ page }) => {
    await expect(page).toHaveURL(/\/id\/tools\/ai-benchmark$/u);
  },
);

Given("a visitor is on the Indonesian version of a page", async ({ page }) => {
  await page.goto("/id/tools");
});

Then("navigation labels and UI text should be displayed in Indonesian", async ({ page }) => {
  const primaryNavigation = page.getByRole("navigation", { name: "Primary" });
  await expect(primaryNavigation.getByRole("link", { name: "Belajar", exact: true })).toBeVisible();
  await expect(primaryNavigation.getByRole("link", { name: "Alat", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Switch language" })).toContainText("Bahasa Indonesia");
});

Then("the page title and headings should reflect the Indonesian locale content", async ({ page }) => {
  await expect(page.locator("html")).toHaveAttribute("lang", "id");
  const main = page.getByRole("main");
  await expect(main.getByRole("heading", { level: 1, name: "Alat", exact: true })).toBeVisible();
  await expect(main.getByRole("link", { name: "Kalkulator Biaya Hidup", exact: true })).toBeVisible();
});

Then("the English version of the home page should be displayed", async ({ page }) => {
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(
    page.getByRole("heading", { level: 1, name: "Learn to build software, the clear way.", exact: true }),
  ).toBeVisible();
});
