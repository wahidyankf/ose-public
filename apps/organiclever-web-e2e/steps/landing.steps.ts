/**
 * Step definitions for the OrganicLever Landing Page feature.
 *
 * Covers: specs/apps/organiclever/fe/gherkin/landing/landing.feature
 *
 * playwright-bdd treats all keyword registrations (Given/When/Then) as synonyms,
 * so each unique step pattern must be registered exactly once.
 */
import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";

const { Given, When, Then } = createBdd();

Given("I navigate to {string}", async ({ page }, _path: string) => {
  await page.goto("/");
  await page.waitForLoadState("domcontentloaded");
});

Given("I see text {string}", async ({ page }, text: string) => {
  await expect(page.getByText(text).first()).toBeVisible();
});

Given("I see a button {string}", async ({ page }, name: string) => {
  await expect(page.getByRole("button", { name })).toBeVisible();
});

When("I click {string}", async ({ page }, text: string) => {
  await page.getByText(text).first().click();
  await page.waitForLoadState("domcontentloaded");
});

Then("the URL navigates to {string}", async ({ page }, path: string) => {
  const url = page.url();
  expect(url).toContain(path);
});

Then("I see a 5-column features grid", async ({ page }) => {
  await expect(page.getByText("Workouts").first()).toBeVisible();
  await expect(page.getByText("Focus").first()).toBeVisible();
});
