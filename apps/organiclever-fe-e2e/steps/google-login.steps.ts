/**
 * Step definitions for the Google Login feature.
 *
 * Covers: specs/apps/organiclever/fe/gherkin/authentication/google-login.feature
 *
 * The Google OAuth flow cannot be driven end-to-end via the Google Sign-In
 * popup in a headless browser. Instead, the "complete OAuth flow" step calls
 * the frontend's BFF proxy with a test-mode token (accepted by the backend
 * when APP_ENV=test). This sets httpOnly auth cookies in the browser context.
 */
import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";

const { Given, When, Then } = createBdd();

Given("the app is running", async ({}) => {
  // No-op: the app is assumed to be running at baseURL.
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
  // The Google Sign-In button is rendered by the GSI SDK into a div.
  // In test mode the SDK may not load, so check for the placeholder div
  // with aria-label or a native button with the text.
  const button = page.getByRole("button", { name: buttonText });
  const placeholder = page.locator(`[aria-label="${buttonText}"]`);
  await expect(button.or(placeholder).first()).toBeVisible();
});

Then("there should be no email\\/password form", async ({ page }) => {
  await expect(page.getByRole("textbox", { name: /email/i })).not.toBeVisible();
  await expect(page.getByRole("textbox", { name: /password/i })).not.toBeVisible();
});

When("I click {string}", async ({ page }, buttonText: string) => {
  // The Google Sign-In button may be a div rendered by GSI SDK.
  // Try clicking a button first, then fall back to the aria-label div.
  const button = page.getByRole("button", { name: buttonText });
  const placeholder = page.locator(`[aria-label="${buttonText}"]`);
  await button.or(placeholder).first().click();
});

When("I complete the Google OAuth flow successfully", async ({ page }) => {
  // Simulate a successful OAuth callback by calling the BFF proxy with
  // a test-mode token. The backend (APP_ENV=test) accepts tokens in the
  // format "test:<email>:<name>:<googleId>".
  const testToken = "test:alice@example.com:Alice Smith:google-alice";
  const response = await page.request.post("/api/auth/google", {
    data: { idToken: testToken },
    headers: { "Content-Type": "application/json" },
  });
  expect(response.status(), "BFF login should succeed").toBe(200);
  // Cookies are set by the BFF response. Navigate to profile.
  await page.goto("/profile");
  await page.waitForLoadState("load");
});

Then("I should see my profile information", async ({ page }) => {
  const profileContent = page.getByRole("main").or(page.getByTestId("profile")).or(page.locator("main"));
  await expect(profileContent.first()).toBeVisible();
});
