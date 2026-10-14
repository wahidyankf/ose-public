import { createBdd } from "playwright-bdd";
import { expect, type Page } from "@playwright/test";

const { Given, When, Then } = createBdd();

// ---------------------------------------------------------------------------
// plan ayokoding-learn-revamp-04-learning-experience, Phase 3 — the progress store's browser-only
// guarantee (learning-progress/progress-store.feature, S1, S2, S4). The unit bindings for the same
// scenarios live in `apps/ayokoding-www/tests/unit/fe-steps/progress-store.steps.tsx`.
//
// The lesson page is `just-enough-bash/learning/beginner` — page 2 of that course's six-page
// lesson sequence — opened in the `careers/immediately-effective/backend-track` fixture path, so
// the context bar shows both "Page 2 of P" and the course's pages-done count.
// ---------------------------------------------------------------------------

const PATH_ID = "careers/immediately-effective/backend-track";
const BASH_ID = "just-enough-bash";
const BASH_ROOT = `/en/learn/courses/${BASH_ID}`;
const LESSON_PAGE = "learning/beginner";
const LESSON_URL = `${BASH_ROOT}/${LESSON_PAGE}?path=${PATH_ID}`;

/**
 * The one key the record lives under — `PROGRESS_STORAGE_KEY` in
 * `learning-progress/core/progress-schema.ts`. The e2e project has no module boundary with the
 * app, so it is mirrored here.
 */
const PROGRESS_KEY = "ayokoding-learn-progress-v1";
/** The key's prefix: no request may carry the record or even name it (tech-docs/006, S1). */
const PROGRESS_KEY_PREFIX = "ayokoding-learn-progress";

const ONE_PAGE_DONE = /\b1 of \d+ pages done\b/;
const ZERO_PAGES_DONE = /\b0 of \d+ pages done\b/;
const MARK_AS_COMPLETE = /^Mark as complete$/;
const COMPLETED = /^Completed/;

function contextBar(page: Page) {
  return page.getByRole("navigation", { name: "Lesson location" });
}

/** The completion toggle, the lesson action row's only button (`aria-pressed` carries its state). */
function completionToggle(page: Page) {
  return page.getByRole("navigation", { name: "Page navigation" }).getByRole("button");
}

async function openLessonPage(page: Page): Promise<void> {
  await page.goto(LESSON_URL);
  await page.waitForLoadState("networkidle");
  await expect(contextBar(page)).toBeVisible();
}

async function markPageComplete(page: Page): Promise<void> {
  const toggle = completionToggle(page);
  await expect(toggle).toBeEnabled();
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
}

async function storedRecord(page: Page): Promise<string | null> {
  return page.evaluate((key) => window.localStorage.getItem(key), PROGRESS_KEY);
}

/** What the browser's record holds for `courseId` — empty for a reader who has marked nothing. */
async function completedPagePaths(page: Page, courseId: string): Promise<string[]> {
  const raw = await storedRecord(page);
  if (raw === null) {
    return [];
  }
  const parsed = JSON.parse(raw) as { completed?: Record<string, string[]> };
  return parsed.completed?.[courseId] ?? [];
}

interface RecordedRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  postData: string | null;
}

/** Every request seen from just before a completion click until the page shows the completed state. */
let markingRequests: RecordedRequest[] = [];

/** The record the browser held when that click landed — what no request may carry. */
let markedRecord: string | null = null;

/**
 * The no-network technique (tech-docs/006, S1): snapshot each request as it is issued, because a
 * Playwright `Request`'s headers and body are only reliably readable while it is in flight.
 */
function startRecordingRequests(page: Page): void {
  markingRequests = [];
  markedRecord = null;
  page.on("request", (request) => {
    markingRequests.push({
      method: request.method(),
      url: request.url(),
      headers: request.headers(),
      postData: request.postData(),
    });
  });
}

/** True when this request, anywhere in it, carries `needle`. */
function carries(request: RecordedRequest, needle: string): boolean {
  return (
    request.url.includes(needle) ||
    Object.values(request.headers).some((value) => value.includes(needle)) ||
    (request.postData ?? "").includes(needle)
  );
}

// ---------------------------------------------------------------------------
// S1 (Given) — shared with lesson-navigation's S18, so it is defined exactly once.
// ---------------------------------------------------------------------------

Given("a reader has no saved progress", async ({ page }) => {
  // A fresh Playwright context starts with no storage, and this makes that the scenario's real
  // starting point. An app page has to be open first: `localStorage` is unreachable from
  // `about:blank`, so the key is read and cleared on the origin under test.
  await page.goto("/en/learn");
  await page.evaluate((key) => window.localStorage.removeItem(key), PROGRESS_KEY);
  expect(await storedRecord(page)).toBeNull();
});

// ---------------------------------------------------------------------------
// S1 — marking a page complete is saved in this browser only.
// ---------------------------------------------------------------------------

When("the reader marks a learning page as complete", async ({ page }) => {
  await openLessonPage(page);
  // The log runs from just before the click until the toggle reports the completed state; the
  // record the browser then holds is the one no request may carry.
  startRecordingRequests(page);
  await markPageComplete(page);
  markedRecord = await storedRecord(page);
});

// The feature's `And the reader reloads the page` binds to the step `resizable-sidebar.steps.ts`
// already defines (`page.reload()`), which is exactly the semantics this scenario needs: the store
// re-reads the same key from scratch.

Then("the page is still shown as completed", async ({ page }) => {
  await expect(completionToggle(page)).toHaveAttribute("aria-pressed", "true");
  await expect(completionToggle(page)).toHaveText(COMPLETED);
  expect(await completedPagePaths(page, BASH_ID)).toEqual([LESSON_PAGE]);
});

Then("no network request sent while marking carries the progress data", ({ page }) => {
  // Every request the app's own origin receives while marking is a GET, and no request to any
  // origin — the app's own or a third-party beacon — names the key or carries the serialized
  // record, anywhere: URL, header, or body.
  expect(markedRecord).not.toBeNull();
  const record = markedRecord ?? "";
  expect(record.length).toBeGreaterThan(0);
  const appOrigin = new URL(page.url()).origin;
  const leaked = markingRequests.filter(
    (request) =>
      (request.url.startsWith(appOrigin) && request.method !== "GET") ||
      carries(request, PROGRESS_KEY_PREFIX) ||
      carries(request, record),
  );
  expect(leaked).toEqual([]);
});

// ---------------------------------------------------------------------------
// S2 — a completed page can be un-checked.
// ---------------------------------------------------------------------------

Given("a reader has marked a learning page as complete", async ({ page }) => {
  await openLessonPage(page);
  await markPageComplete(page);
  await expect(contextBar(page)).toContainText(ONE_PAGE_DONE);
});

When("the reader activates the completed control again", async ({ page }) => {
  await completionToggle(page).click();
});

Then("the page is shown as not completed", async ({ page }) => {
  await expect(completionToggle(page)).toHaveAttribute("aria-pressed", "false");
  await expect(completionToggle(page)).toHaveText(MARK_AS_COMPLETE);
});

Then("the course's pages-done count goes down by one", async ({ page }) => {
  await expect(contextBar(page)).toContainText(ZERO_PAGES_DONE);
  expect(await completedPagePaths(page, BASH_ID)).toEqual([]);
});

// ---------------------------------------------------------------------------
// S4 — the site still works when browser storage is blocked.
// ---------------------------------------------------------------------------

Given("the browser refuses to read or write site storage", async ({ page }) => {
  // The blocked-storage technique (tech-docs/006): every `Storage` method the store's guard rails
  // can reach throws, exactly as a browser with site storage switched off does. Registered before
  // the reader's first navigation, so even the very first read of the record is the blocked one.
  await page.addInitScript(() => {
    const blocked = (): never => {
      throw new DOMException("blocked", "SecurityError");
    };
    Storage.prototype.getItem = blocked;
    Storage.prototype.setItem = blocked;
    Storage.prototype.removeItem = blocked;
  });
});

When("the reader opens a learning page and marks it as complete", async ({ page }) => {
  await openLessonPage(page);
  await markPageComplete(page);
});

Then("the page is shown as completed for the rest of the visit", async ({ page }) => {
  // The store falls back to memory for the life of the tab, so the UI keeps working.
  await expect(completionToggle(page)).toHaveAttribute("aria-pressed", "true");
  await expect(contextBar(page)).toContainText(ONE_PAGE_DONE);
});

Then("a notice says progress cannot be saved in this browser", async ({ page }) => {
  await expect(page.getByText(/can.t be saved in this browser/)).toBeVisible();
});

Then("the page shows no error", async ({ page }) => {
  // Content callouts render through web-ui's `Alert` (a legitimate `role="alert"` live region), so
  // the check is that no alert reports an error, not that no alert exists.
  const alertTexts = await page.getByRole("alert").allTextContents();
  expect(alertTexts.filter((text) => /error|exception/i.test(text))).toEqual([]);
  await expect(page.locator("body")).not.toContainText(/Application error|client-side exception/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
