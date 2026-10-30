// Shared background steps for the Playwright E2E adapter.
import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";
import { fetchText, statusOf } from "../support/http";

const { Given } = createBdd();

Given("the app is running", async ({ page }) => {
  await fetchText(page, "/en");
  expect(statusOf(page)).toBe(200);
});
