import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";

const { Given, When, Then } = createBdd();

Given("the visitor opens the OrganicLever home page", async ({ page }) => {
  await page.goto("/");
});

Given("the user opens the OrganicLever home page", async ({ page }) => {
  await page.goto("/");
});

Given("the visitor is on the OrganicLever home page", async ({ page }) => {
  await page.goto("/");
});

Then("the header should display a {string} link", async ({ page }, name: string) => {
  await expect(page.locator("header").getByRole("link", { name })).toBeVisible();
});

Then("a {string} link should not be visible in the header", async ({ page }, name: string) => {
  await expect(page.locator("header").getByRole("link", { name })).not.toBeVisible();
});

Then("the page should display a {string} button", async ({ page }, name: string) => {
  await expect(page.getByRole("link", { name })).toBeVisible();
});

Then("the page headline should read {string}", async ({ page }, headline: string) => {
  await expect(page.getByRole("heading", { name: headline })).toBeVisible();
});

When("the visitor clicks the {string} button", async ({ page }, name: string) => {
  await page.getByRole("link", { name }).click();
});

Then("the visitor should be on the login page", async ({ page }) => {
  await expect(page).toHaveURL(/\/login/);
});
