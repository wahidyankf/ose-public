// @scenario specs/apps/organiclever/app-web/behaviours/app-shell/navigation.feature: Tapping a tab opens its screen and marks the tab active
// @scenario specs/apps/organiclever/app-web/behaviours/app-shell/navigation.feature: URL persists across page refresh on each tab

/**
 * Step definitions for the App Shell Navigation and Entry Loggers features.
 *
 * Covers: specs/apps/organiclever/app-web/behaviours/app-shell/navigation.feature
 * Covers: specs/apps/organiclever/app-web/behaviours/app-shell/entry-loggers.feature (the sheet close steps)
 *
 * Selector notes:
 * - The app lives at /app (AppRoot mounts there). Root / redirects to /app/home
 *   (the marketing landing now lives in the separate organiclever-www site).
 * - TabBar buttons are plain <button> elements with text labels — no data-testid, no <a> links.
 * - AddEntrySheet is a fixed overlay rendered when the FAB is pressed.
 */
import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";
import { appPath } from "./_app-shell";

const { Given, When, Then } = createBdd();

Given("the app shell is visible", async ({ page }) => {
  await page.goto(appPath("home"));
  await page.waitForLoadState("domcontentloaded");
});

When(/^the user taps the "([^"]+)" tab$/, async ({ page }, tab: string) => {
  // Tab is a <a href="/app/<tab>"> with aria-current — match by role=link.
  const link = page.getByRole("link", { name: tab }).first();
  await expect(link).toBeVisible();
  await link.click();
});

When("the user closes the Add Entry sheet", async ({ page }) => {
  // AddEntrySheet close button sits in the header row next to "Log an entry" heading.
  // It has no aria-label. Click the backdrop overlay (fixed inset-0 div) to dismiss.
  // The backdrop is the first .fixed element that contains the sheet.
  // Easiest reliable approach: click outside the sheet by clicking a position in the backdrop.
  await page.mouse.click(10, 10);
});

Then("the Add Entry sheet is closed", async ({ page }) => {
  // After dismissal, "Log an entry" heading should no longer be visible
  await expect(page.getByText("Log an entry")).not.toBeVisible({ timeout: 5000 });
});
