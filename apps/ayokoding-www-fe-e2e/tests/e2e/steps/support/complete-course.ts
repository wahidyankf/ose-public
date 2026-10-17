import { expect, type Page } from "@playwright/test";

/**
 * The lesson action row's completion target (tech-docs/006 E2E Techniques). Every lesson page of a
 * course puts "Mark complete & continue" in the `Page navigation` landmark; its accessible name
 * starts with that label and continues with the target's second line ("Next: <title>",
 * "Next course: <title>", "Back to the path", or "Back to the course").
 */
const MARK_COMPLETE_CONTINUE = /^Mark complete & continue/;

/** The lesson context bar's `contextPageOf` line, e.g. "Page 3 of 6". */
const PAGE_OF_TOTAL = /Page (\d+) of (\d+)/;

/** The course landing header (`courseHeaderLabel`) the primary action lives in. */
const COURSE_HEADER = 'header[aria-label="Course summary"]';

/**
 * How many "Mark complete & continue" clicks one course may take before the helper fails the test.
 * No course in the library is remotely this long: the cap turns a walk that never leaves the course
 * (a redirect loop, a wrong link) into a failing test instead of a hung one.
 */
const MAX_CONTINUE_CLICKS = 60;

/**
 * Complete a course through the UI (plan ayokoding-learn-revamp-04, tech-docs/006 E2E Techniques).
 *
 * It opens the course landing page in path context, takes the header's primary action to the
 * course's first sequence page, then activates "Mark complete & continue" until the URL leaves
 * `/learn/courses/<courseId>/` — the next course of the path, the path page, or, without a path,
 * the course landing page.
 *
 * The walk never names a page of the course, so adding or renaming lesson pages cannot break a
 * caller that just needs the course finished. Each click is proven to have landed by the context
 * bar's next page position, so a stale page can never be clicked twice.
 *
 * @param courseId the course directory name, e.g. `just-enough-bash`.
 * @param pathId the path whose context the walk runs in, e.g.
 *   `careers/immediately-effective/backend-track`.
 */
export async function completeCourseThroughUi(page: Page, courseId: string, pathId: string): Promise<void> {
  const courseRoot = `/en/learn/courses/${courseId}`;

  await page.goto(`${courseRoot}?path=${pathId}`);
  await page.waitForLoadState("networkidle");

  // The header's primary action is the only control inside the header that points at a page of
  // *this* course: plan 03 renders "Start course" to the plan-03 start slug, and plan 05 replaces
  // it with "Start course" / "Continue course: <page>" for the next unfinished page. Prerequisite
  // and "this course is part of" links point at course roots, so they never match the prefix.
  // (A future action rendered as a plain button rather than a link still matches through `button`.)
  await page.locator(COURSE_HEADER).locator(`a[href^="${courseRoot}/"], button`).first().click();
  await page.waitForURL((url) => url.pathname.startsWith(`${courseRoot}/`));

  let clicks = 0;
  while (isInsideCourse(page.url(), courseRoot)) {
    if (clicks === MAX_CONTINUE_CLICKS) {
      throw new Error(
        `completeCourseThroughUi: "${courseId}" is still on a page of the course after ` +
          `${MAX_CONTINUE_CLICKS} "Mark complete & continue" clicks (${page.url()}).`,
      );
    }
    await markCompleteAndContinue(page, courseRoot);
    clicks += 1;
  }
}

/** One step of the walk: mark this page complete, open the next stop, and prove it arrived. */
async function markCompleteAndContinue(page: Page, courseRoot: string): Promise<void> {
  const bar = page.getByRole("navigation", { name: "Lesson location" });
  await expect(bar).toContainText(PAGE_OF_TOTAL);
  const { page: position, total } = readPagePosition(await bar.innerText());
  const from = currentLocation(page);

  await page
    .getByRole("navigation", { name: "Page navigation" })
    .getByRole("link", { name: MARK_COMPLETE_CONTINUE })
    .click();
  await page.waitForURL((url) => `${url.pathname}${url.search}` !== from);

  // Still inside the course: the next page must be rendered before the next click, or the previous
  // page's still-mounted link would be clicked again (a navigation the test would wait out). The
  // bar's next position proves both.
  if (isInsideCourse(page.url(), courseRoot)) {
    await expect(bar).toContainText(`Page ${position + 1} of ${total}`);
  }
}

function readPagePosition(text: string): { page: number; total: number } {
  const match = PAGE_OF_TOTAL.exec(text);
  if (match === null) {
    throw new Error(`The lesson context bar shows no "Page p of P" line: ${JSON.stringify(text)}`);
  }
  return { page: Number(match[1] ?? Number.NaN), total: Number(match[2] ?? Number.NaN) };
}

function isInsideCourse(url: string, courseRoot: string): boolean {
  return new URL(url).pathname.startsWith(`${courseRoot}/`);
}

function currentLocation(page: Page): string {
  const url = new URL(page.url());
  return `${url.pathname}${url.search}`;
}
