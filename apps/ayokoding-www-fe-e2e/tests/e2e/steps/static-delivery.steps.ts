import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { getResilient } from "../support/resilient-request";

const { Given, When, Then } = createBdd();
// U6 (plan ayokoding-learn-revamp-04): a real, stable content route, since `/en/learn/overview`
// is now a redirect rather than a page.
const lessonUrl = "/en/learn/courses/backend-essentials/overview";

interface StaticDeliveryState {
  firstResponse?: import("@playwright/test").APIResponse;
  secondResponse?: import("@playwright/test").APIResponse;
  runtimeDataResponses?: readonly import("@playwright/test").APIResponse[];
}

const stateByPage = new WeakMap<import("@playwright/test").Page, StaticDeliveryState>();

function stateFor(page: import("@playwright/test").Page): StaticDeliveryState {
  const existing = stateByPage.get(page);
  if (existing) return existing;
  const created: StaticDeliveryState = {};
  stateByPage.set(page, created);
  return created;
}

Given("a visitor has already requested a course lesson URL", async ({ page }) => {
  const firstResponse = await getResilient(page, lessonUrl);
  expect(firstResponse.ok()).toBe(true);
  stateFor(page).firstResponse = firstResponse;
});

When("the same URL is requested again", async ({ page }) => {
  const secondResponse = await getResilient(page, lessonUrl);
  expect(secondResponse.ok()).toBe(true);
  stateFor(page).secondResponse = secondResponse;
});

// The local standalone runner has no Vercel CDN, so a cache HIT is a deployment-only assertion.
// This local contract proves the response stays cacheable; preview/production verifies the HIT.
Then("the response does not carry a no-store cache directive", async ({ page }) => {
  expect(stateFor(page).secondResponse?.headers()["cache-control"] ?? "").not.toMatch(/\bno-store\b/i);
});

Given("the ayokoding-www standalone package is running", async ({ page }) => {
  const response = await getResilient(page, "/api/trpc/meta.health");
  expect(response.ok()).toBe(true);
});

When("navigation search and course-path data are requested through tRPC", async ({ page }) => {
  const endpoint = (procedure: string, input: unknown) =>
    `/api/trpc/${procedure}?input=${encodeURIComponent(JSON.stringify({ json: input }))}`;
  const responses = await Promise.all([
    getResilient(page, endpoint("content.getTree", { locale: "en" })),
    getResilient(page, endpoint("search.query", { locale: "en", query: "AyoKoding" })),
    getResilient(page, endpoint("coursePaths.getRouteData", "en")),
  ]);
  stateFor(page).runtimeDataResponses = responses;
});

Then("every runtime data endpoint responds successfully", async ({ page }) => {
  const responses = stateFor(page).runtimeDataResponses;
  expect(responses).toHaveLength(3);
  for (const response of responses ?? []) {
    expect(response.ok(), `${response.url()} should read its traced runtime assets`).toBe(true);
    expect(await response.json()).toHaveProperty("result.data");
  }
});

Given("a visitor opens a localized page in the {string} locale", async ({ page }, locale: string) => {
  await page.goto(`/${locale}`);
});

When("the localized page renders", async ({ page }) => {
  await expect(page.getByRole("main")).toBeVisible();
});

Then("the html element declares the {string} language code", async ({ page }, languageCode: string) => {
  await expect(page.locator("html")).toHaveAttribute("lang", languageCode);
});
