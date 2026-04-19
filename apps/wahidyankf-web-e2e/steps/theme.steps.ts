import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";

const { When, Then } = createBdd();

When("a visitor opens the home page for the first time", async ({ page }) => {
  await page.context().clearCookies();
  await page.goto("/");
  await page.waitForLoadState("load");
});

Then('the html element has no "light-theme" class', async ({ page }) => {
  const hasClass = await page.evaluate(() => document.documentElement.classList.contains("light-theme"));
  expect(hasClass).toBe(false);
});

Then('the theme toggle aria-label is "Switch to light theme"', async ({ page }) => {
  await expect(page.getByRole("button", { name: "Switch to light theme" })).toBeVisible();
});

When("the visitor clicks the theme toggle", async ({ page }) => {
  await page.getByRole("button", { name: /Switch to (light|dark) theme/ }).click();
});

Then('the html element has the "light-theme" class', async ({ page }) => {
  await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains("light-theme"))).toBe(true);
});

Then('the theme toggle aria-label is "Switch to dark theme"', async ({ page }) => {
  await expect(page.getByRole("button", { name: "Switch to dark theme" })).toBeVisible();
});

When("the visitor navigates to the CV page", async ({ page }) => {
  await page.getByRole("link", { name: /^CV$/ }).first().click();
  await page.waitForLoadState("load");
});

Then('the html element still has the "light-theme" class', async ({ page }) => {
  await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains("light-theme"))).toBe(true);
});

When("the visitor reloads the page", async ({ page }) => {
  await page.reload();
  await page.waitForLoadState("load");
});
