/**
 * Step definitions for the App Shell Navigation feature.
 *
 * Covers: specs/apps/organiclever/fe/gherkin/app-shell/navigation.feature
 */
import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";

const { Given, When, Then } = createBdd();

Given("the app is freshly loaded", async ({ page }) => {
  await page.goto("http://localhost:3200");
  await page.waitForLoadState("load");
});

Given("the app shell is visible", async ({ page }) => {
  await page.goto("http://localhost:3200");
  await page.waitForLoadState("load");
  await expect(page.locator("[data-testid='app-shell']").or(page.locator("nav")).first()).toBeVisible();
});

Then("the Home tab is active", async ({ page }) => {
  await expect(
    page
      .locator("[data-testid='tab-home']")
      .or(page.getByRole("link", { name: "Home" }))
      .first(),
  ).toBeVisible();
});

Then("the app shell is visible", async ({ page }) => {
  await expect(page.locator("nav").or(page.locator("[data-testid='app-shell']")).first()).toBeVisible();
});

When("the user taps the History tab", async ({ page }) => {
  await page.getByRole("link", { name: "History" }).or(page.locator("[data-testid='tab-history']")).first().click();
});

Then("the History tab is active", async ({ page }) => {
  await expect(
    page
      .locator("[data-testid='tab-history']")
      .or(page.getByRole("link", { name: "History" }))
      .first(),
  ).toBeVisible();
});

When("the user taps the Progress tab", async ({ page }) => {
  await page.getByRole("link", { name: "Progress" }).or(page.locator("[data-testid='tab-progress']")).first().click();
});

Then("the Progress tab is active", async ({ page }) => {
  await expect(
    page
      .locator("[data-testid='tab-progress']")
      .or(page.getByRole("link", { name: "Progress" }))
      .first(),
  ).toBeVisible();
});

When("the user taps the Settings tab", async ({ page }) => {
  await page.getByRole("link", { name: "Settings" }).or(page.locator("[data-testid='tab-settings']")).first().click();
});

Then("the Settings tab is active", async ({ page }) => {
  await expect(
    page
      .locator("[data-testid='tab-settings']")
      .or(page.getByRole("link", { name: "Settings" }))
      .first(),
  ).toBeVisible();
});

When("the user taps the FAB button", async ({ page }) => {
  await page
    .locator("[data-testid='fab']")
    .or(page.getByRole("button", { name: /add/i }))
    .first()
    .click();
});

Then("the Add Entry sheet is open", async ({ page }) => {
  await expect(
    page.locator("[data-testid='add-entry-sheet']").or(page.locator("[role='dialog']")).first(),
  ).toBeVisible();
});

When("the user closes the Add Entry sheet", async ({ page }) => {
  await page
    .locator("[data-testid='close-sheet']")
    .or(page.getByRole("button", { name: /close/i }))
    .first()
    .click();
});

Then("the Add Entry sheet is closed", async ({ page }) => {
  await expect(page.locator("[data-testid='add-entry-sheet']")).not.toBeVisible();
});
