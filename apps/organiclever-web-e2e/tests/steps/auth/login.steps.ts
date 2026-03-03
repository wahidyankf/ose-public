import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";

const { Given, When, Then } = createBdd();

let storedEmail = "";
let storedPassword = "";

Given("a registered user with email {string} and password {string}", async ({}, email: string, password: string) => {
  storedEmail = email;
  storedPassword = password;
});

When("the user submits the login form with those credentials", async ({ page }) => {
  await page.goto("/login");
  await page.fill('input[type="email"]', storedEmail);
  await page.fill('input[type="password"]', storedPassword);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard/);
});

Then("the user should be on the dashboard page", async ({ page }) => {
  await expect(page).toHaveURL(/\/dashboard/);
});

Then("an authentication session should be active", async ({ page }) => {
  await expect(page).toHaveURL(/\/dashboard/);
});

When("the visitor submits email {string} and password {string}", async ({ page }, email: string, password: string) => {
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForLoadState("networkidle");
});

Then("the error {string} should be displayed", async ({ page }, error: string) => {
  await expect(page.getByText(error)).toBeVisible();
});

When("the user navigates to the login page", async ({ page }) => {
  await page.goto("/login");
  await page.waitForURL(/\/dashboard/);
});
