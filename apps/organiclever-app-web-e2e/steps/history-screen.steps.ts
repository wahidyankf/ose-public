// @scenario specs/apps/organiclever/app-web/behaviours/stats/history-screen.feature: History shows entries in reverse order
// @scenario specs/apps/organiclever/app-web/behaviours/stats/history-screen.feature: Empty history shows empty state
// @scenario specs/apps/organiclever/app-web/behaviours/stats/history-screen.feature: Session card expands on click

/**
 * Step definitions for the History Screen feature.
 *
 * Covers: specs/apps/organiclever/app-web/behaviours/stats/history-screen.feature
 *
 * Selector notes:
 * - History screen is shown when the "History" TabBar button is active (SPA routing via
 *   XState appMachine). There is no standalone /history URL — the app lives at /app.
 * - The screen renders <h1>History</h1> unconditionally.
 * - SessionCard is a <button> element that toggles expand state on click.
 * - Empty state shows "No sessions yet." text.
 * - Expanded detail renders below the card header row (no data-testid).
 */
import { createBdd } from "playwright-bdd";
import { appPath } from "./_app-shell";
import { clearJournalEntries, seedHomeJournalEntries } from "./_journal-db";
import { expect } from "@playwright/test";

const { Given, When, Then } = createBdd();

Given("the history screen has entries", async ({ page }) => {
  await page.goto(appPath("history"));
  await page.waitForLoadState("domcontentloaded");
  await seedHomeJournalEntries(page);
  await page.reload();
  await expect(page.getByText("Atomic Habits")).toBeVisible({ timeout: 15000 });
  await expect(page.getByText("Kettlebell day")).toBeVisible({ timeout: 15000 });
});

Then("entries are shown newest first", async ({ page }) => {
  const cards = await page.getByRole("button").allTextContents();
  const workoutIndex = cards.findIndex((text) => text.includes("Kettlebell day"));
  const readingIndex = cards.findIndex((text) => text.includes("Atomic Habits"));
  expect(workoutIndex).toBeGreaterThanOrEqual(0);
  expect(readingIndex).toBeGreaterThan(workoutIndex);
});

Given("the history screen has no entries", async ({ page }) => {
  await page.goto(appPath("history"));
  await page.waitForLoadState("domcontentloaded");
  await clearJournalEntries(page);
  await page.reload();
});

Then("the empty state message is shown", async ({ page }) => {
  await expect(page.getByText("No sessions yet.")).toBeVisible({ timeout: 10000 });
});

Given("the history screen shows a workout entry", async ({ page }) => {
  await page.goto(appPath("history"));
  await page.waitForLoadState("domcontentloaded");
  await seedHomeJournalEntries(page);
  await page.reload();
  await expect(page.getByText("Kettlebell day")).toBeVisible({ timeout: 15000 });
});

When("the user taps the session card", async ({ page }) => {
  await page.getByRole("button").filter({ hasText: "Kettlebell day" }).click();
});

Then("the card expands showing details", async ({ page }) => {
  await expect(page.getByText("No exercises recorded.")).toBeVisible();
});
