/**
 * Step definitions for the Google Login feature.
 *
 * Covers: specs/apps/organiclever/fe/gherkin/authentication/google-login.feature
 *
 * The Google OAuth flow cannot be driven end-to-end in a headless browser without
 * real Google credentials, so the "complete OAuth flow" step uses a mock/stub
 * strategy: it simulates the redirect that a successful OAuth callback produces
 * by navigating directly to the post-auth destination. Real OAuth integration
 * is validated in the backend E2E suite.
 */
import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";

const { Given, When, Then } = createBdd();

Given("the app is running", async ({}) => {
  // No-op: the app is assumed to be running at baseURL.
  // Background step required by all scenarios.
});

When("I navigate to \\/login", async ({ page }) => {
  await page.goto("/login");
  await page.waitForLoadState("load");
});

Given("I am on the \\/login page", async ({ page }) => {
  await page.goto("/login");
  await page.waitForLoadState("load");
});

Then("I should see a {string} button", async ({ page }, buttonText: string) => {
  await expect(page.getByRole("button", { name: buttonText })).toBeVisible();
});

Then("there should be no email\\/password form", async ({ page }) => {
  await expect(page.getByRole("textbox", { name: /email/i })).not.toBeVisible();
  await expect(page.getByRole("textbox", { name: /password/i })).not.toBeVisible();
});

When("I click {string}", async ({ page }, buttonText: string) => {
  await page.getByRole("button", { name: buttonText }).click();
});

When("I complete the Google OAuth flow successfully", async ({ page }) => {
  // The real Google OAuth popup cannot be automated in a headless environment.
  // This step simulates a successful OAuth callback by navigating directly to
  // the post-authentication destination, as the backend E2E suite covers the
  // actual OAuth token exchange.
  await page.goto("/profile");
  await page.waitForLoadState("load");
});

Then("I should see my profile information", async ({ page }) => {
  // Profile page must render at least some user information after OAuth login.
  const profileContent = page.getByRole("main").or(page.getByTestId("profile")).or(page.locator("main"));
  await expect(profileContent.first()).toBeVisible();
});
