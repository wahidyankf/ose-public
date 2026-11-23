// @scenario specs/apps/organiclever/app-web/behaviours/workout-session/workout-session.feature: Starting a blank workout lets the user begin logging sets
// @scenario specs/apps/organiclever/app-web/behaviours/workout-session/workout-session.feature: Log a set triggers rest timer
// @scenario specs/apps/organiclever/app-web/behaviours/workout-session/workout-session.feature: Skipping rest hides the rest timer
// @scenario specs/apps/organiclever/app-web/behaviours/workout-session/workout-session.feature: End workout shows confirmation sheet
// @scenario specs/apps/organiclever/app-web/behaviours/workout-session/workout-session.feature: Discarding the workout ends it
// @scenario specs/apps/organiclever/app-web/behaviours/workout-session/workout-session.feature: Keep going closes the confirmation sheet and the workout continues
// @scenario specs/apps/organiclever/app-web/behaviours/workout-session/workout-session.feature: Opening /app/workout/finish without a finished workout returns to /app/home
// @scenario specs/apps/organiclever/app-web/behaviours/workout-session/workout-session.feature: Finishing a workout shows the workout summary

import { createBdd } from "playwright-bdd";
import { expect, type Page } from "@playwright/test";
import { appPath } from "./_app-shell";
import { createRoutine } from "./_routine";

const { Given, When, Then } = createBdd();

async function openBlankWorkout(page: Page) {
  await page.goto(appPath("home"));
  await page.getByRole("button", { name: "Log entry" }).click();
  await expect(page.getByText("Log an entry")).toBeVisible();
  await page.getByRole("button", { name: "Workout" }).nth(1).click();
  await expect(page).toHaveURL(/\/app\/workout$/);
  await expect(page.locator("[data-workout-state]")).toHaveAttribute("data-workout-state", "active.exercising");
}

async function openRoutineWorkout(page: Page) {
  await createRoutine(page, {
    name: "Kettlebell day",
    exerciseName: "Turkish Get-Up",
    rest: "30s",
  });
  const routine = page.getByText("Kettlebell day", { exact: true }).first();
  await expect(routine).toBeVisible();
  await routine.click();
  await expect(page).toHaveURL(/\/app\/workout$/);
  await expect(page.getByRole("button", { name: "End" })).toBeVisible();
}

async function openConfirmation(page: Page) {
  await openBlankWorkout(page);
  await expect(page.getByRole("button", { name: "End" })).toBeVisible();
  await page.getByRole("button", { name: "End" }).click();
  await expect(page.getByText("End workout?")).toBeVisible();
}

Given("the app shell has no selected routine", async ({ page }) => {
  await page.goto(appPath("home"));
  await expect(page.getByRole("button", { name: "Log entry" })).toBeVisible();
});

When("the user opens a blank workout", async ({ page }) => {
  await page.getByRole("button", { name: "Log entry" }).click();
  await page.getByRole("button", { name: "Workout" }).nth(1).click();
});

Then("the user can log sets", async ({ page }) => {
  await expect(page).toHaveURL(/\/app\/workout$/);
  await expect(page.getByRole("button", { name: "End" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Quick workout" })).toBeVisible();
});

Given("an active workout with one exercise with rest", async ({ page }) => {
  await openRoutineWorkout(page);
  await expect(page.getByText("Turkish Get-Up", { exact: true })).toBeVisible();
});

When("the user logs a set", async ({ page }) => {
  await page.getByText("Set 1", { exact: true }).first().click();
});

Then("the rest timer is visible", async ({ page }) => {
  await expect(page.getByText("Resting…")).toBeVisible();
  await expect(page.locator("[data-workout-state]")).toHaveAttribute("data-workout-state", "active.resting");
  await expect(page.getByRole("button", { name: "Skip" })).toBeVisible();
});

Given("the rest timer is active", async ({ page }) => {
  await openRoutineWorkout(page);
  await page.getByText("Set 1", { exact: true }).first().click();
  await expect(page.getByText("Resting…")).toBeVisible();
});

When("the user skips rest", async ({ page }) => {
  await page.getByRole("button", { name: "Skip" }).click();
});

Then("the rest timer is hidden", async ({ page }) => {
  await expect(page.getByText("Resting…")).not.toBeVisible();
  await expect(page.locator("[data-workout-state]")).toHaveAttribute("data-workout-state", "active.exercising");
  await expect(page.getByRole("button", { name: "End" })).toBeVisible();
});

Given("an active workout", async ({ page }) => {
  await openBlankWorkout(page);
  await expect(page.getByRole("button", { name: "End" })).toBeVisible();
});

When("the user ends the workout", async ({ page }) => {
  await page.getByRole("button", { name: "End" }).click();
});

Then("the confirmation sheet is shown", async ({ page }) => {
  await expect(page.getByText("End workout?")).toBeVisible();
  await expect(page.locator("[data-workout-state]")).toHaveAttribute("data-workout-state", "active.confirming");
  await expect(page.getByRole("button", { name: "Keep going" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Discard session" })).toBeVisible();
});

Given("the user has opened the confirmation sheet", async ({ page }) => {
  await openConfirmation(page);
});

When("the user discards the workout", async ({ page }) => {
  await page.getByRole("button", { name: "Discard session" }).click();
});

Then("no workout is in progress", async ({ page }) => {
  await expect(page.getByText("End workout?")).not.toBeVisible();
  await expect(page.locator("[data-workout-state]")).toHaveAttribute("data-workout-state", "idle");
});

When("the user keeps going", async ({ page }) => {
  await page.getByRole("button", { name: "Keep going" }).click();
});

Then("the workout continues", async ({ page }) => {
  await expect(page.getByText("End workout?")).not.toBeVisible();
  await expect(page.locator("[data-workout-state]")).toHaveAttribute("data-workout-state", "active.exercising");
  await expect(page.getByRole("button", { name: "End" })).toBeVisible();
});

Given("no workout has been finished", async ({ page }) => {
  await page.goto(appPath("home"));
  await expect(page.getByRole("button", { name: "Log entry" })).toBeVisible();
});

When("the user opens the workout finish page", async ({ page }) => {
  await page.goto(appPath("workout/finish"));
  await page.waitForLoadState("domcontentloaded");
});

Given("the user has finished a workout with one logged set", async ({ page }) => {
  await openRoutineWorkout(page);
  await page.getByText("Set 1", { exact: true }).first().click();
  await expect(page.getByText("Resting…")).toBeVisible();
  await page.getByRole("button", { name: "Skip" }).click();
});

When("the user saves and finishes the workout", async ({ page }) => {
  await page.getByRole("button", { name: "End" }).click();
  await page.getByRole("button", { name: "Save & finish" }).click();
});

Then("the workout summary is shown", async ({ page }) => {
  await expect(page).toHaveURL(/\/app\/workout\/finish$/);
  await expect(page.getByRole("heading", { name: "Nice work." })).toBeVisible();
  await expect(page.getByText("Workout complete")).toBeVisible();
});
