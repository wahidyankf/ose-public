import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { buildTrpcUrl, extractTrpcData, state } from "./helpers";

const { When, Then } = createBdd();

When("the health endpoint is called", async ({ request }) => {
  const url = buildTrpcUrl("meta.health", undefined);
  const response = await request.get(url);
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  state.healthResult = extractTrpcData(body);
});

Then("the response contains status {string}", async ({}, expectedStatus: string) => {
  expect(state.healthResult).toMatchObject({ status: expectedStatus });
});
