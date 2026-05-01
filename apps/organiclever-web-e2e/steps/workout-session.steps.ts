/**
 * Step definitions for the Workout Session feature.
 *
 * Covers: specs/apps/organiclever/fe/gherkin/workout/workout-session.feature
 */
import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";

const { Given, When, Then } = createBdd();

Given("the workout screen is open with no routine", async ({ page }) => {
  await page.goto("http://localhost:3200/workout");
  await page.waitForLoadState("load");
});

When("the user starts the workout", async ({ page }) => {
  await page.getByRole("button", { name: /start/i }).or(page.locator("[data-testid='start-workout']")).first().click();
});

Then("the workout is in active exercising state", async ({ page }) => {
  await expect(
    page.locator("[data-testid='workout-active']").or(page.locator("[data-testid='exercising-state']")).first(),
  ).toBeVisible();
});

Given("an active workout with one exercise with rest", async ({ page }) => {
  await page.goto("http://localhost:3200/workout");
  await page.waitForLoadState("load");
});

When("the user logs a set", async ({ page }) => {
  await page
    .getByRole("button", { name: /log set/i })
    .or(page.locator("[data-testid='log-set']"))
    .first()
    .click();
});

Then("the rest timer is visible", async ({ page }) => {
  await expect(page.locator("[data-testid='rest-timer']").or(page.getByText(/rest/i)).first()).toBeVisible();
});

Given("the rest timer is active", async ({ page }) => {
  await page.goto("http://localhost:3200/workout");
  await page.waitForLoadState("load");
});

When("the user skips rest", async ({ page }) => {
  await page.getByRole("button", { name: /skip/i }).or(page.locator("[data-testid='skip-rest']")).first().click();
});

Then("the workout returns to exercising state", async ({ page }) => {
  await expect(
    page.locator("[data-testid='workout-active']").or(page.locator("[data-testid='exercising-state']")).first(),
  ).toBeVisible();
});

Given("an active workout", async ({ page }) => {
  await page.goto("http://localhost:3200/workout");
  await page.waitForLoadState("load");
});

When("the user ends the workout", async ({ page }) => {
  await page.getByRole("button", { name: /end/i }).or(page.locator("[data-testid='end-workout']")).first().click();
});

Then("the confirmation sheet is shown", async ({ page }) => {
  await expect(
    page.locator("[data-testid='confirmation-sheet']").or(page.locator("[role='dialog']")).first(),
  ).toBeVisible();
});

When("the user discards the workout", async ({ page }) => {
  await page
    .getByRole("button", { name: /discard/i })
    .or(page.locator("[data-testid='discard-workout']"))
    .first()
    .click();
});

Then("the workout is in idle state", async ({ page }) => {
  await expect(
    page.locator("[data-testid='workout-idle']").or(page.locator("[data-testid='idle-state']")).first(),
  ).toBeVisible();
});

When("the user keeps going", async ({ page }) => {
  await page
    .getByRole("button", { name: /keep going/i })
    .or(page.locator("[data-testid='keep-going']"))
    .first()
    .click();
});
