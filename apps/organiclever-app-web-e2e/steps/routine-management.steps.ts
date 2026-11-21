// @scenario specs/apps/organiclever/app-web/behaviours/routine/routine-management.feature: Create a new routine
// @scenario specs/apps/organiclever/app-web/behaviours/routine/routine-management.feature: Add an exercise to a routine
// @scenario specs/apps/organiclever/app-web/behaviours/routine/routine-management.feature: Delete a routine

import { createBdd } from "playwright-bdd";
import { expect, type Page } from "@playwright/test";
import { appPath } from "./_app-shell";
import { createRoutine } from "./_routine";

const { Given, When, Then } = createBdd();

async function openNewRoutine(page: Page) {
  await page.goto(appPath("home"));
  await expect(page.getByRole("button", { name: "New" })).toBeVisible();
  await page.getByRole("button", { name: "New" }).click();
  await expect(page).toHaveURL(/\/app\/routines\/edit$/);
  await expect(page.getByRole("heading", { name: "New routine" })).toBeVisible();
}

Given("the edit routine screen is open for a new routine", async ({ page }) => {
  await openNewRoutine(page);
});

When("the user enters a routine name", async ({ page }) => {
  await page.getByLabel("Routine name").fill("Morning Routine");
});

When("the user saves the routine", async ({ page }) => {
  const save = page.getByRole("button", { name: /Save/ });
  await expect(save).toBeEnabled();
  await save.click();
});

Then("the routine is saved", async ({ page }) => {
  await expect(page).toHaveURL(/\/app\/home$/);
  await expect(page.getByText("Morning Routine")).toBeVisible();
});

Given("the edit routine screen is open", async ({ page }) => {
  await openNewRoutine(page);
});

When("the user adds an exercise", async ({ page }) => {
  await page.getByRole("button", { name: "Add exercise to Main" }).click();
});

Then("the exercise appears in the group", async ({ page }) => {
  await expect(page.getByText("Unnamed exercise")).toBeVisible();
  await expect(page.getByRole("button", { name: "Expand exercise" })).toBeVisible();
});

Given("the edit routine screen is open for an existing routine", async ({ page }) => {
  await createRoutine(page, { name: "Kettlebell day" });
  const edit = page.getByRole("button", { name: "Edit Kettlebell day" });
  await expect(edit).toBeVisible();
  await edit.click();
  await expect(page.getByRole("heading", { name: "Edit routine" })).toBeVisible();
});

When("the user confirms deleting the routine", async ({ page }) => {
  await page.getByRole("button", { name: "Delete routine" }).click();
  await expect(page.getByText(/Delete "Kettlebell day"/)).toBeVisible();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
});

Then("the routine is deleted", async ({ page }) => {
  await expect(page).toHaveURL(/\/app\/home$/);
  await expect(page.getByRole("button", { name: "Edit Kettlebell day" })).not.toBeVisible();
});
