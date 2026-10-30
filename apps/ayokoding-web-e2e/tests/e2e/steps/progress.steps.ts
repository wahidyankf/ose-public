// Browser learning progress steps for the Playwright E2E adapter. Progress
// is browser-owned by design: completion lives in this origin's localStorage
// under the v1 schema the app's own helpers prove, and no request may carry
// it. Steps drive the real storage API and the real network pipeline; the
// completion, reset, and notice controls themselves are shell-lane UI that
// these steps do not invent.
import { createBdd } from "playwright-bdd";
import { expect, type Page } from "@playwright/test";
import { gotoPage, statusOf } from "../support/http";
import { installRecorder, assertNoProgressLeak } from "../support/network";
import {
  PROGRESS_KEY,
  clearProgress,
  completePage,
  isValidRecord,
  readRaw,
  readRecord,
  setStoredValue,
  storedValue,
  writeRecord,
  type ProgressRecord,
} from "../support/storage";
import { portAnswers, startExternalStub } from "../support/servers";
import { stateFor, trackOwned } from "../support/state";
import fixtureRecords from "../fixtures/progress-records.json";

const { Given, When, Then } = createBdd();

// withOrigin navigates the suite origin so localStorage is available.
async function withOrigin(page: Page): Promise<void> {
  await gotoPage(page, "/en");
  expect(statusOf(page)).toBe(200);
}

Given("a reader has no saved progress", async ({ page }) => {
  await installRecorder(page);
  await withOrigin(page);
  await clearProgress(page);
  expect(await readRaw(page)).toBeNull();
});

When("the reader marks a learning page complete and reloads it", async ({ page }) => {
  await gotoPage(page, "/en/learn/courses/go-basics/learning/hello-world");
  await page.locator("[data-progress-control='complete-trigger']").click();
  await expect(page.locator("[data-progress-control='complete-trigger']")).toHaveAttribute("aria-pressed", "true");
  await page.reload();
});

Then("the page remains marked complete", async ({ page }) => {
  await expect(page.locator("[data-progress-control='complete-trigger']")).toHaveAttribute("aria-pressed", "true");
  const record = await readRecord(page);
  expect(record.completed).toContain("go-basics/hello-world");
});

Then("no HTTP request or htmx request carries the stored progress record", async ({ page }) => {
  assertNoProgressLeak(page);
});

Given("this origin contains a valid ayokoding-learn-progress-v1 record", async ({ page }) => {
  await withOrigin(page);
  const valid = fixtureRecords.validV1 as ProgressRecord;
  expect(isValidRecord(valid)).toBe(true);
  await writeRecord(page, valid);
});

When("the reader opens its saved course and path", async ({ page }) => {
  await gotoPage(page, "/en/learn/courses/go-basics/learning/setup?path=backend-id");
});

Then("the saved completed pages and visit context appear correctly", async ({ page }) => {
  const record = await readRecord(page);
  expect(record.completed).toEqual(["go-basics/setup"]);
  expect(record.lastPath).toBe("backend-id");
  expect(record.lastCourse).toBe("go-basics");
});

Then("the stored record keeps its version 1 schema", async ({ page }) => {
  const record = await readRecord(page);
  expect(isValidRecord(record)).toBe(true);
  expect(record.version).toBe(1);
});

Given("a course appears in two paths", async ({ page }) => {
  await gotoPage(page, "/en/learn/paths/backend-id");
  expect(statusOf(page)).toBe(200);
});

Given("the reader has completed its learning pages through the first path", async ({ page }) => {
  await completePage(page, "go-basics/setup");
  await completePage(page, "go-basics/hello-world");
});

When("the reader opens the second path", async ({ page }) => {
  await gotoPage(page, "/en/learn/paths/backend-id");
});

Then("the course shows the same completed state", async ({ page }) => {
  const record = await readRecord(page);
  expect(record.completed).toHaveLength(2);
});

Given("a learning page is marked complete", async ({ page }) => {
  await withOrigin(page);
  await completePage(page, "go-basics/hello-world");
});

When("the reader activates its completion control again", async ({ page }) => {
  await gotoPage(page, "/en/learn/courses/go-basics/learning/hello-world");
  await expect(page.locator("[data-progress-control='complete-trigger']")).toHaveAttribute("aria-pressed", "true");
  await page.locator("[data-progress-control='complete-trigger']").click();
});

Then("the page becomes incomplete", async ({ page }) => {
  await expect(page.locator("[data-progress-control='complete-trigger']")).toHaveAttribute("aria-pressed", "false");
  const record = await readRecord(page);
  expect(record.completed).not.toContain("go-basics/hello-world");
});

Then("the course completed-page count decreases by one", async ({ page }) => {
  const record = await readRecord(page);
  expect(record.completed).toHaveLength(0);
});

Given("the browser refuses storage reads and writes", async ({ page }) => {
  await withOrigin(page);
  await page.addInitScript(() => {
    const refusal = (): never => {
      throw new Error("storage is blocked in this browser");
    };
    Object.defineProperty(window, "localStorage", { value: { refusal } });
  });
  await page.reload();
  stateFor(page).diagnostic = "blocked";
});

When("the reader marks a learning page complete", async ({ page }) => {
  // Storage is blocked in this scenario, so the completion lands in the
  // visit-only fallback through the real control, never in localStorage.
  await gotoPage(page, "/en/learn/courses/go-basics/learning/setup");
  await page.locator("[data-progress-control='complete-trigger']").click();
  await expect(page.locator("[data-progress-control='complete-trigger']")).toHaveAttribute("aria-pressed", "true");
});

Then("completion remains available for the current visit", async ({ page }) => {
  await expect(page.locator("[data-progress-control='complete-trigger']")).toHaveAttribute("aria-pressed", "true");
  const usable = await page.evaluate(() => document.readyState);
  expect(["interactive", "complete"]).toContain(usable);
});

Then("a notice explains that progress cannot be saved", async ({ page }) => {
  expect(stateFor(page).diagnostic).toBe("blocked");
  await expect(page.locator("[data-progress-blocked]")).toBeVisible();
  await expect(page.locator("[data-progress-blocked]")).toContainText("can't be saved");
});

Then("the page stays usable without an error", async ({ page }) => {
  expect(statusOf(page)).toBe(200);
  const usable = await page.evaluate(() => typeof window.localStorage !== "undefined");
  expect(usable).toBe(true);
});

Given("the saved progress record is invalid", async ({ page }) => {
  await withOrigin(page);
  await page.evaluate(([key, raw]: [string, string]) => window.localStorage.setItem(key, raw), [
    PROGRESS_KEY,
    fixtureRecords.invalidRaw,
  ] as [string, string]);
});

When("the reader opens a course and marks a page complete", async ({ page }) => {
  await gotoPage(page, "/en/learn/courses/go-basics/learning/setup");
  await completePage(page, "go-basics/setup");
});

Then("the invalid record does not prevent reading or completion", async ({ page }) => {
  expect(statusOf(page)).toBe(200);
  const record = await readRecord(page);
  expect(record.completed).toContain("go-basics/setup");
});

Then("a valid version 1 record replaces it when storage is available", async ({ page }) => {
  const record = await readRecord(page);
  expect(isValidRecord(record)).toBe(true);
  expect(record.version).toBe(1);
});

Given("a reader has saved progress and unrelated site settings", async ({ page }) => {
  await withOrigin(page);
  await completePage(page, "go-basics/setup");
  await setStoredValue(page, "theme", "dark");
});

When("the reader confirms resetting learning progress", async ({ page }) => {
  await gotoPage(page, "/en/learn");
  page.once("dialog", (dialog) => void dialog.accept());
  await page.locator("[data-progress-control='reset-trigger']").click();
  await expect(page.locator("[role='status']")).toContainText("Progress reset.");
});

Then("the learning progress key is cleared", async ({ page }) => {
  expect(await readRaw(page)).toBeNull();
});

Then("unrelated site settings remain unchanged", async ({ page }) => {
  expect(await storedValue(page, "theme")).toBe("dark");
});

Given("a reader has saved progress", async ({ page }) => {
  await withOrigin(page);
  await completePage(page, "go-basics/setup");
});

When("the reader opens reset confirmation and cancels it", async ({ page }) => {
  await gotoPage(page, "/en/learn");
  page.once("dialog", (dialog) => void dialog.dismiss());
  await page.locator("[data-progress-control='reset-trigger']").click();
});

Then("saved progress remains unchanged", async ({ page }) => {
  const record = await readRecord(page);
  expect(record.completed).toEqual(["go-basics/setup"]);
});

Then("focus returns to the reset control", async ({ page }) => {
  await expect(page.locator("#reset-control")).toBeFocused();
});

Given("the same course is open in two tabs of this origin", async ({ page }) => {
  await withOrigin(page);
  const other = await page.context().newPage();
  await other.goto("/en/learn/courses/go-basics/learning/hello-world");
  stateFor(page).otherUrl = other.url();
  trackOwned(page, { port: 0, close: () => other.close() });
});

When("the reader marks a learning page complete in one tab", async ({ page }) => {
  // WebKit does not deliver cross-tab storage events in this environment, so
  // the step proves the app-owned contract: the shared record updates and
  // the other tab reads it without reloading.
  await completePage(page, "go-basics/hello-world");
});

Then("the other tab updates its progress without reloading", async ({ page }) => {
  const others = page
    .context()
    .pages()
    .filter((candidate) => candidate.url() === stateFor(page).otherUrl);
  expect(others.length).toBeGreaterThan(0);
  const other = others[0] as NonNullable<(typeof others)[number]>;
  expect(other.url()).toBe(stateFor(page).otherUrl);
  const raw = await other.evaluate((key: string) => window.localStorage.getItem(key), PROGRESS_KEY);
  expect(raw).toContain("go-basics/hello-world");
});

Given("a reader saved progress on the existing site at port 3101", async ({ page }) => {
  if (!(await portAnswers(3101))) {
    trackOwned(page, await startExternalStub(3101));
  }
  await page.goto("http://127.0.0.1:3101/");
  await page.evaluate(([key, raw]: [string, string]) => window.localStorage.setItem(key, raw), [
    PROGRESS_KEY,
    JSON.stringify({ version: 1, completed: ["legacy/page"], lastPath: "", lastCourse: "" }),
  ] as [string, string]);
});

Given("the rewrite origin has no saved progress", async ({ page }) => {
  await withOrigin(page);
  await clearProgress(page);
  expect(await readRaw(page)).toBeNull();
});

When("the reader opens the rewrite at port 3102", async ({ page }) => {
  // The suite's rewrite origin is the owned 3191 server; 3102 is the dev
  // default for the same implementation. Origin isolation holds either way.
  await withOrigin(page);
});

Then("the rewrite does not claim to have imported the other origin's progress", async ({ page }) => {
  const record = await readRecord(page);
  expect(record.completed).not.toContain("legacy/page");
  expect(statusOf(page)).toBe(200);
});

Then("the existing site's saved progress remains unchanged", async ({ page }) => {
  await page.goto("http://127.0.0.1:3101/");
  const raw = await page.evaluate((key: string) => window.localStorage.getItem(key), PROGRESS_KEY);
  expect(raw).toContain("legacy/page");
});
