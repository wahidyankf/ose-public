import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { setResponse, getResponse } from "../../utils/response-store";

const { When, Then } = createBdd();

When(/^an operations engineer sends GET \/actuator\/health$/, async ({ request }) => {
  setResponse(await request.get("/actuator/health"));
});

When(/^an unauthenticated engineer sends GET \/actuator\/health$/, async ({ request }) => {
  setResponse(await request.get("/actuator/health"));
});

// oxlint-disable-next-line no-empty-pattern
Then("the health status should be {string}", async ({}, status: string) => {
  const body = await getResponse().json();
  expect(body.status).toBe(status);
});

Then("the response should not include detailed component health information", async () => {
  const body = await getResponse().json();
  // Spring's `show-details: when-authorized` hides `components` for anonymous calls.
  // Note: this scenario will fail if the backend runs with the dev profile
  // (which sets show-details: always). Run against base/prod-like config for E2E.
  expect(body.components).toBeUndefined();
});
