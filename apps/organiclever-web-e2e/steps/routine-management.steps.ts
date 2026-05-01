/**
 * Step definitions for the Routine Management feature.
 *
 * Covers: specs/apps/organiclever/fe/gherkin/routine/routine-management.feature
 */
import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";

const { Given, When, Then } = createBdd();

Given("the edit routine screen is open for a new routine", async ({ page }) => {
  await page.goto("http://localhost:3200/workout");
  await page.waitForLoadState("load");
});

When("the user enters a routine name", async ({ page }) => {
  await page
    .locator("[data-testid='routine-name-input']")
    .or(page.getByPlaceholder(/routine name/i))
    .first()
    .fill("Morning Routine");
});

When("the user saves the routine", async ({ page }) => {
  await page.getByRole("button", { name: /save/i }).or(page.locator("[data-testid='save-routine']")).first().click();
});

Then("the routine is saved", async ({ page }) => {
  await expect(
    page
      .locator("[data-testid='routine-saved']")
      .or(page.getByText(/morning routine/i))
      .first(),
  ).toBeVisible();
});

Given("the edit routine screen is open", async ({ page }) => {
  await page.goto("http://localhost:3200/workout");
  await page.waitForLoadState("load");
});

When("the user adds an exercise", async ({ page }) => {
  await page
    .getByRole("button", { name: /add exercise/i })
    .or(page.locator("[data-testid='add-exercise']"))
    .first()
    .click();
});

Then("the exercise appears in the group", async ({ page }) => {
  await expect(
    page.locator("[data-testid='exercise-item']").or(page.locator("[data-testid='exercise-group']")).first(),
  ).toBeVisible();
});

Given("the edit routine screen is open for an existing routine", async ({ page }) => {
  await page.goto("http://localhost:3200/workout");
  await page.waitForLoadState("load");
});

When("the user confirms deleting the routine", async ({ page }) => {
  await page
    .getByRole("button", { name: /delete/i })
    .or(page.locator("[data-testid='delete-routine']"))
    .first()
    .click();
  await page
    .getByRole("button", { name: /confirm/i })
    .or(page.locator("[data-testid='confirm-delete']"))
    .first()
    .click();
});

Then("the routine is deleted", async ({ page }) => {
  await expect(page.locator("[data-testid='routine-item']")).not.toBeVisible();
});
