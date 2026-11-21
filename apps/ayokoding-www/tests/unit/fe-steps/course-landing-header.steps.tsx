import path from "node:path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { cleanup, render, screen } from "@testing-library/react";
import { expect, vi } from "vitest";
import "./helpers/test-setup";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// eslint-disable-next-line import/first
import { CoursePageContent } from "@/features/course-paths/shell/course-page-content";
import type { CourseHeaderData } from "@/features/course-paths/shell/course-header-data";
import type { CoursePathRenderData } from "@/features/course-paths/shell/course-path-nav";

const feature = await loadFeature(
  path.resolve(
    process.cwd(),
    "../../specs/apps/ayokoding/www/behaviours/frontend/course-paths/course-landing-header.feature",
  ),
);

const header: CourseHeaderData = {
  courseId: "sql-essentials",
  description: "Model data in tables and query it well.",
  category: {
    id: "data-and-databases",
    order: 5,
    labelKey: "courseCategoryDataAndDatabases",
    blurbKey: "courseCategoryDataAndDatabasesBlurb",
  },
  format: "by-example",
  estimatedHours: 8,
  isOutline: false,
  startSlug: "learn/courses/sql-essentials/learning/overview",
};

const renderData: CoursePathRenderData = {
  activeContext: null,
  prerequisiteLinks: [{ title: "Just Enough Python", slug: "learn/courses/just-enough-python" }],
  pathBadges: [{ pathId: "skills/x", title: "X Path" }],
  prev: null,
  next: null,
};

function renderCourse(headerData: CourseHeaderData | undefined) {
  cleanup();
  render(
    <CoursePageContent
      locale="en"
      slug="learn/courses/sql-essentials"
      title="SQL Essentials"
      html="<p>Contents list here.</p>"
      headings={[]}
      breadcrumbSegments={[
        { label: "Home", slug: "" },
        { label: "SQL Essentials", slug: "learn/courses/sql-essentials" },
      ]}
      renderData={renderData}
      courseId="sql-essentials"
      courseHeader={headerData}
    />,
  );
}

describeFeature(feature, ({ Scenario, ScenarioOutline }) => {
  // @scenario specs/apps/ayokoding/www/behaviours/frontend/course-paths/course-landing-header.feature: The header shows description, format, time, and category
  Scenario("The header shows description, format, time, and category", ({ Given, When, Then, And }) => {
    Given("a course with a description, a format, an estimated time, a category, and prerequisites", () => {
      expect(header.description).toBeTruthy();
    });
    When("a reader opens the course landing page", () => renderCourse(header));
    Then("the header shows the description under the title", () => {
      expect(screen.getByText("Model data in tables and query it well.")).toBeTruthy();
    });
    And("the header shows the format, the estimated time, and the category", () => {
      expect(screen.getByText("Code by example")).toBeTruthy();
      expect(screen.getByText("About 8 h")).toBeTruthy();
      expect(screen.getByText("Data and databases")).toBeTruthy();
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/course-paths/course-landing-header.feature: The header lists the paths that use the course
  Scenario("The header lists the paths that use the course", ({ Given, When, Then }) => {
    Given("a course with a description, a format, an estimated time, a category, and prerequisites", () => {
      expect(header.description).toBeTruthy();
    });
    When("a reader opens the course landing page", () => renderCourse(header));
    Then("the header lists the paths that use the course as links", () => {
      expect(screen.getByRole("link", { name: "X Path" })).toBeTruthy();
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/course-paths/course-landing-header.feature: Start course opens the best first page
  ScenarioOutline("Start course opens the best first page", ({ Given, When, Then, And }, variables) => {
    // The Start target of each example course is the page the examples name; the header must link to it.
    let startSlug = "";
    Given("the course <course> is open on its landing page", () => {
      startSlug = String(variables["best first page"]).replace(/^\/en\//, "");
      expect(startSlug).toBeTruthy();
    });
    When('a reader activates "Start course" on the course landing page', () => renderCourse({ ...header, startSlug }));
    Then("the page <best first page> opens", () => {
      expect(screen.getByRole("link", { name: "Start course" }).getAttribute("href")).toBe(
        String(variables["best first page"]),
      );
    });
    And("that page is not inside a folder that has no index page", () => {
      expect(screen.getByRole("link", { name: "Start course" }).getAttribute("href")).not.toContain("artifacts");
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/course-paths/course-landing-header.feature: The course contents list follows the header
  Scenario("The course contents list follows the header", ({ When, Then }) => {
    When("a reader opens the course landing page", () => renderCourse(header));
    Then('the "Course contents" heading and the list of course pages appear after the header', () => {
      const heading = screen.getByRole("heading", { name: "Course contents" });
      const headerEl = document.querySelector("header")!;
      expect(headerEl.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(screen.getByText("Contents list here.")).toBeTruthy();
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/course-paths/course-landing-header.feature: A course page shows its prerequisites list and its paths list at most once
  Scenario("A course page shows its prerequisites list and its paths list at most once", ({ When, Then, And }) => {
    When("a reader opens the course landing page", () => renderCourse(header));
    Then("the page has exactly one prerequisites list", () => {
      expect(screen.getAllByRole("navigation", { name: "Prerequisites" })).toHaveLength(1);
    });
    And('the page has at most one "This course is part of" list', () => {
      expect(screen.getAllByRole("navigation", { name: "This course is part of" }).length).toBeLessThanOrEqual(1);
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/course-paths/course-landing-header.feature: An outline course header says it is an outline
  Scenario("An outline course header says it is an outline", ({ Given, When, Then, And }) => {
    Given("a course is marked as an outline", () => {
      expect(true).toBe(true);
    });
    When("a reader opens the course landing page", () => renderCourse({ ...header, isOutline: true }));
    Then('the header shows an "Outline" badge', () => {
      expect(screen.getByText("Outline")).toBeTruthy();
    });
    And("the header shows no estimated time", () => {
      expect(screen.queryByText("About 8 h")).toBeNull();
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/course-paths/course-landing-header.feature: Pages inside a course have no header
  Scenario("Pages inside a course have no header", ({ When, Then }) => {
    When("a reader opens a learning page inside a course", () => renderCourse(undefined));
    Then("no course header is shown", () => {
      expect(document.querySelector("header")).toBeNull();
      expect(screen.queryByRole("link", { name: "Start course" })).toBeNull();
    });
  });
});
