import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";

const { Given, When, Then } = createBdd();

// path-assumes.feature, the path that assumes nothing. The fixture manifest
// careers/interview-ready/backend-track declares "assumes": [] (apps/ayokoding-www-fe-e2e/fixtures/manifests).

// @scenario specs/apps/ayokoding/www/behaviours/frontend/course-paths/path-assumes.feature: A path that assumes nothing shows no Before you start note

Given("a path manifest declares no assumed courses", async ({ page }) => {
  await page.goto("/en/learn/paths/careers/interview-ready/backend-track");
});

When("its landing page renders", async ({ page }) => {
  await page.waitForLoadState("networkidle");
});

Then('no "Before you start" note is rendered', async ({ page }) => {
  await expect(page.getByText("Before you start")).toHaveCount(0);
});
