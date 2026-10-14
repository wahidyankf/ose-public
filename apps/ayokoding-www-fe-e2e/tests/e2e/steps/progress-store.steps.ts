import { createBdd } from "playwright-bdd";
import { expect, type Page } from "@playwright/test";
import { buildTrpcUrl, extractTrpcData } from "./backend-helpers";
import { completeCourseThroughUi } from "./support/complete-course";

const { Given, When, Then } = createBdd();

// ---------------------------------------------------------------------------
// plan ayokoding-learn-revamp-04-learning-experience, Phase 3–4 — the progress store's
// browser-only guarantee (learning-progress/progress-store.feature, S1–S5 and S9). The unit
// bindings for the same scenarios live in
// `apps/ayokoding-www/tests/unit/fe-steps/progress-store.steps.tsx`.
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

// ---------------------------------------------------------------------------
// plan ayokoding-learn-revamp-04-learning-experience, Phase 4 — S3, S5, and S9. Their path-page
// step texts ("the reader opens a path page") are bound once, in `path-roadmap.steps.ts`.
// ---------------------------------------------------------------------------

const BASH_TITLE = "Just Enough Bash";
/** The second fixture path that lists `just-enough-bash` — plan 02's skills fixture. */
const SECOND_PATH_ID = "skills/e2e-fixture-alpha";
const SECOND_PATH_LANDING = `/en/learn/paths/${SECOND_PATH_ID}`;
const SECOND_PATH_TITLE = "E2E Fixture Alpha Skills Path";
const ONE_CORE_COURSE_DONE = /^1 of \d+ core courses done$/;

interface StorePublishedManifest {
  pathId: string;
  courseOrder: string[];
  phases?: { id: string; kind: string; courses: string[] }[];
}

/** The manifests the running server publishes — the fixture truth S3 and S9 assert against. */
async function storePublishedManifests(page: Page): Promise<StorePublishedManifest[]> {
  const response = await page.request.get(buildTrpcUrl("coursePaths.getRouteData", "en"));
  await expect(response).toBeOK();
  const data = extractTrpcData(await response.json()) as { manifests?: StorePublishedManifest[] };
  return data.manifests ?? [];
}

async function storeManifest(page: Page, pathId: string): Promise<StorePublishedManifest> {
  const manifest = (await storePublishedManifests(page)).find((candidate) => candidate.pathId === pathId);
  if (manifest === undefined) {
    throw new Error(`The running server published no "${pathId}" fixture manifest.`);
  }
  return manifest;
}

/** Every core course of a path, in path order — what its roadmap headline counts. */
function storeCoreCourseIds(manifest: StorePublishedManifest): string[] {
  return (manifest.phases ?? []).filter((phase) => phase.kind === "core").flatMap((phase) => phase.courses);
}

// S3 — progress is shared by every path that contains the course.
// ---------------------------------------------------------------------------

Given("a course belongs to two paths", async ({ page }) => {
  const first = await storeManifest(page, PATH_ID);
  const second = await storeManifest(page, SECOND_PATH_ID);

  expect(first.courseOrder).toContain(BASH_ID);
  expect(second.courseOrder).toContain(BASH_ID);
});

Given("the reader completed every learning page of that course while following the first path", async ({ page }) => {
  await completeCourseThroughUi(page, BASH_ID, PATH_ID);
  // Every page of the course, walked through the UI: only then does the course read as done.
  expect(await completedPagePaths(page, BASH_ID)).not.toEqual([]);
});

When("the reader opens the second path's page", async ({ page }) => {
  await page.goto(SECOND_PATH_LANDING);
  await page.waitForLoadState("networkidle");
});

Then('that course\'s card shows "Done"', async ({ page }) => {
  // The record carries no path, so the course's card in the *other* path shows the same completion.
  const nav = page.getByRole("navigation", { name: `${SECOND_PATH_TITLE} syllabus` });
  const row = nav.locator("ol > li", { hasText: BASH_TITLE });

  await expect(row).toHaveCount(1);
  await expect(row.getByText("Done", { exact: true })).toBeVisible();
});

// ---------------------------------------------------------------------------
// S5 — unreadable saved progress is ignored and replaced. The When ("the reader opens a path
// page") and its Then ("every course card shows \"Not started\"") are bound in
// `path-roadmap.steps.ts`, where the When opens the backend-track fixture.
// ---------------------------------------------------------------------------

Given("the saved progress record cannot be read as valid progress", async ({ page }) => {
  // Seeding bad data (tech-docs/006, S5): the key holds something no reader could have written.
  // Registered before the reader's first navigation, so the very first read is the unreadable one.
  await page.addInitScript((key) => window.localStorage.setItem(key, "not json"), PROGRESS_KEY);
});

Then("marking a learning page as complete saves a valid progress record", async ({ page }) => {
  await openLessonPage(page);
  await markPageComplete(page);

  const raw = await storedRecord(page);
  expect(raw).not.toBeNull();
  expect(raw).not.toBe("not json");

  // The malformed record was replaced by one the store's own schema accepts.
  const parsed = JSON.parse(raw as string) as { completed?: Record<string, string[]> };
  expect(parsed.completed?.[BASH_ID]).toEqual([LESSON_PAGE]);
});

// ---------------------------------------------------------------------------
// S9 — progress updates in another open tab.
// ---------------------------------------------------------------------------

/** The two tabs the scenario keeps open, and how many times either of them navigated after that. */
let secondTab: Page | null = null;
let openTabNavigations = 0;

Given("the same path page is open in two tabs", async ({ page, context }) => {
  const manifest = await storeManifest(page, PATH_ID);
  const coreTotal = storeCoreCourseIds(manifest).length;
  expect(coreTotal).toBe(3);

  await page.goto(`/en/learn/paths/${PATH_ID}`);
  await page.waitForLoadState("networkidle");
  await expect(page.getByText(`0 of ${coreTotal} core courses done`, { exact: true })).toBeVisible();

  secondTab = await context.newPage();
  await secondTab.goto(`/en/learn/paths/${PATH_ID}`);
  await secondTab.waitForLoadState("networkidle");
  await expect(secondTab.getByText(`0 of ${coreTotal} core courses done`, { exact: true })).toBeVisible();

  // From here on neither open tab may navigate: the scenario's whole point is that the new count
  // arrives without a reload.
  openTabNavigations = 0;
  for (const tab of [page, secondTab]) {
    tab.on("framenavigated", () => {
      openTabNavigations += 1;
    });
  }
});

When("the reader marks a learning page as complete in a third tab", async ({ context }) => {
  // A third tab of the same browser shares the context's storage; finishing a whole course is what
  // moves a path page's own count.
  const thirdTab = await context.newPage();
  await completeCourseThroughUi(thirdTab, BASH_ID, PATH_ID);
  await thirdTab.close();
});

Then("both open tabs show the new count without a reload", async ({ page }) => {
  expect(secondTab).not.toBeNull();
  const openTabs = [page, secondTab as Page];
  expect(openTabNavigations).toBe(0);

  for (const tab of openTabs) {
    // The count moved in every tab that was already open — no reload, no re-entry into the path.
    await expect(tab.getByText(ONE_CORE_COURSE_DONE).first()).toBeVisible();
  }
  // Neither open tab navigated once after the third tab started marking: the new count arrived
  // through the store's own change notification.
  expect(openTabNavigations).toBe(0);

  await (secondTab as Page).close();
  secondTab = null;
});

// ---------------------------------------------------------------------------
// plan ayokoding-learn-revamp-04-learning-experience, Phase 6 — S6 and S7: the Learn home's
// guarded reset, which is where those two scenarios live (they replace nothing; the path-page
// scenarios above are unchanged).
// ---------------------------------------------------------------------------

/** A path card's own progress count on the Learn home, in words. */
const CORE_COURSE_DONE = /^\d+ of \d+ core courses done$/;

/** The record the browser held before a reset attempt, so "unchanged" can be asserted exactly. */
let progressBeforeReset: string | null = null;

async function openLearnHome(page: Page): Promise<void> {
  await page.goto("/en/learn");
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("button", { name: /^Reset progress/ })).toBeVisible();
}

Given("a reader has saved progress", async ({ page }) => {
  // Start from a clean record, then save progress through the lesson page's own completion
  // control — the same action S1 performs — so the Learn home's counts have something to clear.
  await page.goto("/en/learn");
  await page.evaluate((key) => window.localStorage.removeItem(key), PROGRESS_KEY);
  expect(await storedRecord(page)).toBeNull();

  await completeCourseThroughUi(page, BASH_ID, PATH_ID);
  expect(await completedPagePaths(page, BASH_ID)).not.toEqual([]);
  progressBeforeReset = await storedRecord(page);
});

When("the reader chooses {string} on the Learn home and confirms", async ({ page }, controlName: string) => {
  await openLearnHome(page);
  await expect(page.getByText(ONE_CORE_COURSE_DONE).first()).toBeVisible();

  await page.getByRole("button", { name: new RegExp(`^${controlName}`) }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: controlName, exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

Then("every progress count on the Learn home shows nothing done", async ({ page }) => {
  const counts = await page.getByText(CORE_COURSE_DONE).allTextContents();
  expect(counts.length, "every path card carries a count").toBeGreaterThan(0);
  expect(counts.every((text) => text.startsWith("0 of "))).toBe(true);
});

Then("no saved progress record remains in this browser", async ({ page }) => {
  expect(await storedRecord(page)).toBeNull();
});

When("the reader chooses {string} on the Learn home and cancels", async ({ page }, controlName: string) => {
  await openLearnHome(page);
  await expect(page.getByText(ONE_CORE_COURSE_DONE).first()).toBeVisible();

  await page.getByRole("button", { name: new RegExp(`^${controlName}`) }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

Then("the saved progress is unchanged", async ({ page }) => {
  expect(progressBeforeReset).not.toBeNull();
  // Compare the recorded completion — the part this scenario is about. The record also carries
  // best-effort visit metadata (lastCourse/lastPath) that a page visit may legitimately refresh
  // between the capture and this assertion.
  const completedOf = (raw: string | null) =>
    raw === null ? null : (JSON.parse(raw) as { completed: unknown }).completed;
  expect(completedOf(await storedRecord(page))).toEqual(completedOf(progressBeforeReset));
  await expect(page.getByText(ONE_CORE_COURSE_DONE).first()).toBeVisible();
});

Then("focus returns to the {string} button", async ({ page }, controlName: string) => {
  await expect(page.getByRole("button", { name: new RegExp(`^${controlName}`) })).toBeFocused();
});
