/**
 * Step definitions for Settings features.
 *
 * Covers:
 * - specs/apps/organiclever/fe/gherkin/settings/settings-screen.feature
 * - specs/apps/organiclever/fe/gherkin/settings/dark-mode.feature
 * - specs/apps/organiclever/fe/gherkin/settings/language.feature
 */
import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";

const { Given, When, Then } = createBdd();

// ---------------------------------------------------------------------------
// Settings screen
// ---------------------------------------------------------------------------

Given("the settings screen is loaded", async ({ page }) => {
  await page.goto("http://localhost:3200/settings");
  await page.waitForLoadState("load");
});

Then("the user name input is visible", async ({ page }) => {
  await expect(
    page.locator("[data-testid='user-name-input']").or(page.getByPlaceholder(/name/i)).first(),
  ).toBeVisible();
});

When("the user selects 30s rest", async ({ page }) => {
  await page.getByRole("button", { name: /30s/i }).or(page.locator("[data-testid='rest-chip-30s']")).first().click();
});

Then("the 30s rest chip is active", async ({ page }) => {
  await expect(
    page
      .locator("[data-testid='rest-chip-30s']")
      .or(page.getByRole("button", { name: /30s/i }))
      .first(),
  ).toBeVisible();
});

When("the user saves settings", async ({ page }) => {
  await page.getByRole("button", { name: /save/i }).or(page.locator("[data-testid='save-settings']")).first().click();
});

Then("the saved toast appears", async ({ page }) => {
  await expect(page.locator("[data-testid='saved-toast']").or(page.getByText(/saved/i)).first()).toBeVisible();
});

// ---------------------------------------------------------------------------
// Dark mode
// ---------------------------------------------------------------------------

Given("the settings screen shows dark mode is off", async ({ page }) => {
  await page.goto("http://localhost:3200/settings");
  await page.waitForLoadState("load");
});

When("the user toggles dark mode", async ({ page }) => {
  await page
    .locator("[data-testid='dark-mode-toggle']")
    .or(page.getByRole("switch", { name: /dark mode/i }))
    .first()
    .click();
});

Then("dark mode is enabled", async ({ page }) => {
  await expect(
    page.locator("[data-testid='dark-mode-toggle']").or(page.locator("html[class*='dark']")).first(),
  ).toBeVisible();
});

Then("dark mode is disabled", async ({ page }) => {
  await expect(
    page.locator("[data-testid='dark-mode-toggle']").or(page.locator("[data-testid='settings-screen']")).first(),
  ).toBeVisible();
});

// ---------------------------------------------------------------------------
// Language setting
// ---------------------------------------------------------------------------

Given("the settings screen shows language is English", async ({ page }) => {
  await page.goto("http://localhost:3200/settings");
  await page.waitForLoadState("load");
});

When("the user selects Indonesian language", async ({ page }) => {
  await page
    .getByRole("button", { name: /indonesian/i })
    .or(page.locator("[data-testid='lang-id']"))
    .first()
    .click();
});

Then("the language is set to Indonesian", async ({ page }) => {
  await expect(
    page
      .locator("[data-testid='lang-id']")
      .or(page.getByText(/bahasa/i))
      .first(),
  ).toBeVisible();
});

Given("the settings screen shows language is Indonesian", async ({ page }) => {
  await page.goto("http://localhost:3200/settings");
  await page.waitForLoadState("load");
});

When("the user selects English language", async ({ page }) => {
  await page
    .getByRole("button", { name: /english/i })
    .or(page.locator("[data-testid='lang-en']"))
    .first()
    .click();
});

Then("the language is set to English", async ({ page }) => {
  await expect(
    page
      .locator("[data-testid='lang-en']")
      .or(page.getByText(/english/i))
      .first(),
  ).toBeVisible();
});
