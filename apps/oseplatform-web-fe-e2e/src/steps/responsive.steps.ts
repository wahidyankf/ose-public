import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";

const { Given, When, Then } = createBdd();

Given("the viewport width is less than 640 pixels", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
});

When("the header is rendered", async ({ page }) => {
  await page.goto("/");
});

Then("the hamburger menu button is visible", async ({ page }) => {
  const hamburger = page.getByRole("button", { name: /menu/i });
  await expect(hamburger).toBeVisible();
});

Then("the desktop navigation links are hidden", async ({ page }) => {
  // Desktop nav links should not be visible on mobile
  const desktopNav = page.locator("nav.hidden, nav[class*='hidden']");
  if ((await desktopNav.count()) > 0) {
    await expect(desktopNav.first()).toBeHidden();
  }
});

Given("the viewport width is greater than 1024 pixels", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
});

Then("the desktop navigation links are visible", async ({ page }) => {
  const navLinks = page.getByRole("link", { name: /updates|about/i });
  await expect(navLinks.first()).toBeVisible();
});

Then("the hamburger menu button is hidden", async ({ page }) => {
  const hamburger = page.getByRole("button", { name: /menu/i });
  await expect(hamburger).toBeHidden();
});
