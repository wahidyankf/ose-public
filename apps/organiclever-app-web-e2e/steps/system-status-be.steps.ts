// @scenario specs/apps/organiclever/app-web/behaviours/health/system-status-be.feature: BE status page shows Not Configured when env unset
// @scenario specs/apps/organiclever/app-web/behaviours/health/system-status-be.feature: Backend health-check page is excluded from search indexes

import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";

const { Given, When, Then } = createBdd();
let responseStatus: number | null = null;

Given("ORGANICLEVER_BE_URL is unset", async ({ request }) => {
  const response = await request.get("/system/status/be");
  expect(await response.text()).toContain("Not configured");
});

When("a visitor requests GET \\/system\\/status\\/be", async ({ page }) => {
  const response = await page.goto("/system/status/be");
  responseStatus = response?.status() ?? null;
});

When("a crawler requests GET \\/system\\/status\\/be", async ({ page }) => {
  const response = await page.goto("/system/status/be");
  responseStatus = response?.status() ?? null;
});

Then("the response status is 200", async ({ page }) => {
  expect(responseStatus).toBe(200);
  await expect(page.locator("main")).toBeVisible();
});

Then("the response declares the page non-indexable", async ({ page }) => {
  expect(responseStatus).toBe(200);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex");
});

Then("the body contains {string}", async ({ page }, text: string) => {
  await expect(page.locator("main")).toContainText(text);
});
