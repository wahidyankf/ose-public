import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";

const { When, Then } = createBdd();

When("a visitor opens the CV page", async ({ page }) => {
  await page.goto("/cv");
  await page.waitForLoadState("load");
});

Then('the H1 shows "Curriculum Vitae"', async ({ page }) => {
  await expect(page.getByRole("heading", { level: 1, name: /Curriculum Vitae/ })).toBeVisible();
});

Then('a search input with placeholder "Search CV entries..." is visible', async ({ page }) => {
  await expect(page.getByPlaceholder(/Search CV entries/i)).toBeVisible();
});

Then('a "Highlights" section header is visible', async ({ page }) => {
  await expect(page.getByRole("heading", { name: /Highlights/i })).toBeVisible();
});

When('a visitor opens the CV page with search term "TypeScript" and scrollTop true', async ({ page }) => {
  await page.goto("/cv?search=TypeScript&scrollTop=true");
  await page.waitForLoadState("load");
});

Then("the page scrolls past Highlights into the matching entries", async ({ page }) => {
  const y = await page.evaluate(() => window.scrollY);
  expect(y).toBeGreaterThan(0);
});
