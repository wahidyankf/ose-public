// @scenario specs/apps/organiclever/app-web/behaviours/app-shell/entry-loggers.feature: The add button opens the Add Entry sheet and the user can close it
// @scenario specs/apps/organiclever/app-web/behaviours/app-shell/entry-loggers.feature: Choosing an entry kind opens its logger
// @scenario specs/apps/organiclever/app-web/behaviours/app-shell/entry-loggers.feature: Saving an entry closes the logger and adds it to the journal
// @scenario specs/apps/organiclever/app-web/behaviours/app-shell/entry-loggers.feature: Reading logger save is disabled without title
// @scenario specs/apps/organiclever/app-web/behaviours/app-shell/entry-loggers.feature: Focus logger save requires task or duration

import { createBdd } from "playwright-bdd";
import { expect, type Page } from "@playwright/test";
import { appPath } from "./_app-shell";
import { journalEntryCount } from "./_journal-db";

const { Given, When, Then } = createBdd();

// The logger kind the current scenario opened, and the journal row it should save.
let openedKind: string | null = null;
let expectedSavedEntry: { name: string; payloadText: string } | null = null;

const SAVED_ENTRY: Record<string, { name: string; payloadText: string }> = {
  Reading: { name: "reading", payloadText: "Atomic Habits" },
  Learning: { name: "learning", payloadText: "TypeScript generics" },
  Meal: { name: "meal", payloadText: "Oatmeal with berries" },
  Focus: { name: "focus", payloadText: "25" },
  Custom: { name: "custom-evening-walk", payloadText: "Evening walk" },
};

const LOGGER_TITLE: Record<string, string> = {
  Reading: "Log reading",
  Learning: "Log learning",
  Meal: "Log meal",
  Focus: "Log focus session",
  Custom: "New custom entry",
};

async function openAddEntrySheet(page: Page) {
  await page.goto(appPath("home"));
  await page.waitForLoadState("domcontentloaded");
  const fab = page.getByRole("button", { name: "Log entry" });
  await expect(fab).toBeVisible();
  await fab.click();
  await expect(page.getByText("Log an entry")).toBeVisible();
}

async function selectKind(page: Page, kind: string) {
  if (kind === "Custom") {
    await page.getByRole("button", { name: /New custom type/ }).click();
    return;
  }
  const button = page.getByRole("button", { name: kind }).nth(1);
  await expect(button).toBeVisible();
  await button.click();
}

async function openLogger(page: Page, kind: string) {
  await openAddEntrySheet(page);
  await selectKind(page, kind);
  openedKind = kind;
  expectedSavedEntry = SAVED_ENTRY[kind] ?? null;
}

Given("the user has opened the Add Entry sheet", async ({ page }) => {
  await openAddEntrySheet(page);
});

When("the user taps the FAB", async ({ page }) => {
  const fab = page.getByRole("button", { name: "Log entry" });
  await expect(fab).toBeVisible();
  await fab.click();
});

Then("the Add Entry sheet is open with all entry kinds", async ({ page }) => {
  await expect(page.getByText("Log an entry")).toBeVisible();
  for (const label of ["Workout", "Reading", "Learning", "Meal", "Focus"]) {
    await expect(page.getByRole("button", { name: label }).nth(1)).toBeVisible();
  }
  await expect(page.getByRole("button", { name: /New custom type/ })).toBeVisible();
});

When(/^the user selects the "([^"]+)" entry kind$/, async ({ page }, kind: string) => {
  await selectKind(page, kind);
});

Then(/^the "([^"]+)" logger is open$/, async ({ page }, kind: string) => {
  await expect(page.getByText(LOGGER_TITLE[kind] ?? kind)).toBeVisible();
});

Given("the user has opened the reading logger", async ({ page }) => {
  await openLogger(page, "Reading");
});

Given("the user has opened the focus logger", async ({ page }) => {
  await openLogger(page, "Focus");
});

Given(/^the user has opened the "([^"]+)" logger$/, async ({ page }, kind: string) => {
  await openLogger(page, kind);
});

When(/^the user enters "([^"]+)" in the "([^"]+)" logger$/, async ({ page }, entry: string, kind: string) => {
  if (kind === "Focus") {
    // The focus logger takes a minute preset; the Examples value names the preset button.
    await page.getByRole("button", { name: entry }).click();
    return;
  }
  if (kind === "Reading") {
    await page.getByPlaceholder("e.g. Thinking Fast and Slow").fill(entry);
    return;
  }
  if (kind === "Learning") {
    await page.getByPlaceholder(/React hooks/).fill(entry);
    return;
  }
  if (kind === "Meal") {
    await page.getByPlaceholder(/Oatmeal with berries/).fill(entry);
    return;
  }
  await page.getByPlaceholder(/Evening walk/).fill(entry);
});

When("the user saves the entry", async ({ page }) => {
  const save =
    openedKind === "Custom"
      ? page.getByRole("button", { name: "Save", exact: true })
      : page.getByRole("button", { name: "Save" });
  await expect(save).toBeEnabled();
  await save.click();
});

Then("the entry appears in the journal and the logger closes", async ({ page }) => {
  expect(expectedSavedEntry).not.toBeNull();
  if (openedKind === "Custom") {
    await expect(page.getByText("New custom entry")).not.toBeVisible();
  } else {
    await expect(page.getByRole("button", { name: "Save" })).not.toBeVisible();
  }
  await expect
    .poll(() => journalEntryCount(page, expectedSavedEntry!.name, expectedSavedEntry!.payloadText))
    .toBeGreaterThan(0);
});

When("the user has not entered a title", async ({ page }) => {
  await page.getByPlaceholder("e.g. Thinking Fast and Slow").clear();
});

Then("the save button is disabled", async ({ page }) => {
  await expect(page.getByRole("button", { name: "Save" })).toBeDisabled();
});

When("the user has not entered task or duration", async ({ page }) => {
  await page.getByPlaceholder(/Feature design/).clear();
  await page.getByPlaceholder("or enter custom minutes").clear();
});
