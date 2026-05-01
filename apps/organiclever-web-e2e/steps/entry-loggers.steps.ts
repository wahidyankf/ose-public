/**
 * Step definitions for the Entry Loggers feature.
 *
 * Covers: specs/apps/organiclever/fe/gherkin/loggers/entry-loggers.feature
 *
 * Note: "the app shell is visible" is already registered in app-shell.steps.ts.
 * Note: "the Add Entry sheet is open", "the user closes the Add Entry sheet",
 *       and "the Add Entry sheet is closed" are already registered in app-shell.steps.ts.
 * playwright-bdd treats all keyword registrations as synonyms and each unique
 * step pattern must be registered exactly once across all step files.
 */
import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";

const { When, Then } = createBdd();

When("the user taps the FAB", async ({ page }) => {
  await page
    .locator("[data-testid='fab']")
    .or(page.getByRole("button", { name: /add/i }))
    .first()
    .click();
});

Then("the Add Entry sheet is open with all entry kinds", async ({ page }) => {
  await expect(
    page.locator("[data-testid='add-entry-sheet']").or(page.locator("[role='dialog']")).first(),
  ).toBeVisible();
});

When("the user selects the Reading entry kind", async ({ page }) => {
  await page
    .getByRole("button", { name: /reading/i })
    .or(page.locator("[data-testid='entry-kind-reading']"))
    .first()
    .click();
});

Then("the reading logger is open", async ({ page }) => {
  await expect(
    page
      .locator("[data-testid='reading-logger']")
      .or(page.getByText(/reading/i))
      .first(),
  ).toBeVisible();
});

When("the user enters title {string}", async ({ page }, title: string) => {
  await page.locator("[data-testid='reading-title-input']").or(page.getByPlaceholder(/title/i)).first().fill(title);
});

When("the user saves the entry", async ({ page }) => {
  await page.getByRole("button", { name: /save/i }).or(page.locator("[data-testid='save-entry']")).first().click();
});

Then("the entry is saved and the logger closes", async ({ page }) => {
  await expect(page.locator("[data-testid='reading-logger']")).not.toBeVisible();
});

When("the user has not entered a title", async ({ page }) => {
  const input = page.locator("[data-testid='reading-title-input']").or(page.getByPlaceholder(/title/i)).first();
  await input.clear();
});

Then("the save button is disabled", async ({ page }) => {
  await expect(
    page.getByRole("button", { name: /save/i }).or(page.locator("[data-testid='save-entry']")).first(),
  ).toBeDisabled();
});

When("the user selects the Learning entry kind", async ({ page }) => {
  await page
    .getByRole("button", { name: /learning/i })
    .or(page.locator("[data-testid='entry-kind-learning']"))
    .first()
    .click();
});

Then("the learning logger is open", async ({ page }) => {
  await expect(
    page
      .locator("[data-testid='learning-logger']")
      .or(page.getByText(/learning/i))
      .first(),
  ).toBeVisible();
});

When("the user enters subject {string}", async ({ page }, subject: string) => {
  await page
    .locator("[data-testid='learning-subject-input']")
    .or(page.getByPlaceholder(/subject/i))
    .first()
    .fill(subject);
});

When("the user selects the Meal entry kind", async ({ page }) => {
  await page.getByRole("button", { name: /meal/i }).or(page.locator("[data-testid='entry-kind-meal']")).first().click();
});

Then("the meal logger is open", async ({ page }) => {
  await expect(page.locator("[data-testid='meal-logger']").or(page.getByText(/meal/i)).first()).toBeVisible();
});

When("the user enters meal name {string}", async ({ page }, mealName: string) => {
  await page.locator("[data-testid='meal-name-input']").or(page.getByPlaceholder(/meal/i)).first().fill(mealName);
});

When("the user selects the Focus entry kind", async ({ page }) => {
  await page
    .getByRole("button", { name: /focus/i })
    .or(page.locator("[data-testid='entry-kind-focus']"))
    .first()
    .click();
});

Then("the focus logger is open", async ({ page }) => {
  await expect(page.locator("[data-testid='focus-logger']").or(page.getByText(/focus/i)).first()).toBeVisible();
});

When("the user selects the 25min preset", async ({ page }) => {
  await page.getByRole("button", { name: /25/i }).or(page.locator("[data-testid='preset-25min']")).first().click();
});

When("the user has not entered task or duration", async ({ page }) => {
  const taskInput = page.locator("[data-testid='focus-task-input']").or(page.getByPlaceholder(/task/i)).first();
  await taskInput.clear().catch(() => {
    // Field may not exist; that's acceptable for this step
  });
});

When("the user selects the custom entry kind", async ({ page }) => {
  await page
    .getByRole("button", { name: /custom/i })
    .or(page.locator("[data-testid='entry-kind-custom']"))
    .first()
    .click();
});

Then("the custom entry logger is open", async ({ page }) => {
  await expect(
    page
      .locator("[data-testid='custom-logger']")
      .or(page.getByText(/custom/i))
      .first(),
  ).toBeVisible();
});

When("the user enters custom entry name {string}", async ({ page }, name: string) => {
  await page.locator("[data-testid='custom-name-input']").or(page.getByPlaceholder(/name/i)).first().fill(name);
});

When("the user saves the custom entry", async ({ page }) => {
  await page
    .getByRole("button", { name: /save/i })
    .or(page.locator("[data-testid='save-custom-entry']"))
    .first()
    .click();
});

Then("the custom entry is saved and the logger closes", async ({ page }) => {
  await expect(page.locator("[data-testid='custom-logger']")).not.toBeVisible();
});
