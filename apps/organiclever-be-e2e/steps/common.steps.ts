import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { getResponse, clearResponse } from "../utils/response-store";

const { Given, Before, Then } = createBdd();

Before(() => {
  clearResponse();
});

Given("the API is running", async () => {
  // No-op: the test suite assumes the API is running at baseURL.
});

// oxlint-disable-next-line no-empty-pattern
Then("the response status code should be {int}", async ({}, code: number) => {
  const res = getResponse();
  expect(res.status()).toBe(code);
});

Then(
  "the response body should contain {string} equal to {string}",
  // oxlint-disable-next-line no-empty-pattern
  async ({}, field: string, value: string) => {
    const body = (await getResponse().json()) as Record<string, unknown>;
    expect(body[field]).toBe(value);
  },
);

Then(
  "the response body should contain a non-null {string} field",
  // oxlint-disable-next-line no-empty-pattern
  async ({}, field: string) => {
    const body = (await getResponse().json()) as Record<string, unknown>;
    expect(body[field]).not.toBeNull();
    expect(body[field]).toBeDefined();
  },
);
