import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PathManifest } from "../../../../../src/features/course-paths/core/schemas";
import type { RoadmapCourseData } from "../../../../../src/features/course-paths/shell/roadmap-course-card";
import { manifestFixture } from "../manifest-fixture";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// eslint-disable-next-line import/first
import { ArcLanding } from "../../../../../src/features/course-paths/shell/arc-landing";

afterEach(cleanup);

function manifest(
  overrides: Pick<PathManifest, "pathId" | "arc"> &
    Partial<Pick<PathManifest, "title">> & { courses?: readonly string[] },
): PathManifest {
  return manifestFixture({ description: "desc", ...overrides, title: overrides.title ?? overrides.pathId });
}

const courseTitles = {
  "just-enough-python": "Just Enough Python",
  "just-enough-bash": "Just Enough Bash",
  "version-control-and-git": "Version Control & Git",
};

const courseCards: Record<string, RoadmapCourseData> = {
  "just-enough-python": { title: "Just Enough Python", estimatedHours: 3, isOutline: false },
  "just-enough-bash": { title: "Just Enough Bash", estimatedHours: 4, isOutline: false },
  "version-control-and-git": { title: "Version Control & Git", estimatedHours: 7, isOutline: false },
};

const sequences = {
  "just-enough-python": ["learning/overview"],
  "just-enough-bash": ["learning/overview"],
  "version-control-and-git": ["learning/overview"],
};

describe("ArcLanding — two-role state (Cycle 3.1c-i, R7; plan 04 Phase 7)", () => {
  const roleA = manifest({
    pathId: "careers/immediately-effective/role-a",
    arc: "immediately-effective",
    title: "Role A",
    courses: ["just-enough-python"],
  });
  const roleB = manifest({
    pathId: "careers/immediately-effective/role-b",
    arc: "immediately-effective",
    title: "Role B",
    courses: ["just-enough-bash"],
  });

  it("renders both role cards side by side, no placeholder", () => {
    render(
      <ArcLanding
        locale="en"
        arc="immediately-effective"
        manifests={[roleA, roleB]}
        courseTitles={courseTitles}
        courseCards={courseCards}
        sequences={sequences}
      />,
    );

    const nav = within(screen.getByRole("navigation", { name: "immediately-effective paths" }));
    expect(nav.getAllByRole("link", { name: "Role A" })).toHaveLength(1);
    expect(nav.getAllByRole("link", { name: "Role B" })).toHaveLength(1);
  });

  it("renders each role through the shared learning path card, not the old hub PathCard", () => {
    const { container } = render(
      <ArcLanding
        locale="en"
        arc="immediately-effective"
        manifests={[roleA, roleB]}
        courseTitles={courseTitles}
        courseCards={courseCards}
        sequences={sequences}
      />,
    );

    expect(screen.getByRole("link", { name: "Role A" }).getAttribute("href")).toBe(
      "/en/learn/paths/careers/immediately-effective/role-a",
    );
    expect(screen.getAllByRole("link", { name: /View path/ }).length).toBe(2);
    // The removed hub card's course-count badge and CTA are gone.
    expect(screen.queryByText(/^\~\d+ courses$/)).toBeNull();
    expect(screen.queryByText("Start")).toBeNull();
    // The card states the path's size and time from the server-built course data.
    expect(container.textContent).toContain("1 core phase · 0 optional");
    expect(container.textContent).toContain("About 3 h");
  });

  it("renders exactly as many cards as roles — never a fixed 2-slot grid", () => {
    render(
      <ArcLanding
        locale="en"
        arc="immediately-effective"
        manifests={[roleA]}
        courseTitles={courseTitles}
        courseCards={courseCards}
        sequences={sequences}
      />,
    );

    const nav = screen.getByRole("navigation", { name: "immediately-effective paths" });
    expect(nav.querySelectorAll(":scope > ul > li").length).toBe(1);
  });
});

describe("ArcLanding — single-role state (Cycle 3.1c-ii, R7)", () => {
  const soloRole = manifest({
    pathId: "careers/interview-ready/solo-role",
    arc: "interview-ready",
    title: "Solo Role",
    courses: ["just-enough-python", "just-enough-bash", "version-control-and-git"],
  });

  it("renders one role card with a preview that names the first phase and lists its courses", () => {
    render(
      <ArcLanding
        locale="en"
        arc="interview-ready"
        manifests={[soloRole]}
        courseTitles={courseTitles}
        courseCards={courseCards}
        sequences={sequences}
      />,
    );

    expect(screen.getByRole("link", { name: "Solo Role" })).toBeTruthy();
    expect(screen.getByText("Starts with Phase 1 · Phase A:", { exact: false })).toBeTruthy();
    expect(screen.getByText(/Just Enough Python/)).toBeTruthy();
    expect(screen.getByText(/Just Enough Bash/)).toBeTruthy();
    expect(screen.getByText(/Version Control & Git/)).toBeTruthy();
  });

  it("never renders a second, visibly empty card", () => {
    const { container } = render(
      <ArcLanding
        locale="en"
        arc="interview-ready"
        manifests={[soloRole]}
        courseTitles={courseTitles}
        courseCards={courseCards}
        sequences={sequences}
      />,
    );

    const topLevelUl = container.querySelector("nav > ul");
    expect(topLevelUl?.children.length).toBe(1);
  });
});

describe("ArcLanding — empty state", () => {
  it("renders the shared empty state when the arc has no loaded manifest", () => {
    render(<ArcLanding locale="en" arc="fundamentally-strong" manifests={[]} courseTitles={{}} />);

    expect(screen.getByRole("alert")).toBeTruthy();
  });
});
