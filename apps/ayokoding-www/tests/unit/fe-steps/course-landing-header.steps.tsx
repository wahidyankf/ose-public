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

describeFeature(feature, ({ Scenario }) => {
  Scenario("The header summarizes the course", ({ Given, When, Then, And }) => {
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
    And("the header lists the prerequisites as links", () => {
      expect(screen.getByRole("link", { name: "Just Enough Python" })).toBeTruthy();
    });
    And("the header lists the paths that use the course as links", () => {
      expect(screen.getByRole("link", { name: "X Path" })).toBeTruthy();
    });
  });

  Scenario("Start opens the learning overview", ({ Given, When, Then }) => {
    Given("a course has a learning overview page", () => {
      expect(header.startSlug).toContain("learning/overview");
    });
    When('a reader activates "Start course" on the course landing page', () => renderCourse(header));
    Then("the learning overview page of that course opens", () => {
      expect(screen.getByRole("link", { name: "Start course" }).getAttribute("href")).toBe(
        "/en/learn/courses/sql-essentials/learning/overview",
      );
    });
  });

  Scenario("Start falls back to the first learning page", ({ Given, When, Then, And }) => {
    Given("a course has a learning folder without an overview page", () => {
      expect(true).toBe(true);
    });
    When('a reader activates "Start course" on the course landing page', () =>
      renderCourse({ ...header, startSlug: "learn/courses/x/learning/capstone/start" }),
    );
    Then("the first learning page in reading order opens", () => {
      expect(screen.getByRole("link", { name: "Start course" }).getAttribute("href")).toBe(
        "/en/learn/courses/x/learning/capstone/start",
      );
    });
    And("that page is not inside a folder that has no index page", () => {
      expect(screen.getByRole("link", { name: "Start course" }).getAttribute("href")).not.toContain("artifacts");
    });
  });

  Scenario("Start falls back to the course overview", ({ Given, When, Then }) => {
    Given("a course has no learning folder but has a top-level overview page", () => {
      expect(true).toBe(true);
    });
    When('a reader activates "Start course" on the course landing page', () =>
      renderCourse({ ...header, startSlug: "learn/courses/x/overview" }),
    );
    Then("the course's overview page opens", () => {
      expect(screen.getByRole("link", { name: "Start course" }).getAttribute("href")).toBe(
        "/en/learn/courses/x/overview",
      );
    });
  });

  Scenario("The page list stays below the header", ({ When, Then, And }) => {
    When("a reader opens the course landing page", () => renderCourse(header));
    Then('the "Course contents" heading and the list of course pages appear after the header', () => {
      const heading = screen.getByRole("heading", { name: "Course contents" });
      const headerEl = document.querySelector("header")!;
      expect(headerEl.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(screen.getByText("Contents list here.")).toBeTruthy();
    });
    And("the page has exactly one prerequisites list", () => {
      expect(screen.getAllByRole("navigation", { name: "Prerequisites" })).toHaveLength(1);
    });
    And('the page has at most one "This course is part of" list', () => {
      expect(screen.getAllByRole("navigation", { name: "This course is part of" }).length).toBeLessThanOrEqual(1);
    });
  });

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

  Scenario("Pages inside a course have no header", ({ When, Then }) => {
    When("a reader opens a learning page inside a course", () => renderCourse(undefined));
    Then("no course header is shown", () => {
      expect(document.querySelector("header")).toBeNull();
      expect(screen.queryByRole("link", { name: "Start course" })).toBeNull();
    });
  });
});
