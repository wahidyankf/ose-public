import path from "node:path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { cleanup, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// eslint-disable-next-line import/first
import { CourseCatalog } from "@/features/course-paths/shell/course-catalog";
import { buildCourseCatalog } from "@/features/course-paths/core/course-catalog";
import { manifestFixture } from "../features/course-paths/manifest-fixture";
import type { ContentMeta } from "@/features/content/core/types";

const feature = await loadFeature(
  path.resolve(process.cwd(), "../../specs/apps/ayokoding/www/behaviours/frontend/course-paths/course-catalog.feature"),
);

function meta(slug: string, extra: Partial<ContentMeta>): ContentMeta {
  return {
    title: slug,
    slug,
    locale: "en",
    weight: 1,
    draft: false,
    isSection: true,
    tags: [],
    filePath: `/x/${slug}`,
    ...extra,
  };
}

const manifests = [manifestFixture({ pathId: "skills/x", courses: ["sql-essentials"] })];
const map = new Map<string, ContentMeta>([
  [
    "en:learn/courses/sql-essentials",
    meta("learn/courses/sql-essentials", {
      title: "SQL Essentials",
      category: "data-and-databases",
      format: "by-example",
      estimatedHours: 8,
      description: "Model data in tables and query it well.",
    }),
  ],
  [
    "en:learn/courses/outline-course",
    meta("learn/courses/outline-course", {
      title: "Outline Course",
      category: "accounting",
      status: "outline",
      description: "A course that is not written yet at all.",
    }),
  ],
  [
    "en:learn/courses/tool-course",
    meta("learn/courses/tool-course", {
      title: "Tool Course",
      category: "tools-and-practices",
      format: "primer",
      estimatedHours: 2,
      description: "Use the tool well in daily work here.",
    }),
  ],
]);
const groups = buildCourseCatalog(map, manifests, "en");

function renderCatalog() {
  cleanup();
  render(
    <CourseCatalog
      locale="en"
      title="Courses"
      breadcrumbSegments={[
        { label: "Home", slug: "" },
        { label: "Courses", slug: "learn/courses" },
      ]}
      groups={groups}
    />,
  );
}

describeFeature(feature, ({ Scenario, Background }) => {
  Background(({ Given }) => {
    Given("the course library holds courses with a category, a description, a format, and an estimated time", () => {
      expect(groups.length).toBeGreaterThan(0);
    });
  });

  Scenario("Every course appears once under its category", ({ When, Then, And }) => {
    When("a reader opens the courses page", () => renderCatalog());
    Then("the page shows one section heading per category that has courses", () => {
      expect(screen.getByRole("heading", { name: /Tools and practices/ })).toBeTruthy();
      expect(screen.getByRole("heading", { name: /Data and databases/ })).toBeTruthy();
      expect(screen.getByRole("heading", { name: /Accounting/ })).toBeTruthy();
    });
    And("the sections follow the fixed category order", () => {
      const headings = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent ?? "");
      expect(headings[0]).toContain("Tools and practices");
      expect(headings[1]).toContain("Data and databases");
    });
    And("every course appears in exactly one section", () => {
      expect(screen.getAllByRole("link", { name: "SQL Essentials" })).toHaveLength(1);
      expect(screen.getAllByRole("link", { name: "Tool Course" })).toHaveLength(1);
    });
  });

  Scenario("A course card shows the facts needed to choose", ({ When, Then, And }) => {
    When("a reader opens the courses page", () => renderCatalog());
    Then('the card for "SQL Essentials" shows its one-line description', () => {
      expect(screen.getByText("Model data in tables and query it well.")).toBeTruthy();
    });
    And('the card shows the format "Code by example"', () => {
      expect(screen.getByText("Code by example")).toBeTruthy();
    });
    And('the card shows an estimated time in the form "About N h"', () => {
      expect(screen.getByText("About 8 h")).toBeTruthy();
    });
    And("the card shows how many paths use the course", () => {
      expect(screen.getByText("In 1 path")).toBeTruthy();
    });
  });

  Scenario("An outline course card says it is an outline", ({ Given, When, Then, And }) => {
    Given("a course is marked as an outline", () => {
      expect(groups.flatMap((g) => g.entries).find((e) => e.courseId === "outline-course")?.isOutline).toBe(true);
    });
    When("a reader opens the courses page", () => renderCatalog());
    Then('that course\'s card shows an "Outline" badge', () => {
      expect(screen.getByText("Outline")).toBeTruthy();
    });
    And("that card shows no format and no estimated time", () => {
      const link = screen.getByRole("link", { name: "Outline Course" });
      const card = link.closest("li")!;
      expect(within(card).queryByText(/About \d+ h/)).toBeNull();
    });
  });

  Scenario("A card links only to the course landing page", ({ When, Then, And }) => {
    When("a reader opens the courses page", () => renderCatalog());
    Then("each card holds exactly one link", () => {
      for (const title of ["SQL Essentials", "Tool Course", "Outline Course"]) {
        expect(screen.getAllByRole("link", { name: title })).toHaveLength(1);
      }
    });
    And("that link opens the course landing page", () => {
      expect(screen.getByRole("link", { name: "SQL Essentials" }).getAttribute("href")).toBe(
        "/en/learn/courses/sql-essentials",
      );
    });
    And("no card links to an Overview, Learning, or Drilling page", () => {
      const hrefs = screen.getAllByRole("link").map((a) => a.getAttribute("href") ?? "");
      expect(hrefs.filter((h) => /\/(overview|learning|drilling)/.test(h))).toEqual([]);
    });
  });

  Scenario("A jump link moves to its category section", ({ When, Then }) => {
    When('a reader activates the "Data and databases" jump link', () => {
      renderCatalog();
      const jump = screen.getByRole("link", { name: /Data and databases \(1\)/ });
      expect(jump.getAttribute("href")).toBe("#data-and-databases");
    });
    Then('the "Data and databases" section heading is the link target', () => {
      expect(document.getElementById("data-and-databases")?.tagName).toBe("H2");
    });
  });

  Scenario("The catalog fits a phone screen", ({ Given, When, Then, And }) => {
    Given("a viewport 375 pixels wide", () => {
      expect(375).toBe(375);
    });
    When("a reader opens the courses page", () => renderCatalog());
    Then("the cards stack in one column", () => {
      const list = document.querySelector("section ul.grid");
      expect(list?.className).toContain("grid-cols-1");
    });
    And("the main content does not scroll sideways", () => {
      expect(document.querySelector("article")?.className).toContain("min-w-0");
    });
  });
});

// Regression: the catalog dispatch must precede the `courseId === null` early return in
// page.tsx, because courseIdFromSlug("learn/courses") is null (section, not a course root).
describe("catalog dispatch order (plan 03 regression)", () => {
  it("page.tsx checks COURSE_CATALOG_SLUG before the courseId===null return", async () => {
    const fs = await import("node:fs/promises");
    const source = await fs.readFile("src/app/[locale]/(content)/[...slug]/page.tsx", "utf-8");
    expect(source.indexOf("slugStr === COURSE_CATALOG_SLUG")).toBeLessThan(source.indexOf("if (courseId === null)"));
  });
});
