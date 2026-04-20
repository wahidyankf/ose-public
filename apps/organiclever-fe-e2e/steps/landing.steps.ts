/**
 * Step definitions for the Landing Page feature.
 *
 * Covers: specs/apps/organiclever/fe/gherkin/landing/landing.feature
 */
import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";

const { When, Then } = createBdd();

When("a visitor requests GET \\/", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("load");
});

Then("the body contains the landing page heading", async ({ page }) => {
  await expect(page.getByRole("heading", { level: 1, name: /OrganicLever/i })).toBeVisible();
});

Then("no request is made to organiclever-be", async ({ page }) => {
  // Capture any requests that fire during the load and assert none go to BE
  const beRequests: string[] = [];
  page.on("request", (req) => {
    const beUrl = process.env["ORGANICLEVER_BE_URL"];
    if (beUrl && req.url().startsWith(beUrl)) {
      beRequests.push(req.url());
    }
  });
  // Reload to collect requests with the listener active
  await page.reload();
  await page.waitForLoadState("load");
  expect(beRequests).toHaveLength(0);
});

Then("the page loads at \\/ without intermediate redirect", async ({ page }) => {
  // If there were a redirect, the final URL would differ from /
  await expect(page).toHaveURL("/");
});
