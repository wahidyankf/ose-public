import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";

const { Given, Then } = createBdd();

// invalid-path-fallback.feature, the not-found scenario (AYW-152): a paths URL that names no known
// category, arc, or path answers with the not-found page and a 404 status.

// @scenario specs/apps/ayokoding/www/behaviours/frontend/course-paths/invalid-path-fallback.feature: A paths URL that names no known category, arc, or path shows the not-found page

// Module state is safe here: Given and Then of one scenario run in order inside one worker.
let notFoundStatus: number | undefined;

Given(/^a reader opens the paths URL (\S+)$/, async ({ page }, url: string) => {
  const response = await page.goto(url);
  notFoundStatus = response?.status();
});

Then("the not-found page is shown with a 404 status", async () => {
  expect(notFoundStatus).toBe(404);
});
