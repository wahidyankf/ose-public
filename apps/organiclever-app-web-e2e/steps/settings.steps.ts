import { createBdd } from "playwright-bdd";
import { expect, type Page } from "@playwright/test";
import { appPath } from "./_app-shell";

const { Given, When, Then } = createBdd();

async function openSettings(page: Page) {
  await page.goto(appPath("settings"));
  await expect(page.locator("[data-testid='settings-screen']")).toBeVisible();
}

async function ensureLanguage(page: Page, code: "en" | "id") {
  await openSettings(page);
  const button = page.getByTestId(`lang-btn-${code}`);
  if ((await button.getAttribute("data-active")) !== "true") {
    await Promise.all([page.waitForEvent("domcontentloaded"), button.click()]);
    await expect(page.getByTestId(`lang-btn-${code}`)).toHaveAttribute("data-active", "true");
  }
}

async function ensureDarkMode(page: Page, enabled: boolean) {
  await openSettings(page);
  const toggle = page.getByRole("switch");
  const current = (await toggle.getAttribute("aria-checked")) === "true";
  if (current !== enabled) {
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-checked", String(enabled));
  }
}

Given("the settings screen is loaded", async ({ page }) => {
  await openSettings(page);
});

Then("the user name input is visible", async ({ page }) => {
  await expect(page.getByLabel("Your name")).toBeVisible();
  await expect(page.getByLabel("Your name")).not.toHaveValue("");
});

When("the user selects 30s rest", async ({ page }) => {
  await page.getByTestId("rest-chip-30").click();
});

Then("the 30s rest chip is active", async ({ page }) => {
  await expect(page.getByTestId("rest-chip-30")).toHaveAttribute("data-active", "true");
});

When("the user saves settings", async ({ page }) => {
  const value = (await page.getByTestId("rest-chip-30").getAttribute("data-active")) === "true" ? "60" : "30";
  await page.getByTestId(`rest-chip-${value}`).click();
});

Then("the saved toast appears", async ({ page }) => {
  await expect(page.getByTestId("saved-toast")).toHaveText("Saved");
});

Given("the settings screen shows dark mode is off", async ({ page }) => {
  await ensureDarkMode(page, false);
});

When("the user toggles dark mode", async ({ page }) => {
  await page.getByRole("switch").click();
});

Then("dark mode is enabled", async ({ page }) => {
  await expect(page.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

Given("the user has enabled dark mode", async ({ page }) => {
  await ensureDarkMode(page, true);
});

Then("dark mode is disabled", async ({ page }) => {
  await expect(page.getByRole("switch")).toHaveAttribute("aria-checked", "false");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

Given("the settings screen shows language is English", async ({ page }) => {
  await ensureLanguage(page, "en");
});

When("the user selects Indonesian language", async ({ page }) => {
  await Promise.all([page.waitForEvent("domcontentloaded"), page.getByTestId("lang-btn-id").click()]);
});

Then("the language is set to Indonesian", async ({ page }) => {
  await expect(page.getByTestId("lang-btn-id")).toHaveAttribute("data-active", "true");
});

Given("the settings screen shows language is Indonesian", async ({ page }) => {
  await ensureLanguage(page, "id");
});

When("the user selects English language", async ({ page }) => {
  await Promise.all([page.waitForEvent("domcontentloaded"), page.getByTestId("lang-btn-en").click()]);
});

Then("the language is set to English", async ({ page }) => {
  await expect(page.getByTestId("lang-btn-en")).toHaveAttribute("data-active", "true");
});
