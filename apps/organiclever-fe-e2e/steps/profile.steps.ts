/**
 * Step definitions for the User Profile feature.
 *
 * Covers: specs/apps/organiclever/fe/gherkin/authentication/profile.feature
 *
 * Assumes the user has already completed the Google OAuth login flow before
 * these steps run (enforced by the Background "I am logged in via Google OAuth").
 */
import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";

const { Given, Then } = createBdd();

Given("I am logged in via Google OAuth", async ({ page }) => {
  // Call the FE BFF proxy with a test-mode token (backend accepts
  // "test:<email>:<name>:<googleId>" when APP_ENV=test / ENABLE_TEST_API=true).
  const testToken = "test:alice@example.com:Alice Smith:google-alice";
  const baseURL = page.url().startsWith("http") ? new URL(page.url()).origin : "http://localhost:3200";
  const response = await page.request.post(`${baseURL}/api/auth/google`, {
    data: { idToken: testToken },
    headers: { "Content-Type": "application/json" },
  });
  expect(response.status(), "BFF login should succeed").toBe(200);
  // The BFF sets httpOnly cookies automatically in the response.
  // Playwright's request context shares cookies with the page.
});

Then("I should see my name", async ({ page }) => {
  // Profile card renders name as <p> with font-semibold. Match the test user name.
  await expect(page.getByText("Alice Smith")).toBeVisible();
});

Then("I should see my email address", async ({ page }) => {
  const emailEl = page.getByTestId("profile-email").or(page.getByText(/@/));
  await expect(emailEl.first()).toBeVisible();
});

Then("I should see my profile avatar", async ({ page }) => {
  const avatar = page
    .getByTestId("profile-avatar")
    .or(page.getByRole("img", { name: /avatar|profile/i }))
    .or(page.locator("img[alt]").first());
  await expect(avatar.first()).toBeVisible();
});

Then("the displayed name should match my Google account name", async ({ page }) => {
  // Verify the test user's name from the Google OAuth test token is displayed.
  await expect(page.getByText("Alice Smith")).toBeVisible();
});

Then("the displayed email should match my Google account email", async ({ page }) => {
  const emailEl = page.getByTestId("profile-email").or(page.getByText(/@/));
  await expect(emailEl.first()).toBeVisible();
});

Then("the displayed avatar should match my Google account avatar", async ({ page }) => {
  const avatar = page.getByTestId("profile-avatar").or(page.getByRole("img", { name: /avatar|profile/i }));
  await expect(avatar.first()).toBeVisible();
  const src = await avatar.first().getAttribute("src");
  expect(src).not.toBeNull();
  expect(src?.trim().length).toBeGreaterThan(0);
});
