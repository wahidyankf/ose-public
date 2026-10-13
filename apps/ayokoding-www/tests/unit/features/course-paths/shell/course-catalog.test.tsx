import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// eslint-disable-next-line import/first
import { CourseCatalog } from "../../../../../src/features/course-paths/shell/course-catalog";
import type { CourseCatalogGroup } from "../../../../../src/features/course-paths/core/course-catalog";

afterEach(cleanup);

const groups: CourseCatalogGroup[] = [
  {
    category: {
      id: "data-and-databases",
      order: 5,
      labelKey: "courseCategoryDataAndDatabases",
      blurbKey: "courseCategoryDataAndDatabasesBlurb",
    },
    entries: [
      {
        courseId: "sql-essentials",
        slug: "learn/courses/sql-essentials",
        title: "SQL Essentials",
        description: "Model data in tables and query it well.",
        format: "by-example",
        estimatedHours: 8,
        isOutline: false,
        pathCount: 2,
      },
      {
        courseId: "old-outline",
        slug: "learn/courses/old-outline",
        title: "Old Outline",
        description: "A course that is not written yet at all.",
        isOutline: true,
        pathCount: 0,
      },
    ],
  },
];

describe("CourseCatalog", () => {
  it("renders jump links, a headed section, and one link per card", () => {
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
    expect(screen.getByRole("heading", { name: /Data and databases/ })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Data and databases \(2\)/ }).getAttribute("href")).toBe(
      "#data-and-databases",
    );
    const card = screen.getByRole("link", { name: "SQL Essentials" });
    expect(card.getAttribute("href")).toBe("/en/learn/courses/sql-essentials");
    expect(screen.getByText("Code by example")).toBeTruthy();
    expect(screen.getByText("About 8 h")).toBeTruthy();
    expect(screen.getByText("In 2 paths")).toBeTruthy();
    expect(screen.getByText("Outline")).toBeTruthy();
    expect(screen.getByText(/2 courses in 1 categories\./)).toBeTruthy();
    const cardLink = screen.getByRole("link", { name: "SQL Essentials" });
    expect(cardLink.className).not.toMatch(/outline-none/);
    const section = screen.getByRole("heading", { name: /Data and databases/ }).closest("section")!;
    expect(
      within(section)
        .getAllByRole("link")
        .filter((a) => a.getAttribute("href")?.includes("/learning/")),
    ).toEqual([]);
  });
});
