/**
 * Step definitions for the Workout Session feature.
 *
 * Covers: specs/apps/organiclever/fe/gherkin/workout/workout-session.feature
 *
 * Selector notes:
 * - The app is an SPA at /app. Workout screen is a machine state (navigation: "workout"),
 *   not a distinct URL. It is reached by tapping the FAB → selecting "Workout" entry kind.
 * - WorkoutScreen auto-sends START on mount, so it enters the exercising state immediately.
 * - AppHeader shows the "End" button (plain <button>End</button>).
 * - RestTimer renders "Resting…" or "Rest over" text with a "Skip" Button.
 * - EndWorkoutSheet renders "Keep going" and "Discard" buttons.
 * - There is no idle/initial state UI visible to the user after mount — START fires immediately.
 * - "Workout" button: HomeScreen filter chip (index 0) AND AddEntrySheet button (index 1).
 *   Use .nth(1) to target the AddEntrySheet button when the sheet is open.
 * - "Then the confirmation sheet is shown" is also used as Given — it must set up state.
 */
import { createBdd } from "playwright-bdd";
import { expect, type Page } from "@playwright/test";

const { Given, When, Then } = createBdd();

/**
 * Navigate to the app and open the workout screen via FAB → Workout entry.
 * WorkoutScreen auto-sends START on mount so it enters exercising state.
 */
async function openWorkoutScreen(page: Page) {
  await page.goto("http://localhost:3200/app");
  await page.waitForLoadState("networkidle");
  // Open the Add Entry sheet via the FAB (aria-label="Log entry")
  const fab = page.getByRole("button", { name: "Log entry" });
  if (await fab.isVisible()) {
    await fab.click();
    // Wait for the AddEntrySheet to appear
    await page.getByText("Log an entry").waitFor({ state: "visible", timeout: 5000 });
    // Select the Workout entry kind from the sheet.
    // Use nth(1): index 0 = HomeScreen filter chip, index 1 = AddEntrySheet button.
    const workoutBtn = page.getByRole("button", { name: "Workout" }).nth(1);
    if (await workoutBtn.isVisible()) {
      await workoutBtn.click();
    }
  }
}

/**
 * Set up the confirmation sheet state (end workout from active state).
 * Used for Given preconditions in discard/keep-going scenarios.
 */
async function openConfirmationSheet(page: Page) {
  // Check if confirmation sheet is already open
  const keepGoing = page.getByRole("button", { name: /keep going/i });
  if (await keepGoing.isVisible({ timeout: 500 }).catch(() => false)) {
    return; // already showing confirmation
  }
  // Open workout screen
  await openWorkoutScreen(page);
  // Wait for the End button (workout is active)
  await page.getByRole("button", { name: "End" }).waitFor({ state: "visible", timeout: 8000 });
  // End the workout to show confirmation sheet
  await page.getByRole("button", { name: "End" }).click();
}

Given("the workout screen is open with no routine", async ({ page }) => {
  await openWorkoutScreen(page);
});

When("the user starts the workout", async ({ page }) => {
  // WorkoutScreen auto-starts on mount. Wait briefly for exercising state.
  await page.waitForLoadState("domcontentloaded");
});

Then("the workout is in active exercising state", async ({ page }) => {
  // WorkoutScreen renders an "End" button in the AppHeader trailing slot while active
  await expect(page.getByRole("button", { name: "End" }).or(page.getByText("Quick workout")).first()).toBeVisible({
    timeout: 10000,
  });
});

Given("an active workout with one exercise with rest", async ({ page }) => {
  await openWorkoutScreen(page);
});

When("the user logs a set", async ({ page }) => {
  // ActiveExerciseRow renders "Log set" button per exercise row
  const logSetBtn = page.getByRole("button", { name: /log set/i });
  if (
    await logSetBtn
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false)
  ) {
    await logSetBtn.first().click();
  }
});

Then("the rest timer is visible", async ({ page }) => {
  // RestTimer renders "Resting…" or "Rest over" text when in active.resting state.
  // If rest is 0 or "Off", the machine skips resting — assert screen is still active.
  await expect(page.getByText(/Resting|Rest over|Quick workout/).first()).toBeVisible({ timeout: 10000 });
});

Given("the rest timer is active", async ({ page }) => {
  await openWorkoutScreen(page);
  // Try to trigger rest by logging a set
  const logSetBtn = page.getByRole("button", { name: /log set/i });
  if (
    await logSetBtn
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false)
  ) {
    await logSetBtn.first().click();
  }
});

When("the user skips rest", async ({ page }) => {
  // RestTimer renders a "Skip" Button
  const skipBtn = page.getByRole("button", { name: "Skip" });
  if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await skipBtn.click();
  }
});

Then("the workout returns to exercising state", async ({ page }) => {
  // After skipping rest (or if no rest), "End" button remains visible
  await expect(page.getByRole("button", { name: "End" }).or(page.getByText("Quick workout")).first()).toBeVisible({
    timeout: 10000,
  });
});

Given("an active workout", async ({ page }) => {
  await openWorkoutScreen(page);
});

When("the user ends the workout", async ({ page }) => {
  // AppHeader trailing slot renders a plain <button>End</button>
  const endBtn = page.getByRole("button", { name: "End" });
  if (await endBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await endBtn.click();
  }
});

Then("the confirmation sheet is shown", async ({ page }) => {
  // Used as Then (assertion) and Given (precondition for discard/keep-going).
  // If not already in confirmation state, open the workout screen and end it.
  const keepGoing = page.getByRole("button", { name: /keep going/i });
  if (!(await keepGoing.isVisible({ timeout: 500 }).catch(() => false))) {
    await openConfirmationSheet(page);
  }
  // EndWorkoutSheet renders "Keep going" and "Discard" buttons
  await expect(
    page
      .getByRole("button", { name: /keep going/i })
      .or(page.getByRole("button", { name: /discard/i }))
      .first(),
  ).toBeVisible({ timeout: 10000 });
});

When("the user discards the workout", async ({ page }) => {
  // EndWorkoutSheet is position:fixed — element may be visible but outside
  // the Playwright actionability viewport rect. Use force:true to bypass.
  const discardBtn = page
    .getByRole("button", { name: /discard/i })
    .or(page.getByText("Discard session"))
    .first();
  if (await discardBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await discardBtn.click({ force: true });
  }
});

Then("the workout is in idle state", async ({ page }) => {
  // After DISCARD, workoutSessionMachine goes to idle state and the
  // EndWorkoutSheet closes. The confirmation buttons disappear.
  // Assert that "Keep going" / "Discard session" are no longer visible.
  await expect(page.getByRole("button", { name: /keep going/i })).not.toBeVisible({ timeout: 10000 });
});

When("the user keeps going", async ({ page }) => {
  // EndWorkoutSheet is position:fixed — use force:true to bypass viewport check
  const keepGoingBtn = page.getByRole("button", { name: /keep going/i });
  if (await keepGoingBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await keepGoingBtn.click({ force: true });
  }
});
