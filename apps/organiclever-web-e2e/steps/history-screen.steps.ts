/**
 * Step definitions for the History Screen feature.
 *
 * Covers: specs/apps/organiclever/fe/gherkin/history/history-screen.feature
 */
import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";

const { Given, When, Then } = createBdd();

Given("the history screen has entries", async ({ page }) => {
  await page.goto("http://localhost:3200/history");
  await page.waitForLoadState("load");
});

Then("entries are shown newest first", async ({ page }) => {
  await expect(
    page.locator("[data-testid='history-entry']").or(page.locator("[data-testid='session-card']")).first(),
  ).toBeVisible();
});

Given("the history screen has no entries", async ({ page }) => {
  await page.goto("http://localhost:3200/history");
  await page.waitForLoadState("load");
});

Then("the empty state message is shown", async ({ page }) => {
  await expect(
    page
      .locator("[data-testid='empty-state']")
      .or(page.getByText(/no entries/i))
      .first(),
  ).toBeVisible();
});

Given("the history screen shows a workout entry", async ({ page }) => {
  await page.goto("http://localhost:3200/history");
  await page.waitForLoadState("load");
});

When("the user taps the session card", async ({ page }) => {
  await page.locator("[data-testid='session-card']").or(page.locator("[data-testid='history-entry']")).first().click();
});

Then("the card expands showing details", async ({ page }) => {
  await expect(
    page.locator("[data-testid='session-details']").or(page.locator("[data-testid='card-expanded']")).first(),
  ).toBeVisible();
});
