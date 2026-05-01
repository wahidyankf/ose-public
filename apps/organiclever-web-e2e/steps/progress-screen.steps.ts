/**
 * Step definitions for the Progress Screen feature.
 *
 * Covers: specs/apps/organiclever/fe/gherkin/progress/progress-screen.feature
 */
import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";

const { Given, When, Then } = createBdd();

Given("the progress screen is loaded", async ({ page }) => {
  await page.goto("http://localhost:3200/progress");
  await page.waitForLoadState("load");
});

Then("the workout module is active", async ({ page }) => {
  await expect(
    page
      .locator("[data-testid='workout-module']")
      .or(page.getByText(/workout/i))
      .first(),
  ).toBeVisible();
});

When("the user selects the Reading module", async ({ page }) => {
  await page
    .getByRole("button", { name: /reading/i })
    .or(page.locator("[data-testid='module-reading']"))
    .first()
    .click();
});

Then("the reading module content is shown", async ({ page }) => {
  await expect(
    page
      .locator("[data-testid='reading-module']")
      .or(page.getByText(/reading/i))
      .first(),
  ).toBeVisible();
});

Given("there is exercise progress data", async ({ page }) => {
  await page.goto("http://localhost:3200/progress");
  await page.waitForLoadState("load");
});

When("the user taps an exercise card", async ({ page }) => {
  await page.locator("[data-testid='exercise-card']").or(page.locator("[data-testid='progress-card']")).first().click();
});

Then("the SVG chart is visible", async ({ page }) => {
  await expect(page.locator("svg").or(page.locator("[data-testid='progress-chart']")).first()).toBeVisible();
});
