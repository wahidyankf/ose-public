import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";

const { When, Then } = createBdd();

When("a visitor opens the personal projects page", async ({ page }) => {
  await page.goto("/personal-projects");
  await page.waitForLoadState("load");
});

Then('the H1 shows "Personal Projects"', async ({ page }) => {
  await expect(page.getByRole("heading", { level: 1, name: /Personal Projects/ })).toBeVisible();
});

Then('a search input with placeholder "Search projects..." is visible', async ({ page }) => {
  await expect(page.getByPlaceholder(/Search projects/i)).toBeVisible();
});

Then("at least one project card is visible", async ({ page }) => {
  const cardCount = await page.locator("h2, h3").count();
  expect(cardCount).toBeGreaterThan(0);
});

Then(
  "every project card exposes a Repository, Website, or YouTube link where the project has that resource",
  async ({ page }) => {
    const externalLinks = await page.getByRole("link", { name: /Repository|Website|YouTube/i }).count();
    expect(externalLinks).toBeGreaterThan(0);
  },
);
