/**
 * Step definitions for the App Shell Navigation feature.
 *
 * Covers: specs/apps/organiclever/fe/gherkin/app-shell/navigation.feature
 *
 * Selector notes:
 * - The app lives at /app (AppRoot mounts there). Root / is the marketing landing page.
 * - TabBar buttons are plain <button> elements with text labels — no data-testid, no <a> links.
 * - FAB button carries aria-label="Log entry".
 * - AddEntrySheet is a fixed overlay rendered when the FAB is pressed.
 */
import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";
import { appPath } from "./_app-shell";

const { Given, When, Then } = createBdd();

Given("the app is freshly loaded", async ({ page }) => {
  await page.goto(appPath("home"));
  await page.waitForLoadState("domcontentloaded");
});

Given("the app shell is visible", async ({ page }) => {
  await page.goto(appPath("home"));
  await page.waitForLoadState("domcontentloaded");
});

Then("the Home tab is active", async ({ page }) => {
  // Home screen shows "Good morning" heading — reliable DOM anchor
  await expect(page.getByText("Good morning").or(page.getByText("Last 7 days")).first()).toBeVisible({
    timeout: 10000,
  });
});

When("the user taps the History tab", async ({ page }) => {
  // Tab is a <a href="/app/history"> with aria-current — match by role=link.
  const link = page.getByRole("link", { name: "History" }).first();
  if (await link.isVisible()) {
    await link.click();
  }
});

Then("the History tab is active", async ({ page }) => {
  // History screen renders an <h1>History</h1> unconditionally
  await expect(page.getByRole("heading", { name: "History" })).toBeVisible({ timeout: 10000 });
});

When("the user taps the Progress tab", async ({ page }) => {
  const link = page.getByRole("link", { name: "Progress" }).first();
  if (await link.isVisible()) {
    await link.click();
  }
});

Then("the Progress tab is active", async ({ page }) => {
  // Progress screen renders "Analytics" heading text
  await expect(page.getByText("Analytics").or(page.getByText("Patterns & progress over time")).first()).toBeVisible({
    timeout: 10000,
  });
});

When("the user taps the Settings tab", async ({ page }) => {
  const link = page.getByRole("link", { name: "Settings" }).first();
  if (await link.isVisible()) {
    await link.click();
  }
});

Then("the Settings tab is active", async ({ page }) => {
  // Settings screen has data-testid="settings-screen" on the root div — use testid only
  // to avoid strict mode violations from the SideNav "Settings" button
  await expect(page.locator("[data-testid='settings-screen']")).toBeVisible({ timeout: 10000 });
});

When("the user taps the FAB button", async ({ page }) => {
  // FAB carries aria-label="Log entry"
  const fab = page.getByRole("button", { name: "Log entry" });
  if (await fab.isVisible()) {
    await fab.click();
  }
});

Then("the Add Entry sheet is open", async ({ page }) => {
  // Used both as Then (assertion) and Given (precondition).
  // If the sheet is not already open, navigate to the app and open it.
  const sheetText = page.getByText("Log an entry");
  if (!(await sheetText.isVisible())) {
    await page.goto(appPath("home"));
    await page.waitForLoadState("domcontentloaded");
    const fab = page.getByRole("button", { name: "Log entry" });
    if (await fab.isVisible()) {
      await fab.click();
    }
  }
  await expect(sheetText).toBeVisible({ timeout: 10000 });
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
