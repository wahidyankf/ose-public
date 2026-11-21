import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { buildTrpcUrl, extractTrpcData, state } from "./helpers";

// @scenario specs/apps/ose/www/behaviours/backend/health/health.feature: Health endpoint returns ok status

const { When, Then } = createBdd();

When("the health endpoint is called", async ({ request }) => {
  const url = buildTrpcUrl("health.check", undefined);
  const response = await request.get(url);
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  state.healthResult = extractTrpcData(body);
});

Then("the response contains status {string}", async ({}, expectedStatus: string) => {
  expect(state.healthResult).toMatchObject({ status: expectedStatus });
});
