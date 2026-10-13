import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// eslint-disable-next-line import/first
import { CourseHeader } from "../../../../../src/features/course-paths/shell/course-header";
import type { CourseHeaderData } from "../../../../../src/features/course-paths/shell/course-header-data";

afterEach(cleanup);

const data: CourseHeaderData = {
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

describe("CourseHeader", () => {
  it("shows description, meta, prerequisites, paths, and Start", () => {
    render(
      <CourseHeader
        locale="en"
        data={data}
        prerequisites={[{ title: "Just Enough Python", slug: "learn/courses/just-enough-python" }]}
        pathBadges={[{ pathId: "skills/x", title: "X Path" }]}
        showPathBadges
      />,
    );
    expect(screen.getByText("Model data in tables and query it well.")).toBeTruthy();
    expect(screen.getByText("Code by example")).toBeTruthy();
    expect(screen.getByText("About 8 h")).toBeTruthy();
    expect(screen.getByText("Data and databases")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Just Enough Python" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "X Path" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Start course" }).getAttribute("href")).toBe(
      "/en/learn/courses/sql-essentials/learning/overview",
    );
    expect(screen.getByRole("region", { name: "Course summary" })).toBeTruthy();
  });

  it("keeps ?path= on Start and renders both plan-04 slots", () => {
    render(
      <CourseHeader
        locale="en"
        data={data}
        prerequisites={[]}
        pathBadges={[]}
        showPathBadges={false}
        activePathId="skills/x"
        primaryAction={<span>Continue custom</span>}
        progress={<span>Progress here</span>}
      />,
    );
    expect(screen.getByText("Continue custom")).toBeTruthy();
    expect(screen.getByText("Progress here")).toBeTruthy();
    cleanup();
    render(
      <CourseHeader
        locale="en"
        data={data}
        prerequisites={[]}
        pathBadges={[]}
        showPathBadges={false}
        activePathId="skills/x"
      />,
    );
    expect(screen.getByRole("link", { name: "Start course" }).getAttribute("href")).toBe(
      "/en/learn/courses/sql-essentials/learning/overview?path=skills/x",
    );
  });

  it("renders no Start button without a start slug, and no time for outlines", () => {
    render(
      <CourseHeader
        locale="en"
        data={{ ...data, startSlug: null, isOutline: true }}
        prerequisites={[]}
        pathBadges={[]}
        showPathBadges={false}
      />,
    );
    expect(screen.queryByRole("link", { name: "Start course" })).toBeNull();
    expect(screen.getByText("Outline")).toBeTruthy();
    expect(screen.queryByText("About 8 h")).toBeNull();
  });
});
