// @scenario specs/apps/organiclever/app-web/behaviours/journal/home-screen.feature: Home screen shows entry list
// @scenario specs/apps/organiclever/app-web/behaviours/journal/home-screen.feature: Filter entries by kind
// @scenario specs/apps/organiclever/app-web/behaviours/journal/home-screen.feature: Tapping an entry opens its detail sheet
// @scenario specs/apps/organiclever/app-web/behaviours/journal/home-screen.feature: Closing the detail sheet returns to the entry list

/**
 * Step definitions for the Home Screen feature.
 *
 * Covers: specs/apps/organiclever/app-web/behaviours/journal/home-screen.feature
 *
 * Selector notes:
 * - Home screen always renders "Good morning" as the greeting and "Last 7 days" in the week card.
 * - Filter chips are plain <button> elements with label text from ENTRY_MODULES (e.g. "Workout").
 * - Entry items are rendered by EntryItem inside a date-grouped list — no data-testid.
 * - Entry detail sheet uses EntryDetailSheet rendered as a fixed overlay.
 * - WorkoutModuleView is shown when the Workout filter is active (or no filter).
 */
import { createBdd } from "playwright-bdd";
import { appPath } from "./_app-shell";
import { seedHomeJournalEntries } from "./_journal-db";
import { expect } from "@playwright/test";

const { Given, When, Then } = createBdd();

Given("the home screen is loaded with entries", async ({ page }) => {
  await page.goto(appPath("home"));
  await page.waitForLoadState("domcontentloaded");
  await seedHomeJournalEntries(page);
  await page.reload();
  await expect(page.getByText("Atomic Habits")).toBeVisible({ timeout: 15000 });
});

Then("the entry list is visible", async ({ page }) => {
  // Home screen always shows "Recent entries" label or the workout module section
  await expect(page.getByText("Recent entries").or(page.getByText("Last 7 days")).first()).toBeVisible({
    timeout: 10000,
  });
});

Given("the home screen is loaded with workout and reading entries", async ({ page }) => {
  await page.goto(appPath("home"));
  await page.waitForLoadState("domcontentloaded");
  await seedHomeJournalEntries(page);
  await page.reload();
  await expect(page.getByText("Atomic Habits")).toBeVisible({ timeout: 15000 });
  await expect(page.getByText("Kettlebell day")).toBeVisible({ timeout: 15000 });
});

When("the user selects the Workout filter", async ({ page }) => {
  // Filter chips are <button> elements with the module label as text
  const btn = page.getByRole("button", { name: "Workout" });
  await expect(btn).toBeVisible();
  await btn.click();
});

Then("only workout entries are shown", async ({ page }) => {
  await expect(page.getByRole("button", { name: "Workout" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("Atomic Habits")).not.toBeVisible();
  await expect(page.getByText("Workout templates")).toBeVisible();
});

Given("the home screen shows an entry", async ({ page }) => {
  await page.goto(appPath("home"));
  await page.waitForLoadState("domcontentloaded");
  await seedHomeJournalEntries(page);
  await page.reload();
  await expect(page.getByText("Atomic Habits")).toBeVisible({ timeout: 15000 });
});

When("the user taps the entry", async ({ page }) => {
  await page.getByText("Atomic Habits").click();
});

Then("the entry detail sheet opens", async ({ page }) => {
  await expect(page.getByRole("button", { name: "Close" })).toBeVisible();
  await expect(page.getByText("James Clear")).toBeVisible();
});

When("the user closes the sheet", async ({ page }) => {
  await page.getByRole("button", { name: "Close" }).click();
});

Given("the entry detail sheet is open", async ({ page }) => {
  await page.goto(appPath("home"));
  await page.waitForLoadState("domcontentloaded");
  await seedHomeJournalEntries(page);
  await page.reload();
  await expect(page.getByText("Atomic Habits")).toBeVisible({ timeout: 15000 });
  await page.getByText("Atomic Habits").click();
  await expect(page.getByRole("button", { name: "Close" })).toBeVisible();
});
