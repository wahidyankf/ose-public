// Shared background steps for the HTTP boundary adapter.
import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";
import { fetchText, statusOf } from "../support/http";

const { Given } = createBdd();

Given("the app is running", async ({ request }) => {
  await fetchText(request, "/en");
  expect(statusOf(request)).toBe(200);
});
