import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { buildTrpcUrl, extractTrpcData } from "./helpers";

const { Given, When, Then } = createBdd();

let healthResult: unknown;
let languagesResult: { code: string; label: string }[];

Given("the API is running", async () => {});

When("the client calls meta.health", async ({ request }) => {
  const url = buildTrpcUrl("meta.health", undefined);
  const response = await request.get(url);
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  healthResult = extractTrpcData(body);
});

Then('the response should contain "status" equal to "ok"', async () => {
  expect(healthResult).toMatchObject({ status: "ok" });
});

When("the client calls meta.languages", async ({ request }) => {
  const url = buildTrpcUrl("meta.languages", undefined);
  const response = await request.get(url);
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  languagesResult = extractTrpcData(body) as { code: string; label: string }[];
});

Then('the response should contain a non-null "languages" array', async () => {
  expect(languagesResult).not.toBeNull();
  expect(Array.isArray(languagesResult)).toBe(true);
});

Then('the "languages" array should include "en"', async () => {
  expect(languagesResult.some((l: { code: string }) => l.code === "en")).toBe(true);
});

Then('the "languages" array should include "id"', async () => {
  expect(languagesResult.some((l: { code: string }) => l.code === "id")).toBe(true);
});
