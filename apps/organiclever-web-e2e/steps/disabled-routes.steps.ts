/**
 * Step definitions for the Disabled Routes feature.
 *
 * Covers: specs/apps/organiclever/fe/gherkin/routing/disabled-routes.feature
 *
 * GET-only routes (/login, /profile) are verified by navigating with page.goto
 * and checking the HTTP status. /login and /profile remain as guards against
 * accidental re-introduction of Google auth UI.
 *
 * The /app permanent redirect is verified via the underlying request API so
 * the raw 308 status can be observed (page.goto would follow the redirect).
 */
import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";
import { APP_BASE_URL } from "./_app-shell";

const { Given, When, Then } = createBdd();

let currentMethod = "";
let currentPath = "";
let redirectStatus: number | null = null;
let redirectLocation: string | null = null;

Given("the application is running in local-first mode", async () => {
  // No-op: the server always runs in local-first mode for these tests.
});

When(/a visitor requests (\w+) (\/(?:login|profile))$/, async ({ page }, method: string, routePath: string) => {
  currentMethod = method;
  currentPath = routePath;
  const response = await page.goto(routePath);
  expect(response?.status()).toBe(404);
});

When(/a visitor requests GET "\/app"$/, async ({ request }) => {
  currentMethod = "GET";
  currentPath = "/app";
  const response = await request.get(`${APP_BASE_URL}/app`, { maxRedirects: 0 });
  redirectStatus = response.status();
  redirectLocation = response.headers()["location"] ?? null;
});

When(/a visitor requests GET "\/app\/does-not-exist"$/, async ({ page }) => {
  currentMethod = "GET";
  currentPath = "/app/does-not-exist";
  const response = await page.goto(`${APP_BASE_URL}/app/does-not-exist`);
  expect(response?.status()).toBe(404);
});

Then("the response status is 404", async () => {
  // Status assertion is performed in the When step for inline access to response.
  // This Then step confirms the path was exercised.
  expect(currentPath).toBeTruthy();
  expect(currentMethod).toBeTruthy();
});

Then(/the response is a 308 redirect to "(\/app\/home)"$/, async ({}, target: string) => {
  expect(redirectStatus).toBe(308);
  expect(redirectLocation).toBeTruthy();
  // Next.js may emit absolute or relative Location headers; normalise.
  const normalisedLocation = redirectLocation?.replace(APP_BASE_URL, "") ?? "";
  expect(normalisedLocation).toBe(target);
});
