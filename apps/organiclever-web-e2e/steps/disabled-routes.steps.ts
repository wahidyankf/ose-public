/**
 * Step definitions for the Disabled Routes feature.
 *
 * Covers: specs/apps/organiclever/fe/gherkin/routing/disabled-routes.feature
 *
 * GET-only routes (/login, /profile) are verified by navigating with page.goto
 * and checking the HTTP status. /login and /profile remain as guards against
 * accidental re-introduction of Google auth UI.
 */
import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";

const { Given, When, Then } = createBdd();

let currentMethod = "";
let currentPath = "";

Given("the application is running in local-first mode", async () => {
  // No-op: the server always runs in local-first mode for these tests.
});

When(/a visitor requests (\w+) (\/(?:login|profile))$/, async ({ page }, method: string, routePath: string) => {
  currentMethod = method;
  currentPath = routePath;
  const response = await page.goto(routePath);
  expect(response?.status()).toBe(404);
});

Then("the response status is 404", async () => {
  // Status assertion is performed in the When step for inline access to response.
  // This Then step confirms the path was exercised.
  expect(currentPath).toBeTruthy();
  expect(currentMethod).toBeTruthy();
});
