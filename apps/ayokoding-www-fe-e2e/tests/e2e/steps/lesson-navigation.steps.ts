import { createBdd } from "playwright-bdd";
import { expect, type Page } from "@playwright/test";
import { buildTrpcUrl, extractTrpcData } from "./backend-helpers";

const { Given, When, Then } = createBdd();

// ---------------------------------------------------------------------------
// plan ayokoding-learn-revamp-04-learning-experience, Phase 3 — lesson navigation
// (learning-progress/lesson-navigation.feature, S10–S18). The unit bindings for the same scenarios
// live in `apps/ayokoding-www/tests/unit/fe-steps/lesson-navigation.steps.tsx`.
//
// Every scenario runs against the `careers/immediately-effective/backend-track` fixture manifest
// (tech-docs/006), so `just-enough-bash` is course 1 of 3 (→ backend-essentials → sql-essentials)
// in one core phase, "Fixture core". The lesson pages are the real English content pages, and a
// course's lesson sequence is its pages in `weight` order. For `just-enough-bash` and
// `sql-essentials` (identical shapes, course weights 105/205 and 110/210):
//
//   1. learning/overview        2. learning/beginner       3. learning/intermediate
//   4. learning/advanced        5. learning/capstone/overview
//   6. drilling/overview        (last: "Mark complete & continue" leaves the course here)
//
// `Page p of P` assertions pin the page's own position but read the total by shape (`\d+`), so
// adding or renaming pages cannot silently change which page the bar is reporting.
// ---------------------------------------------------------------------------

const PATH_ID = "careers/immediately-effective/backend-track";
const PATH_TITLE = "Backend Track (Immediately-Effective)";
const PATH_LANDING = `/en/learn/paths/${PATH_ID}`;
const PHASE_LINK = "Phase 1 · Fixture core";

const BASH_ID = "just-enough-bash";
const BASH_ROOT = `/en/learn/courses/${BASH_ID}`;
const BASH_TITLE = "Just Enough Bash";
const BASH_FIRST_PAGE = "learning/overview";
const BASH_SECOND_PAGE = "learning/beginner";
const BASH_SECOND_TITLE = "Beginner Examples";
const BASH_NEXT_PAGE = "learning/intermediate";
const BASH_LAST_PAGE = "drilling/overview";

const SQL_ID = "sql-essentials";
const SQL_LAST_PAGE = "drilling/overview";

const BACKEND_ID = "backend-essentials";

/**
 * The store's key, mirrored from `learning-progress/core/progress-schema.ts`: the e2e project has
 * no module boundary with the app.
 */
const PROGRESS_KEY = "ayokoding-learn-progress-v1";

const COURSE_HEADER = 'header[aria-label="Course summary"]';
const MARK_COMPLETE_CONTINUE = /^Mark complete & continue/;
/** `learning/beginner` is the second page of both fixture courses' six-page sequences. */
const SECOND_PAGE_OF_TOTAL = /Page 2 of \d+/;
const ZERO_PAGES_DONE = /0 of \d+ pages done/;
const ONE_PAGE_DONE = /1 of \d+ pages done/;

/** The lesson context bar's landmark (`contextBarLabel`) — plan 04's `ContextBar`. */
function contextBar(page: Page) {
  return page.getByRole("navigation", { name: "Lesson location" });
}

/** The lesson action row's landmark — plan 03's `Page navigation`, reused by `LessonNav` (U4). */
function actionRow(page: Page) {
  return page.getByRole("navigation", { name: "Page navigation" });
}

/** "Mark complete & continue": the primary action, whichever stop it currently points at. */
function primaryAction(page: Page) {
  return actionRow(page).getByRole("link", { name: MARK_COMPLETE_CONTINUE });
}

/** The completion toggle, the action row's only button (`aria-pressed` carries its state). */
function completionToggle(page: Page) {
  return actionRow(page).getByRole("button");
}

function contextLink(page: Page, name: string) {
  return contextBar(page).getByRole("link", { name, exact: true });
}

/**
 * Open a lesson page of a course, in the backend-track path context by default (pass
 * `pathId: null` for the canonical, path-less view).
 */
async function openLessonPage(
  page: Page,
  pagePath: string,
  options: { courseId?: string; pathId?: string | null } = {},
): Promise<void> {
  const courseId = options.courseId ?? BASH_ID;
  const query = options.pathId === null ? "" : `?path=${options.pathId ?? PATH_ID}`;
  await page.goto(`/en/learn/courses/${courseId}/${pagePath}${query}`);
  await page.waitForLoadState("networkidle");
  await expect(contextBar(page)).toBeVisible();
}

/** Activate the primary action and wait for the page it opens (the URL is all it changes). */
async function activatePrimary(page: Page): Promise<void> {
  const from = currentLocation(page);
  await primaryAction(page).click();
  await page.waitForURL((url) => `${url.pathname}${url.search}` !== from);
  await page.waitForLoadState("networkidle");
}

function currentLocation(page: Page): string {
  const url = new URL(page.url());
  return `${url.pathname}${url.search}`;
}

/**
 * A full-URL matcher for a path-and-query pair, in the escaping style the locale-redirect steps use,
 * so an assertion about which page opened covers the query string it must (or must not) carry.
 */
function urlEndingWith(location: string): RegExp {
  return new RegExp(`${location.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`);
}

/**
 * The path's course order as the running server publishes it — the fixture truth the backend-track
 * scenarios assert against, queried exactly as `course-paths.steps.ts` does.
 */
async function backendTrackCourseOrder(page: Page): Promise<string[]> {
  const response = await page.request.get(buildTrpcUrl("coursePaths.getRouteData", "en"));
  await expect(response).toBeOK();
  const data = extractTrpcData(await response.json()) as {
    manifests?: { pathId: string; courseOrder: string[] }[];
  };
  const manifest = data.manifests?.find((candidate) => candidate.pathId === PATH_ID);
  if (manifest === undefined) {
    throw new Error(`The running server published no "${PATH_ID}" fixture manifest.`);
  }
  return manifest.courseOrder;
}

/** What the browser's progress record holds for `courseId` — the store's own key, read in the page. */
async function completedPagePaths(page: Page, courseId: string): Promise<string[]> {
  const raw = await page.evaluate((key) => window.localStorage.getItem(key), PROGRESS_KEY);
  if (raw === null) {
    return [];
  }
  const parsed = JSON.parse(raw) as { completed?: Record<string, string[]> };
  return parsed.completed?.[courseId] ?? [];
}

// ---------------------------------------------------------------------------
// S10 — the context bar in path context.
// ---------------------------------------------------------------------------

When("a reader opens a learning page of a course in path context", async ({ page }) => {
  await openLessonPage(page, BASH_SECOND_PAGE);
});

Then("the context bar links to the path page", async ({ page }) => {
  await expect(contextLink(page, PATH_TITLE)).toHaveAttribute("href", PATH_LANDING);
});

Then("it names the phase that contains the course", async ({ page }) => {
  // The phase crumb is the fixture phase's own id anchor on the roadmap, not a bare label.
  await expect(contextLink(page, PHASE_LINK)).toHaveAttribute("href", `${PATH_LANDING}#phase-fixture-core`);
});

Then('it shows "Course k of N" for the course\'s position in the path', async ({ page }) => {
  await expect(contextLink(page, "Course 1 of 3")).toHaveAttribute("href", `${BASH_ROOT}?path=${PATH_ID}`);
});

Then('it shows "Page p of P" and how many pages of the course are done', async ({ page }) => {
  await expect(contextBar(page)).toContainText(SECOND_PAGE_OF_TOTAL);
  // A reader who has never marked a page: the count is present and honest from the first render.
  await expect(contextBar(page)).toContainText(ZERO_PAGES_DONE);
});

// ---------------------------------------------------------------------------
// S11 — the context bar without a path.
// ---------------------------------------------------------------------------

When("a reader opens a learning page with no path context and no remembered path for that course", async ({ page }) => {
  // A fresh browser context has nothing remembered; the URL carries no `?path=` either.
  await openLessonPage(page, BASH_SECOND_PAGE, { pathId: null });
});

Then('the context bar shows the course title, "Page p of P", and how many pages are done', async ({ page }) => {
  await expect(contextLink(page, BASH_TITLE)).toHaveAttribute("href", BASH_ROOT);
  await expect(contextBar(page)).toContainText(SECOND_PAGE_OF_TOTAL);
  await expect(contextBar(page)).toContainText(ZERO_PAGES_DONE);
});

Then("it shows no path or phase link", async ({ page }) => {
  // The course's own landing link is the bar's only link in canonical mode.
  await expect(contextBar(page).getByRole("link")).toHaveCount(1);
  await expect(contextBar(page)).not.toContainText(PATH_TITLE);
  await expect(contextBar(page)).not.toContainText("Phase");
});

// ---------------------------------------------------------------------------
// S12–S15 — "Mark complete & continue" walks the sequence, then leaves the course. The When is one
// shared step: each scenario's Given stages the page and proves the situation it claims.
// ---------------------------------------------------------------------------

When('the reader activates "Mark complete & continue"', async ({ page }) => {
  await activatePrimary(page);
});

// S12.
Given("a reader is on a learning page that is not the course's last page", async ({ page }) => {
  await openLessonPage(page, BASH_SECOND_PAGE);
  // The second line names the stop: a page of this course means this is not the last one.
  await expect(primaryAction(page)).toContainText(/Next: /);
});

Then("the next learning page of the course opens", async ({ page }) => {
  await expect(page).toHaveURL(urlEndingWith(`${BASH_ROOT}/${BASH_NEXT_PAGE}?path=${PATH_ID}`));
  // Exactly one page forward: the page now open names the page just left as its previous page.
  await expect(
    actionRow(page).getByRole("link", { name: `Previous: ${BASH_SECOND_TITLE}`, exact: true }),
  ).toHaveAttribute("href", `${BASH_ROOT}/${BASH_SECOND_PAGE}?path=${PATH_ID}`);
});

Then("the previous page is counted as done", async ({ page }) => {
  await expect(contextBar(page)).toContainText(ONE_PAGE_DONE);
  expect(await completedPagePaths(page, BASH_ID)).toEqual([BASH_SECOND_PAGE]);
});

// S13.
Given("a reader is on the last learning page of a course in path context", async ({ page }) => {
  await openLessonPage(page, BASH_LAST_PAGE);
  await expect(primaryAction(page)).toContainText("Next course: ");
});

Given("the path has a course after it", async ({ page }) => {
  const order = await backendTrackCourseOrder(page);
  expect(order.indexOf(BASH_ID)).toBeGreaterThanOrEqual(0);
  expect(order[order.indexOf(BASH_ID) + 1]).toBe(BACKEND_ID);
});

Then("the next course's landing page opens in the same path context", async ({ page }) => {
  await expect(page).toHaveURL(urlEndingWith(`/en/learn/courses/${BACKEND_ID}?path=${PATH_ID}`));
  await expect(page.locator(COURSE_HEADER)).toBeVisible();
});

// S14.
Given("a reader is on the last learning page of the path's last course in path context", async ({ page }) => {
  await openLessonPage(page, SQL_LAST_PAGE, { courseId: SQL_ID });
  await expect(contextLink(page, "Course 3 of 3")).toHaveAttribute(
    "href",
    `/en/learn/courses/${SQL_ID}?path=${PATH_ID}`,
  );
  await expect(primaryAction(page)).toContainText("Back to the path");
});

Then("the path page opens", async ({ page }) => {
  // The path page is the path itself: no `?path=` is carried to it.
  await expect(page).toHaveURL(urlEndingWith(PATH_LANDING));
  await expect(page.getByRole("heading", { level: 1, name: PATH_TITLE })).toBeVisible();
});

// S15.
Given("a reader is on a course's last learning page with no path context", async ({ page }) => {
  await openLessonPage(page, BASH_LAST_PAGE, { pathId: null });
  await expect(contextLink(page, BASH_TITLE)).toHaveAttribute("href", BASH_ROOT);
  await expect(primaryAction(page)).toContainText("Back to the course");
});

Then("the course landing page opens", async ({ page }) => {
  await expect(page).toHaveURL(urlEndingWith(BASH_ROOT));
  await expect(page.locator(COURSE_HEADER)).toBeVisible();
});

// ---------------------------------------------------------------------------
// S16 — "Previous" walks back the same way.
// ---------------------------------------------------------------------------

Given("a reader is on the first learning page of a course", async ({ page }) => {
  await openLessonPage(page, BASH_FIRST_PAGE);
});

Then('"Previous" links to the course landing page', async ({ page }) => {
  await expect(actionRow(page).getByRole("link", { name: `Previous: ${BASH_TITLE}`, exact: true })).toHaveAttribute(
    "href",
    `${BASH_ROOT}?path=${PATH_ID}`,
  );
});

When("the reader opens the second learning page", async ({ page }) => {
  await openLessonPage(page, BASH_SECOND_PAGE);
});

Then('"Previous" links to the first learning page', async ({ page }) => {
  await expect(actionRow(page).getByRole("link", { name: "Previous: Overview", exact: true })).toHaveAttribute(
    "href",
    `${BASH_ROOT}/${BASH_FIRST_PAGE}?path=${PATH_ID}`,
  );
});

// ---------------------------------------------------------------------------
// S17 — the path context is remembered inside the same course. The link followed here is the
// sidebar content tree's own, which never carries `?path=`: only the store's remembered path can
// keep the context, so a URL that carries none is part of the assertion.
// ---------------------------------------------------------------------------

Given("a reader opened a course's learning page in path context", async ({ page }) => {
  await openLessonPage(page, BASH_FIRST_PAGE);
  await expect(contextLink(page, PATH_TITLE)).toHaveAttribute("href", PATH_LANDING);
});

When("the reader opens another learning page of the same course from a link without path context", async ({ page }) => {
  const sidebarLink = page
    .getByRole("navigation", { name: "Sidebar navigation" })
    .getByRole("link", { name: BASH_SECOND_TITLE, exact: true });
  await expect(sidebarLink).toHaveAttribute("href", `${BASH_ROOT}/${BASH_SECOND_PAGE}`);
  await sidebarLink.click();
  await page.waitForURL((url) => url.pathname === `${BASH_ROOT}/${BASH_SECOND_PAGE}`);
  await page.waitForLoadState("networkidle");
});

Then("the context bar still shows the same path and phase", async ({ page }) => {
  expect(new URL(page.url()).searchParams.has("path")).toBe(false);
  await expect(contextLink(page, PATH_TITLE)).toHaveAttribute("href", PATH_LANDING);
  await expect(contextLink(page, PHASE_LINK)).toHaveAttribute("href", `${PATH_LANDING}#phase-fixture-core`);
});

Then("the navigation links keep the path context", async ({ page }) => {
  const links = actionRow(page).getByRole("link");
  const count = await links.count();
  expect(count).toBeGreaterThan(0);
  for (let index = 0; index < count; index += 1) {
    await expect(links.nth(index)).toHaveAttribute("href", new RegExp(`\\?path=${PATH_ID}$`));
  }
});

// ---------------------------------------------------------------------------
// S18 — opening or scrolling a page never marks it complete. The Given ("a reader has no saved
// progress") is defined once, in `progress-store.steps.ts`, and shared with S1.
// ---------------------------------------------------------------------------

When("the reader opens a learning page and scrolls to its end", async ({ page }) => {
  await openLessonPage(page, BASH_SECOND_PAGE);
  const scrollable = await page.evaluate(() => {
    window.scrollTo(0, document.documentElement.scrollHeight);
    return document.documentElement.scrollHeight > window.innerHeight;
  });
  expect(scrollable).toBe(true);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
});

Then("the page is not counted as done", async ({ page }) => {
  // Opening a lesson page records the visit (which course and path the reader reached), so the
  // record may exist; what must never appear is a completion entry for the page.
  expect(await completedPagePaths(page, BASH_ID)).toEqual([]);
  await expect(contextBar(page)).toContainText(ZERO_PAGES_DONE);
  await expect(completionToggle(page)).toHaveAttribute("aria-pressed", "false");
});
