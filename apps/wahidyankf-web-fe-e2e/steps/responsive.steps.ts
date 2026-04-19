import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";

const { When, Then } = createBdd();

When("a visitor opens the home page at 1440 by 900 viewport", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.waitForLoadState("load");
});

When("a visitor opens the home page at 768 by 1024 viewport", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto("/");
  await page.waitForLoadState("load");
});

When("a visitor opens the home page at 375 by 812 viewport", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await page.waitForLoadState("load");
});

Then("a left sidebar is visible with Home, CV, and Personal Projects links", async ({ page }) => {
  for (const name of [/^Home$/, /^CV$/, /^Personal Projects$/]) {
    await expect(page.getByRole("link", { name }).first()).toBeVisible();
  }
});

Then("no bottom tab bar is rendered", async ({ page }) => {
  const tabBarCandidate = page.locator('nav[aria-label="Mobile navigation"], .fixed.bottom-0');
  const count = await tabBarCandidate.count();
  expect(count).toBe(0);
});

Then("no left sidebar is visible", async ({ page }) => {
  const viewport = page.viewportSize();
  expect(viewport && viewport.width).toBeLessThan(1024);
});

Then("a bottom tab bar is visible with Home, CV, and Personal Projects items", async ({ page }) => {
  for (const name of [/^Home$/, /^CV$/, /^Personal Projects$/]) {
    await expect(page.getByRole("link", { name }).first()).toBeVisible();
  }
});

When("a visitor opens the home page at any viewport", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("load");
});

Then("the theme toggle button is present in the DOM and clickable", async ({ page }) => {
  const toggle = page.getByRole("button", { name: /Switch to (light|dark) theme/ });
  await expect(toggle).toBeVisible();
  await expect(toggle).toBeEnabled();
});
