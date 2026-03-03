import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";

const { When, Then, After } = createBdd();

After({ tags: "@sidebar-collapse" }, async ({ page }) => {
  await page.evaluate(() => localStorage.removeItem("sidebarCollapsed"));
});

Then("the dashboard should display {string} active projects", async ({ page }, value: string) => {
  await expect(page.getByText(value)).toBeVisible();
});

Then("the dashboard should display {string} team members", async ({ page }, value: string) => {
  await expect(page.getByText(value)).toBeVisible();
});

When("the user clicks the {string} card", async ({ page }, cardTitle: string) => {
  await page.getByText(cardTitle).click();
});

When("the user clicks the sidebar collapse button", async ({ page }) => {
  const sidebarHeader = page.locator('[class*="border-r"] > div').first();
  await sidebarHeader.getByRole("button").click();
});

When("the user refreshes the page", async ({ page }) => {
  await page.reload();
  await page.waitForLoadState("networkidle");
});

Then("the sidebar should remain collapsed", async ({ page }) => {
  const collapsed = await page.evaluate(() => localStorage.getItem("sidebarCollapsed"));
  expect(collapsed).toBe("true");
});
