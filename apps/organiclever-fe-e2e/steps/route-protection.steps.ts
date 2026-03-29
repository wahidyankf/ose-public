/**
 * Step definitions for the Route Protection feature.
 *
 * Covers: specs/apps/organiclever/fe/gherkin/authentication/route-protection.feature
 *
 * Validates that the Next.js middleware redirects unauthenticated users to /login
 * and authenticated users to /profile, and that protected routes are inaccessible
 * without a valid session.
 */
import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";

const { Given, When, Then } = createBdd();

Given("I am not logged in", async ({ page }) => {
  // Clear any stored auth state so the app treats the visitor as unauthenticated.
  await page.goto("/", { waitUntil: "domcontentloaded" }).catch(() => {});
  await page
    .evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    })
    .catch(() => {});
});

When("I navigate to \\/profile", async ({ page }) => {
  await page.goto("/profile");
  await page.waitForLoadState("load");
});

When("I navigate to \\/", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("load");
});

Then("I should be redirected to \\/login", async ({ page }) => {
  await page.waitForURL(/\/login/, { timeout: 15000 });
  await expect(page).toHaveURL(/\/login/);
});

Then("I should see the profile page", async ({ page }) => {
  await expect(page).toHaveURL(/\/profile/);
  const profileContent = page.getByRole("main").or(page.getByTestId("profile")).or(page.locator("main"));
  await expect(profileContent.first()).toBeVisible();
});

Then("I should be redirected to \\/profile", async ({ page }) => {
  await page.waitForURL(/\/profile/, { timeout: 15000 });
  await expect(page).toHaveURL(/\/profile/);
});
