import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { getResponse } from "../utils/response-store";

const { Given, Then } = createBdd();

Given("the OrganicLever API is running", async () => {
  // No-op: the test suite assumes the API is running at baseURL.
});

// oxlint-disable-next-line no-empty-pattern
Then("the response status code should be {int}", async ({}, code: number) => {
  expect(getResponse().status()).toBe(code);
});
