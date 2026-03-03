import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { loginWithUI } from "../utils/auth";

const { Given, Then } = createBdd();

Given("a visitor has not logged in", async ({ context }) => {
  await context.clearCookies();
});

Given("a user is logged in as {string}", async ({ page }, _email: string) => {
  await loginWithUI(page);
});

Given("a user is already logged in as {string}", async ({ page }, _email: string) => {
  await loginWithUI(page);
});

Given("a user is logged in", async ({ page }) => {
  await loginWithUI(page);
});

Given("a user is logged in and on the dashboard", async ({ page }) => {
  await loginWithUI(page);
  await page.goto("/dashboard");
  await page.waitForLoadState("networkidle");
});

Given("a user is logged in and on the members page", async ({ page }) => {
  await loginWithUI(page);
  // Use client-side nav via sidebar link to avoid auth race condition on full page load
  await page.locator("a[href='/dashboard/members']").click();
  await page.waitForURL(/\/dashboard\/members$/);
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { name: "Members" })).toBeVisible();
  await expect(page.locator("tbody tr")).toHaveCount(6);
});

Given("a visitor is on the login page", async ({ page }) => {
  await page.goto("/login");
});

Then("the visitor should be redirected to the login page", async ({ page }) => {
  await expect(page).toHaveURL(/\/login/);
});

Then("the user should be redirected to the login page", async ({ page }) => {
  await expect(page).toHaveURL(/\/login/);
});

Then("the user should be on the members list page", async ({ page }) => {
  await page.waitForURL(/\/dashboard\/members$/);
});

Then("the visitor should remain on the login page", async ({ page }) => {
  await expect(page).toHaveURL(/\/login/);
});

Then("the user should be redirected to the dashboard", async ({ page }) => {
  await page.waitForURL(/\/dashboard/);
});
