import path from "node:path";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { expect, vi } from "vitest";
import "./helpers/test-setup";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/features/course-paths/shell/use-runtime-course-path-data", () => ({
  useRuntimeCoursePathData: (_locale: string, initial: unknown) => ({ data: initial, isReady: true }),
}));

// eslint-disable-next-line import/first
import { CoursePageContent } from "@/features/course-paths/shell/course-page-content";
// eslint-disable-next-line import/first
import type { CourseHeaderData } from "@/features/course-paths/shell/course-header-data";
// eslint-disable-next-line import/first
import type { LessonPage } from "@/features/learning-progress/core/lesson-sequence";
// eslint-disable-next-line import/first
import { BASH_SEQUENCE } from "../features/learning-progress/lesson-fixtures";
// eslint-disable-next-line import/first
import { completedPages, completionToggle, noSavedProgress, openLessonPage } from "./helpers/lesson-page";

const feature = await loadFeature(
  path.resolve(
    process.cwd(),
    "../../specs/apps/ayokoding/www/behaviours/frontend/learning-progress/course-landing-progress.feature",
  ),
);

const COURSE_ID = "just-enough-bash";
const COURSE_ROOT_SLUG = `learn/courses/${COURSE_ID}`;

/**
 * The course landing header plan 03 builds for this course: every scenario here renders the real
 * `CoursePageContent` with the header data and the two plan-04 slots the page supplies, so a unit
 * assertion and its browser binding describe the same page.
 */
const HEADER: CourseHeaderData = {
  courseId: COURSE_ID,
  description: "Write shell scripts that do real work.",
  category: null,
  format: "primer",
  estimatedHours: 3,
  isOutline: false,
  startSlug: `${COURSE_ROOT_SLUG}/learning/overview`,
};

/** The header for a course root page; no `?path=` is in play, exactly like the E2E binding. */
function renderCourseLanding(): void {
  cleanup();
  render(
    <CoursePageContent
      locale="en"
      slug={COURSE_ROOT_SLUG}
      title="Just Enough Bash"
      html="<p>Course body.</p>"
      headings={[]}
      breadcrumbSegments={[{ label: "Home", slug: "" }]}
      renderData={{ activeContext: null, prerequisiteLinks: [], pathBadges: [], prev: null, next: null }}
      courseId={COURSE_ID}
      courseHeader={HEADER}
      courseHeaderProgress={{ courseId: COURSE_ID, sequence: BASH_SEQUENCE.map((page) => page.pagePath) }}
      courseHeaderAction={{ courseId: COURSE_ID, sequence: BASH_SEQUENCE, startSlug: HEADER.startSlug }}
    />,
  );
}

/** The course landing header's landmark (`courseHeaderLabel`). */
function courseHeader(): HTMLElement {
  return screen.getByRole("region", { name: "Course summary" });
}

/** One page of the course's sequence, or a failure that names the missing position. */
function sequencePage(index: number): LessonPage {
  const page = BASH_SEQUENCE[index];
  if (page === undefined) {
    throw new Error(`The fixture course has no page at position ${index}`);
  }
  return page;
}

/** Mark pages complete through the lesson page's own completion control — the only writer (S18). */
function markPagesComplete(pagePaths: readonly string[]): void {
  for (const pagePath of pagePaths) {
    openLessonPage({ pagePath });
    expect(completionToggle().getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(completionToggle());
    expect(completionToggle().getAttribute("aria-pressed")).toBe("true");
  }
}

describeFeature(feature, ({ Scenario, Background }) => {
  Background(({ Given }) => {
    Given("the app is running", () => {
      noSavedProgress();
    });
  });

  Scenario("A started course shows its progress and a Continue button", ({ Given, When, Then, And }) => {
    Given("a reader completed the first two learning pages of a course", () => {
      noSavedProgress();
      markPagesComplete(BASH_SEQUENCE.slice(0, 2).map((page) => page.pagePath));
      expect(completedPages()).toHaveLength(2);
    });

    When("the reader opens the course landing page", () => {
      renderCourseLanding();
    });

    Then('the header shows "In progress" and "2 of P pages done"', () => {
      expect(within(courseHeader()).getByText("In progress")).toBeTruthy();
      expect(within(courseHeader()).getByText(`2 of ${BASH_SEQUENCE.length} pages done`)).toBeTruthy();
    });

    And(`the main button reads "Continue course:" followed by the third page's title and links to it`, () => {
      const third = sequencePage(2);
      const link = within(courseHeader()).getByRole("link", { name: `Continue course: ${third.title}` });

      expect(link.getAttribute("href")).toBe(`/en/learn/courses/${COURSE_ID}/${third.pagePath}`);
    });
  });

  Scenario("A finished course offers a review", ({ Given, When, Then, And }) => {
    Given("a reader completed every learning page of a course", () => {
      noSavedProgress();
      markPagesComplete(BASH_SEQUENCE.map((page) => page.pagePath));
      expect(completedPages()).toHaveLength(BASH_SEQUENCE.length);
    });

    When("the reader opens the course landing page", () => {
      renderCourseLanding();
    });

    Then('the header shows "Done" and "P of P pages done"', () => {
      expect(within(courseHeader()).getByText("Done")).toBeTruthy();
      expect(
        within(courseHeader()).getByText(`${BASH_SEQUENCE.length} of ${BASH_SEQUENCE.length} pages done`),
      ).toBeTruthy();
    });

    And('the main button reads "Review course" and links to the first learning page', () => {
      const first = sequencePage(0);
      const link = within(courseHeader()).getByRole("link", { name: "Review course" });

      expect(link.getAttribute("href")).toBe(`/en/learn/courses/${COURSE_ID}/${first.pagePath}`);
    });
  });
});
