// @scenario specs/apps/ayokoding/www/behaviours/backend/health/health-check.feature: meta.health returns status ok
// @scenario specs/apps/ayokoding/www/behaviours/backend/health/health-check.feature: meta.languages returns the list of available locales
import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { buildTrpcUrl, extractTrpcData, state } from "./helpers";

const { When, Then } = createBdd();

// Note: Given "the API is running" is in common.steps.ts

When("the client calls meta.health", async ({ request }) => {
  const url = buildTrpcUrl("meta.health", undefined);
  const response = await request.get(url);
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  state.healthResult = extractTrpcData(body);
});

Then('the response should contain "status" equal to "ok"', async () => {
  expect(state.healthResult).toMatchObject({ status: "ok" });
});

When("the client calls meta.languages", async ({ request }) => {
  const url = buildTrpcUrl("meta.languages", undefined);
  const response = await request.get(url);
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  state.languagesResult = extractTrpcData(body);
});

Then('the response should contain a non-null "languages" array', async () => {
  expect(state.languagesResult).not.toBeNull();
  expect(Array.isArray(state.languagesResult)).toBe(true);
});

Then('the "languages" array should include "en"', async () => {
  const languages = state.languagesResult as { code: string }[];
  expect(languages.some((l) => l.code === "en")).toBe(true);
});

Then('the "languages" array should include "id"', async () => {
  const languages = state.languagesResult as { code: string }[];
  expect(languages.some((l) => l.code === "id")).toBe(true);
});
