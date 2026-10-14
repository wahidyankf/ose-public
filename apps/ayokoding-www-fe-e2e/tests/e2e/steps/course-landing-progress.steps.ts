import { createBdd } from "playwright-bdd";
import { expect, type Page } from "@playwright/test";
import { completeCourseThroughUi } from "./support/complete-course";

const { Given, When, Then } = createBdd();

// ---------------------------------------------------------------------------
// plan ayokoding-learn-revamp-04-learning-experience, Phase 5 — the course landing header
// (learning-progress/course-landing-progress.feature, S33–S34). The unit bindings for the same
// scenarios live in `apps/ayokoding-www/tests/unit/fe-steps/course-landing-progress.steps.tsx`.
//
// Every scenario runs against `/en/learn/courses/just-enough-bash`, the same real course the
// lesson-navigation and path-roadmap scenarios use, so the header's progress and its lesson pages
// describe one course. The page count is read by shape (`\d+`), never pinned: plans 06–13 may add
// or rename pages, and the header must keep reporting whatever the course holds.
// ---------------------------------------------------------------------------

const COURSE_ID = "just-enough-bash";
const COURSE_ROOT = `/en/learn/courses/${COURSE_ID}`;
const PATH_ID = "careers/immediately-effective/backend-track";

/** The course landing header (`courseHeaderLabel`) the progress slot and primary action live in. */
const COURSE_HEADER = 'header[aria-label="Course summary"]';

/** The lesson action row's primary link, whichever stop it currently points at. */
const MARK_COMPLETE_CONTINUE = /^(Mark complete & continue|Continue)/;

/** The lesson context bar's landmark (`contextBarLabel`) — its "Page p of P" line is the proof. */
function lessonBar(page: Page) {
  return page.getByRole("navigation", { name: "Lesson location" });
}

/** The lesson action row's landmark — the completion toggle is its only button. */
function actionRow(page: Page) {
  return page.getByRole("navigation", { name: "Page navigation" });
}

function courseHeader(page: Page) {
  return page.locator(COURSE_HEADER);
}

/** The shared "When": the course landing page, freshly loaded, with its header in place. */
async function openCourseLanding(page: Page): Promise<void> {
  await page.goto(COURSE_ROOT);
  await page.waitForLoadState("networkidle");
  await expect(courseHeader(page)).toBeVisible();
}

/**
 * Take the header's own primary action to the course's first sequence page. Both the plan-03
 * "Start course" fallback and plan 05's own action point there for a course with nothing done, and
 * both are links into a page of *this* course — prerequisite and "part of" links point at course
 * roots, so they never match the prefix.
 */
async function openFirstPageFromHeader(page: Page): Promise<void> {
  await courseHeader(page).locator(`a[href^="${COURSE_ROOT}/"], button`).first().click();
  await page.waitForURL((url) => url.pathname.startsWith(`${COURSE_ROOT}/`));
  await page.waitForLoadState("networkidle");
}

/**
 * Mark the page now open complete through the lesson action row's toggle, and prove both the
 * toggle's state and the reader's count. The toggle is disabled until the hydrated store is ready,
 * so waiting for it to be enabled is what keeps the click from landing before its listener exists
 * (the retry is the same click-and-verify pair the roadmap steps use).
 */
async function markCurrentPageComplete(page: Page, done: number): Promise<void> {
  const toggle = actionRow(page).getByRole("button");
  await expect(toggle).toBeEnabled();
  await expect(async () => {
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "true", { timeout: 2000 });
  }).toPass({ timeout: 15000 });

  await expect(lessonBar(page)).toContainText(new RegExp(`${done} of \\d+ pages done`));
}

/** Follow "Mark complete & continue" to the next page of the course, and prove where it landed. */
async function openNextPage(page: Page, position: number): Promise<void> {
  await actionRow(page).getByRole("link", { name: MARK_COMPLETE_CONTINUE }).click();
  await page.waitForLoadState("networkidle");
  await expect(lessonBar(page)).toContainText(new RegExp(`Page ${position} of \\d+`));
}

// ---------------------------------------------------------------------------
// S33 — a started course shows its progress and a Continue button.
// ---------------------------------------------------------------------------

Given("a reader completed the first two learning pages of a course", async ({ page }) => {
  await openCourseLanding(page);
  await openFirstPageFromHeader(page);

  // Page 1: mark it, then follow the primary action to page 2 — the second page S33's count is
  // about, and the page the "third page" target will follow.
  await markCurrentPageComplete(page, 1);
  await openNextPage(page, 2);

  // Page 2: mark it too. The reader is two pages in and standing where S33 finds them.
  await markCurrentPageComplete(page, 2);
});

When("the reader opens the course landing page", async ({ page }) => {
  await openCourseLanding(page);
});

Then('the header shows "In progress" and "2 of P pages done"', async ({ page }) => {
  await expect(courseHeader(page)).toContainText("In progress");
  await expect(courseHeader(page)).toContainText(/2 of \d+ pages done/);
});

Then(
  `the main button reads "Continue course:" followed by the third page's title and links to it`,
  async ({ page }) => {
    const button = courseHeader(page).getByRole("link", { name: /^Continue course:/ });
    await expect(button).toBeVisible();

    const label = (await button.innerText()).trim();
    const title = label.replace(/^Continue course:\s*/u, "");
    expect(title.length).toBeGreaterThan(0);

    // Following it resumes at the third page: one page behind the reader is the second, so the page
    // it opens is that one — and it is titled exactly as the button says.
    await button.click();
    await page.waitForLoadState("networkidle");
    await expect(lessonBar(page)).toContainText(/Page 3 of \d+/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(title);
  },
);

// ---------------------------------------------------------------------------
// S34 — a finished course offers a review.
// ---------------------------------------------------------------------------

Given("a reader completed every learning page of a course", async ({ page }) => {
  // The shared UI walk (tech-docs/006): it opens the course landing page in path context and marks
  // every page of the course through the lesson action row, so the reader really is finished.
  await completeCourseThroughUi(page, COURSE_ID, PATH_ID);
});

Then('the header shows "Done" and "P of P pages done"', async ({ page }) => {
  await expect(courseHeader(page)).toContainText("Done");
  await expect(courseHeader(page)).toContainText(/(\d+) of \1 pages done/u);
});

Then('the main button reads "Review course" and links to the first learning page', async ({ page }) => {
  const button = courseHeader(page).getByRole("link", { name: "Review course", exact: true });
  await expect(button).toBeVisible();
  await expect(button).toHaveAttribute("href", new RegExp(`^${COURSE_ROOT}/[^?]+`));

  // A page of this course, and the first one: the course is complete, so the page it lands on is
  // one the reader has already finished.
  await button.click();
  await page.waitForLoadState("networkidle");
  await expect(lessonBar(page)).toContainText(/Page 1 of \d+/);
  await expect(actionRow(page).getByRole("button")).toHaveAttribute("aria-pressed", "true");
});
