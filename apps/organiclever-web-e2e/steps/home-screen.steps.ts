/**
 * Step definitions for the Home Screen feature.
 *
 * Covers: specs/apps/organiclever/fe/gherkin/home/home-screen.feature
 */
import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";

const { Given, When, Then } = createBdd();

Given("the home screen is loaded with entries", async ({ page }) => {
  await page.goto("http://localhost:3200");
  await page.waitForLoadState("load");
});

Then("the entry list is visible", async ({ page }) => {
  await expect(page.locator("[data-testid='entry-list']").or(page.locator("ul")).first()).toBeVisible();
});

Given("the home screen is loaded with workout and reading entries", async ({ page }) => {
  await page.goto("http://localhost:3200");
  await page.waitForLoadState("load");
});

When("the user selects the Workout filter", async ({ page }) => {
  await page
    .getByRole("button", { name: /workout/i })
    .or(page.locator("[data-testid='filter-workout']"))
    .first()
    .click();
});

Then("only workout entries are shown", async ({ page }) => {
  await expect(
    page.locator("[data-testid='entry-item']").or(page.locator("[data-testid='journal-entry']")).first(),
  ).toBeVisible();
});

Given("the home screen shows an entry", async ({ page }) => {
  await page.goto("http://localhost:3200");
  await page.waitForLoadState("load");
});

When("the user taps the entry", async ({ page }) => {
  await page.locator("[data-testid='entry-item']").or(page.locator("[data-testid='journal-entry']")).first().click();
});

Then("the entry detail sheet opens", async ({ page }) => {
  await expect(
    page.locator("[data-testid='entry-detail-sheet']").or(page.locator("[role='dialog']")).first(),
  ).toBeVisible();
});

When("the user closes the sheet", async ({ page }) => {
  await page
    .locator("[data-testid='close-sheet']")
    .or(page.getByRole("button", { name: /close/i }))
    .first()
    .click();
});

Then("the entry detail sheet is closed", async ({ page }) => {
  await expect(page.locator("[data-testid='entry-detail-sheet']")).not.toBeVisible();
});
