import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { setResponse, getResponse } from "../utils/response-store";

const { When, Then } = createBdd();

When(/^an operations engineer sends GET \/health$/, async ({ request }) => {
  setResponse(await request.get("/api/v1/health"));
});

When(/^an unauthenticated engineer sends GET \/health$/, async ({ request }) => {
  setResponse(await request.get("/api/v1/health"));
});

// oxlint-disable-next-line no-empty-pattern
Then("the health status should be {string}", async ({}, status: string) => {
  const body = (await getResponse().json()) as Record<string, unknown>;
  expect(body["status"]).toBe(status);
});

Then("the response should not include detailed component health information", async () => {
  const body = (await getResponse().json()) as Record<string, unknown>;
  expect(body["components"]).toBeUndefined();
});
