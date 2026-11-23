// @scenario specs/apps/organiclever/app-web/behaviours/routing/disabled-routes.feature: Disabled routes return 404

/**
 * Step definitions for the Disabled Routes feature.
 *
 * Covers: specs/apps/organiclever/app-web/behaviours/routing/disabled-routes.feature
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
let responseStatus: number | null = null;

Given("the application is running in local-first mode", async ({ request }) => {
  currentMethod = "";
  currentPath = "";
  redirectStatus = null;
  redirectLocation = null;
  responseStatus = null;
  const response = await request.get(`${APP_BASE_URL}/app/home`);
  expect(response.ok()).toBe(true);
});

When(/a visitor requests (\w+) (\/(?:login|profile))$/, async ({ page }, method: string, routePath: string) => {
  currentMethod = method;
  currentPath = routePath;
  const response = await page.goto(routePath);
  responseStatus = response?.status() ?? null;
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
  responseStatus = response?.status() ?? null;
});

Then("the response status is 404", async () => {
  expect({ method: currentMethod, path: currentPath, status: responseStatus }).toMatchObject({
    status: 404,
  });
});

When(/a visitor requests GET "\/"$/, async ({ request }) => {
  const response = await request.get(`${APP_BASE_URL}/`, { maxRedirects: 0 });
  redirectStatus = response.status();
  redirectLocation = response.headers()["location"] ?? null;
});

Then(/the response redirects to "(\/app\/home)"$/, async ({}, target: string) => {
  // Next.js redirect() from a server component is a temporary (307) redirect by default.
  expect([301, 302, 307, 308]).toContain(redirectStatus);
  const normalisedLocation = redirectLocation?.replace(APP_BASE_URL, "") ?? "";
  expect(normalisedLocation).toBe(target);
});

Then(/the response is a 308 redirect to "(\/app\/home)"$/, async ({}, target: string) => {
  expect(redirectStatus).toBe(308);
  expect(redirectLocation).toBeTruthy();
  // Next.js may emit absolute or relative Location headers; normalise.
  const normalisedLocation = redirectLocation?.replace(APP_BASE_URL, "") ?? "";
  expect(normalisedLocation).toBe(target);
});
