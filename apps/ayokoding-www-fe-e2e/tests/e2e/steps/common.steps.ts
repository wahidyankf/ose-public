import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";
import { buildTrpcUrl, extractTrpcData } from "./backend-helpers";

const { Given, When } = createBdd();

Given("the app is running", async ({ request }) => {
  const response = await request.get(buildTrpcUrl("meta.health", undefined));
  expect(response.ok()).toBe(true);
  expect(extractTrpcData(await response.json())).toEqual({ status: "ok" });
});

When("a visitor opens a content page", async ({ page }) => {
  // U6 (plan ayokoding-learn-revamp-04): `/en/learn/overview` was retired in favour of the Learn
  // home, so this binding opens the stable course-root page instead.
  await page.goto("/en/learn/courses/backend-essentials/overview");
});
