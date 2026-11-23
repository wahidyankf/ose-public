// @scenario specs/apps/organiclever/www/behaviours/frontend/home/home.feature: Hero heading visible
// @scenario specs/apps/organiclever/www/behaviours/frontend/home/home.feature: Primary call-to-action button present
// @scenario specs/apps/organiclever/www/behaviours/frontend/home/home.feature: The Open the app button takes the visitor to /app/home
// @scenario specs/apps/organiclever/www/behaviours/frontend/home/home.feature: Footer link present
// @scenario specs/apps/organiclever/www/behaviours/frontend/home/home.feature: The hero links to the project on GitHub
// @scenario specs/apps/organiclever/www/behaviours/frontend/home/home.feature: Home page tells the visitor the product is Pre-Alpha
// @scenario specs/apps/organiclever/www/behaviours/frontend/home/home.feature: Home page shows the five event types and the custom event card
// @scenario specs/apps/organiclever/www/behaviours/frontend/home/home.feature: Weekly rhythm demo visible
// @scenario specs/apps/organiclever/www/behaviours/frontend/home/home.feature: All six principles visible

/**
 * Step definitions for the OrganicLever marketing home page feature.
 *
 * Covers: specs/apps/organiclever/www/behaviours/frontend/home/home.feature
 *
 * playwright-bdd treats all keyword registrations (Given/When/Then) as synonyms,
 * so each unique step pattern must be registered exactly once.
 */
import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";

const { Given, Then } = createBdd();

Given("I navigate to the marketing home page", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("domcontentloaded");
});

Then("I see text {string}", async ({ page }, text: string) => {
  await expect(page.getByText(text).first()).toBeVisible();
});

Then("I see a button {string}", async ({ page }, name: string) => {
  await expect(page.getByRole("button", { name })).toBeVisible();
});

Given("I click the {string} button", async ({ page }, name: string) => {
  await page.getByRole("button", { name }).click();
});

Then("the visitor lands on {string}", async ({ page }, target: string) => {
  await expect.poll(() => new URL(page.url()).pathname).toBe(target);
});

Then("the hero links {string} to the project on GitHub", async ({ page }, text: string) => {
  await expect(page.getByRole("link", { name: text }).first()).toHaveAttribute(
    "href",
    "https://github.com/wahidyankf/ose-public",
  );
});

Then("the hero links {string} to the project fork on GitHub", async ({ page }, text: string) => {
  await expect(page.getByRole("link", { name: text }).first()).toHaveAttribute(
    "href",
    "https://github.com/wahidyankf/ose-public/fork",
  );
});
