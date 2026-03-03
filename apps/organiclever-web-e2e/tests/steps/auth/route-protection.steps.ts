import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";

const { Given, When, Then } = createBdd();

When("the visitor navigates directly to {string}", async ({ page }, path: string) => {
  await page.goto(path);
  await page.waitForURL(/\/login/);
});

Given("a visitor navigated to {string} without being logged in", async ({ page, context }, path: string) => {
  await context.clearCookies();
  await page.goto(path);
  await page.waitForURL(/\/login/);
});

Given("the visitor was redirected to the login page", async ({ page }) => {
  await expect(page).toHaveURL(/\/login/);
});

When("the visitor successfully logs in", async ({ page }) => {
  await page.fill('input[type="email"]', "user@example.com");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard/);
});

Then("the visitor should be on the {string} page", async ({ page }, path: string) => {
  await expect(page).toHaveURL(new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});
