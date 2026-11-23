/**
 * Step definitions for the OSE Application BE health endpoint feature, and the generic HTTP steps that the
 * context status and unknown-route scenarios also use.
 *
 * Covers: specs/apps/ose/be/behaviours/health/health.feature
 */
// @scenario specs/apps/ose/be/behaviours/health/health.feature: Health endpoint returns 200
// @scenario specs/apps/ose/be/behaviours/gap-analysis/gap-analysis.feature: GET /api/v1/gap-analysis/status reports the context ready
// @scenario specs/apps/ose/be/behaviours/internal-policy/internal-policy.feature: GET /api/v1/internal-policy/status reports the context ready
// @scenario specs/apps/ose/be/behaviours/regulatory-source/regulatory-source.feature: GET /api/v1/regulatory-source/status reports the context ready
// @scenario specs/apps/ose/be/behaviours/ai-orchestration/ai-orchestration.feature: GET /api/v1/ai-orchestration/status reports the context ready
// @scenario specs/apps/ose/be/behaviours/db/migrations.feature: Unknown route returns 404 Not Found
import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { setResponse, getResponse, clearResponse } from "../utils/response-store";
import { ensureBackendStarted } from "./backend-process";

const { Given, When, Then, Before } = createBdd();

Before(() => {
  clearResponse();
});

Given("the ose-be service is running", async ({ request }) => {
  await ensureBackendStarted();
  const readinessResponse = await request.get("/api/v1/health");
  expect(readinessResponse.status()).toBe(200);
});

When(/^I send GET (\/api\/v1\/[\w/-]+)$/, async ({ request }, path: string) => {
  setResponse(await request.get(path));
});

// oxlint-disable-next-line no-empty-pattern
Then("the response status is {int}", async ({}, expectedStatus: number) => {
  expect(getResponse().status()).toBe(expectedStatus);
});

Then(
  "the response body has a {string} field equal to {string}",
  // oxlint-disable-next-line no-empty-pattern
  async ({}, field: string, value: string) => {
    const body = (await getResponse().json()) as Record<string, unknown>;
    expect(body[field]).toBe(value);
  },
);

// oxlint-disable-next-line no-empty-pattern
Then("the response body contains {string}", async ({}, expected: string) => {
  expect(await getResponse().text()).toContain(expected);
});
