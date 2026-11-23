import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";

const { Given, Then } = createBdd();

// canonical-fallback.feature, the outline scenario: a page that is not a course keeps the generic
// sidebar even with a path query. "When the page renders" is shared with cost-of-living-calculator.steps.ts
// (networkidle wait), so it is not redefined here.

// @scenario specs/apps/ayokoding/www/behaviours/frontend/course-paths/canonical-fallback.feature: A page that is not a course keeps the generic sidebar even with a path query

Given(/^a reader opens the page (\S+) with a path context query parameter$/, async ({ page }, pageUrl: string) => {
  await page.goto(`${pageUrl}?path=careers/interview-ready/backend-track`);
});

Then("the generic sidebar is shown", async ({ page }) => {
  await expect(page.getByRole("navigation", { name: "Sidebar navigation" }).first()).toBeVisible();
});
