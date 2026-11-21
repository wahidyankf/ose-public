// @scenario specs/apps/organiclever/app-web/behaviours/stats/progress-screen.feature: Progress screen shows workout module by default
// @scenario specs/apps/organiclever/app-web/behaviours/stats/progress-screen.feature: Switch to reading module
// @scenario specs/apps/organiclever/app-web/behaviours/stats/progress-screen.feature: Tapping an exercise card shows its progress chart

/**
 * Step definitions for the Progress Screen feature.
 *
 * Covers: specs/apps/organiclever/app-web/behaviours/stats/progress-screen.feature
 *
 * Selector notes:
 * - Progress screen is a machine state tab (navigation: "main", tab: "progress").
 *   Navigate to /app and click the "Progress" TabBar button.
 * - The screen header shows "Analytics" and "Patterns & progress over time".
 * - Module pill tabs are plain <button> elements with aria-pressed attribute.
 *   Labels: "Workout", "Reading", "Learning", "Meal", "Focus".
 * - Workout module is active by default (activeModule="workout" initial state).
 * - ExerciseProgressCard renders as a collapsible card — click to expand SVG chart.
 */
import { createBdd } from "playwright-bdd";
import { appPath } from "./_app-shell";
import { seedHomeJournalEntries, seedWorkoutProgress } from "./_journal-db";
import { expect } from "@playwright/test";

const { Given, When, Then } = createBdd();

Given("the progress screen is loaded", async ({ page }) => {
  await page.goto(appPath("home"));
  await page.waitForLoadState("domcontentloaded");
  // Click the Progress TabBar button to navigate to the progress screen
  const progressBtn = page.getByRole("link", { name: "Progress" }).first();
  await expect(progressBtn).toBeVisible();
  await progressBtn.click();
});

Then("the workout module is active", async ({ page }) => {
  await expect(page.getByRole("button", { name: "Workout" })).toHaveAttribute("aria-pressed", "true");
});

When("the user selects the Reading module", async ({ page }) => {
  // Module pill tabs are <button type="button"> with aria-pressed.
  // Use first() to avoid ambiguity with filter chips on other screens.
  const btn = page.getByRole("button", { name: "Reading" }).first();
  await expect(btn).toBeVisible();
  await btn.click();
});

Then("the reading module content is shown", async ({ page }) => {
  await expect(page.getByRole("button", { name: "Reading" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText(/No reading sessions yet|\d+ total/)).toBeVisible();
});

Given("there is exercise progress data", async ({ page }) => {
  await page.goto(appPath("home"));
  await page.waitForLoadState("domcontentloaded");
  await seedHomeJournalEntries(page);
  await seedWorkoutProgress(page);
  await page.goto(appPath("progress"));
  await expect(page.getByRole("button", { name: "Squat progress" })).toBeVisible({ timeout: 15000 });
});

When("the user taps an exercise card", async ({ page }) => {
  await page.getByRole("button", { name: "Squat progress" }).click();
});

Then("the progress chart is visible", async ({ page }) => {
  await expect(page.getByLabel("Weight progression chart for Squat")).toBeVisible({ timeout: 10000 });
});
